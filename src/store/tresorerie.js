import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tresorerieApi, invalidateJournalCache } from '@/api/tresorerie/client.js'
import { fetchPenEurRate, penToEur } from '@/api/tresorerie/exchangeRate.js'

const CACHE_TTL = {
  pending: 30_000,
  history: 120_000,
  compta: 120_000,
  mine: 60_000,
  access: 60_000,
  approved: 60_000,
  exchangeRate: 86_400_000
}

const VALIDATION_POLL_MS = 45_000

/** Évite les appels réseau en double (parent + enfant, onglets rapides). */
function dedupeFetch(key, inflight, fn) {
  if (inflight[key]) return inflight[key]
  inflight[key] = fn().finally(() => { delete inflight[key] })
  return inflight[key]
}

export const useTresorerieStore = defineStore('tresorerie', () => {
  const _inflight = {}
  const _fetchedAt = {}
  const exchangeRate = ref(null)
  const myDemandes = ref([])
  const pendingDemandes = ref([])
  const pendingFactures = ref([])
  const pendingReimbursements = ref([])
  const approvedDemandes = ref([])
  const history = ref({ demandes: [], factures: [], audit: [] })
  const compta = ref({ journal: [], summary: null })
  const pendingAccessRequests = ref([])
  const validationError = ref(null)
  const validationVersion = ref('')
  let _validationPollTimer = null
  const historyError = ref(null)
  const historyLoading = ref(false)
  const historyProgress = ref(0)
  const historyProgressLabel = ref('')
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function loadExchangeRate(force = false) {
    if (!force && exchangeRate.value && _fetchedAt.exchangeRate &&
      Date.now() - _fetchedAt.exchangeRate < CACHE_TTL.exchangeRate) return
    return dedupeFetch('exchangeRate', _inflight, async () => {
      try {
        exchangeRate.value = await tresorerieApi.getExchangeRate()
      } catch {
        exchangeRate.value = await fetchPenEurRate()
      }
      _fetchedAt.exchangeRate = Date.now()
    })
  }

  function previewEur(amountPen) {
    if (!exchangeRate.value?.rate || !amountPen) return null
    return penToEur(amountPen, exchangeRate.value.rate)
  }

  async function submitDemande(payload, devisFiles = [], opts = {}) {
    const background = Boolean(opts.background)
    const apiOpts = { onProgress: opts.onProgress, signal: opts.signal }
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      const created = await tresorerieApi.createDemande(payload, devisFiles, apiOpts)
      if (!background) {
        successMessage.value = `Demande ${created.reference} envoyée au trésorier.`
        delete _fetchedAt.mine
        delete _fetchedAt.pending
        await refreshMine(true)
      } else {
        delete _fetchedAt.mine
        delete _fetchedAt.pending
      }
      return created
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function submitFacture(payload, file) {
    clearMessages()
    loading.value = true
    try {
      const created = await tresorerieApi.createFacture(payload, file)
      successMessage.value = `Facture ${created.reference} soumise.`
      delete _fetchedAt.approved
      await loadApprovedDemandes(true)
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Lot de factures bénévole.
   * opts.background : envoi piloté par la file d'upload (useUploadQueue) —
   * ne touche ni `loading` (global) ni les bandeaux, pour que le reste de
   * l'interface reste utilisable. opts.onProgress / opts.signal sont relayés à l'API.
   */
  async function submitFacturesBatch(sharedPayload, items, opts = {}) {
    const background = Boolean(opts.background)
    const apiOpts = { onProgress: opts.onProgress, signal: opts.signal }
    if (!background) {
      clearMessages()
      loading.value = true
    }
    let created = []
    try {
      try {
        const batch = await tresorerieApi.createFacturesBatch(sharedPayload, items, apiOpts)
        created = batch.factures || []
      } catch (batchErr) {
        if (batchErr.code !== 'NOT_FOUND') throw batchErr
        for (const item of items) {
          created.push(await tresorerieApi.createFacture(
            {
              ...sharedPayload,
              expense_date: item.expense_date,
              amount: item.amount,
              vendor_name: item.vendor_name,
              receipt_number: item.receipt_number || ''
            },
            item.file,
            apiOpts
          ))
        }
      }
      const refs = created.map((f) => f.reference).join(', ')
      if (!background) {
        successMessage.value =
          created.length > 1
            ? `${created.length} factures enregistrées (brouillon) : ${refs}`
            : `Facture ${refs} enregistrée (brouillon).`
      }
      delete _fetchedAt.approved
      return created
    } catch (e) {
      if (created.length) {
        // U6 — erreur partielle : détail fichier par fichier pour la barre d'envoi
        e.partial = items.map((item, i) => ({
          name: item.vendor_name || item.file?.name || `Facture ${i + 1}`,
          ok: i < created.length,
          error: i === created.length ? e.message : (i > created.length ? 'non envoyée' : '')
        }))
        e.message = `${created.length} facture(s) enregistrée(s), puis erreur : ${e.message}`
      }
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function refreshMine(force = false) {
    if (force) delete _fetchedAt.mine
    else if (_fetchedAt.mine && Date.now() - _fetchedAt.mine < CACHE_TTL.mine) return
    return dedupeFetch('mine', _inflight, async () => {
      myDemandes.value = await tresorerieApi.getDemandesMine()
      _fetchedAt.mine = Date.now()
    })
  }

  function applyValidationQueue(queue) {
    pendingDemandes.value = Array.isArray(queue?.demandes) ? queue.demandes : []
    pendingFactures.value = Array.isArray(queue?.factures) ? queue.factures : []
    pendingReimbursements.value = Array.isArray(queue?.reimbursements) ? queue.reimbursements : []
    validationVersion.value = queue?.version?.version ?? validationVersion.value
  }

  async function refreshPending(force = false) {
    if (force) delete _fetchedAt.pending
    else if (_fetchedAt.pending && Date.now() - _fetchedAt.pending < CACHE_TTL.pending) return
    return dedupeFetch('pending', _inflight, async () => {
      validationError.value = null
      try {
        try {
          const queue = await tresorerieApi.getValidationQueue()
          applyValidationQueue(queue)
        } catch (queueErr) {
          if (queueErr.code !== 'NOT_FOUND') throw queueErr
          const [dem, fac, reimb] = await Promise.all([
            tresorerieApi.getDemandesPending(),
            tresorerieApi.getFacturesPending(),
            tresorerieApi.getReimbursementsPending().catch(() => [])
          ])
          applyValidationQueue({
            demandes: dem,
            factures: fac,
            reimbursements: reimb
          })
        }
        _fetchedAt.pending = Date.now()
      } catch (e) {
        validationError.value = e.message || 'Impossible de charger les files d\'attente'
        pendingDemandes.value = []
        pendingFactures.value = []
      }
    })
  }

  async function pollValidationVersion() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    try {
      const v = await tresorerieApi.getValidationVersion()
      const next = v?.version ?? ''
      if (next && next !== validationVersion.value) {
        validationVersion.value = next
        await refreshPending(true)
      } else if (next) {
        validationVersion.value = next
      }
    } catch {
      /* backend ancien ou hors ligne */
    }
  }

  function startValidationPolling() {
    stopValidationPolling()
    _validationPollTimer = setInterval(pollValidationVersion, VALIDATION_POLL_MS)
  }

  function stopValidationPolling() {
    if (_validationPollTimer) {
      clearInterval(_validationPollTimer)
      _validationPollTimer = null
    }
  }

  async function refreshReimbursements() {
    try {
      pendingReimbursements.value = await tresorerieApi.getReimbursementsPending()
    } catch {
      pendingReimbursements.value = []
    }
  }

  async function loadApprovedDemandes(force = false) {
    if (force) delete _fetchedAt.approved
    else if (_fetchedAt.approved && Date.now() - _fetchedAt.approved < CACHE_TTL.approved) return
    return dedupeFetch('approved', _inflight, async () => {
      approvedDemandes.value = await tresorerieApi.getApprovedDemandReferences()
      _fetchedAt.approved = Date.now()
    })
  }

  async function validateDemandeDevis(reference, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.validateDemandeDevis(reference)
      if (!background) {
        successMessage.value = `Devis validés pour ${reference}.`
        delete _fetchedAt.history
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function rejectDemandeDevis(reference, reason, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.rejectDemandeDevis(reference, reason)
      if (!background) {
        successMessage.value = `Devis refusés pour ${reference} · le bénévole a été notifié.`
        delete _fetchedAt.history
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function resubmitDemandeDevis(reference, devisFiles, opts = {}) {
    const background = Boolean(opts.background)
    const apiOpts = { onProgress: opts.onProgress, signal: opts.signal }
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.resubmitDemandeDevis(reference, devisFiles, apiOpts)
      if (!background) {
        successMessage.value = `Nouveaux devis envoyés pour ${reference}.`
        delete _fetchedAt.history
        await refreshMine()
      } else {
        delete _fetchedAt.history
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function approveDemande(reference, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      const approved = await tresorerieApi.approveDemande(reference)
      if (!background) {
        successMessage.value = `${reference} approuvée · email simulé.`
        delete _fetchedAt.history
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
      }
      return approved
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function rejectDemande(reference, reason, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.rejectDemande(reference, reason)
      if (!background) {
        successMessage.value = `${reference} refusée.`
        delete _fetchedAt.history
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function markReimbursed(reference, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.reimburseFacture(reference)
      if (!background) {
        successMessage.value = `${reference} marquée remboursée.`
        await refreshReimbursements()
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function validateFacture(reference, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.validateFacture(reference)
      if (!background) {
        successMessage.value = `${reference} validée · écriture journal.`
        delete _fetchedAt.history
        delete _fetchedAt.compta
        invalidateJournalCache()
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
        delete _fetchedAt.compta
        invalidateJournalCache()
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function closeDemandeInvoicing(reference) {
    clearMessages()
    loading.value = true
    try {
      const demande = await tresorerieApi.closeDemandeInvoicing(reference)
      successMessage.value = `Devis ${reference} clôturé — ${demande.pending_facture_count ?? ''} facture(s) envoyée(s) au trésorier.`
      delete _fetchedAt.approved
      await loadApprovedDemandes(true)
      return demande
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateDemandeFactures(reference, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      const result = await tresorerieApi.validateDemandeFactures(reference)
      if (!background) {
        successMessage.value = `${result.count} facture(s) validée(s) pour ${reference} · journal à jour.`
        delete _fetchedAt.history
        delete _fetchedAt.compta
        invalidateJournalCache()
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
        delete _fetchedAt.compta
        invalidateJournalCache()
      }
      return result
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function rejectFacture(reference, reason, opts = {}) {
    const background = Boolean(opts.background)
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      await tresorerieApi.rejectFacture(reference, reason)
      if (!background) {
        successMessage.value = `${reference} refusée.`
        delete _fetchedAt.history
        await refreshPending(true)
      } else {
        delete _fetchedAt.history
      }
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function loadHistory(force = false) {
    if (force) {
      delete _fetchedAt.history
      delete _inflight.history
    } else if (_fetchedAt.history && Date.now() - _fetchedAt.history < CACHE_TTL.history) {
      return
    }
    if (_inflight.history) return _inflight.history

    historyLoading.value = true
    historyError.value = null
    historyProgress.value = 8
    historyProgressLabel.value = 'Connexion au serveur…'

    _inflight.history = (async () => {
      try {
        historyProgress.value = 40
        historyProgressLabel.value = 'Demandes, factures et audit…'
        const data = await tresorerieApi.getHistory({ limit: 500 })
        historyProgress.value = 96
        history.value = {
          demandes: Array.isArray(data?.demandes) ? data.demandes : [],
          factures: Array.isArray(data?.factures) ? data.factures : [],
          audit: Array.isArray(data?.audit) ? data.audit : []
        }
        _fetchedAt.history = Date.now()
      } catch (e) {
        historyError.value = e.message || 'Chargement historique impossible'
        history.value = { demandes: [], factures: [], audit: [] }
      } finally {
        historyProgress.value = 100
        historyLoading.value = false
        delete _inflight.history
        setTimeout(() => {
          if (!historyLoading.value) {
            historyProgress.value = 0
            historyProgressLabel.value = ''
          }
        }, 500)
      }
    })()

    return _inflight.history
  }

  async function loadCompta(force = false) {
    if (force) delete _fetchedAt.compta
    else if (_fetchedAt.compta && Date.now() - _fetchedAt.compta < CACHE_TTL.compta &&
      compta.value?.journal?.length) return
    return dedupeFetch('compta', _inflight, async () => {
      compta.value = await tresorerieApi.getCompta()
      _fetchedAt.compta = Date.now()
    })
  }

  async function refreshAccessRequests(force = false) {
    if (!force && _fetchedAt.access && Date.now() - _fetchedAt.access < CACHE_TTL.access) return
    return dedupeFetch('access', _inflight, async () => {
      try {
        pendingAccessRequests.value = await tresorerieApi.getAccessRequestsPending()
        _fetchedAt.access = Date.now()
      } catch {
        pendingAccessRequests.value = []
      }
    })
  }

  function invalidateCache(...keys) {
    keys.forEach((k) => { delete _fetchedAt[k] })
  }

  async function submitAccessRequest(payload) {
    return tresorerieApi.createAccessRequest(payload)
  }

  async function submitDirectExpense(payload, file = null, opts = {}) {
    const background = Boolean(opts.background)
    const apiOpts = { onProgress: opts.onProgress, signal: opts.signal }
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      const created = await tresorerieApi.createDirectExpense(payload, file, apiOpts)
      if (!background) {
        successMessage.value = `${created.reference} comptabilisé · visible dans Compta.`
      }
      delete _fetchedAt.compta
      return created
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  async function resubmitDemande(parentId, payload, devisFiles = [], opts = {}) {
    const background = Boolean(opts.background)
    const apiOpts = { onProgress: opts.onProgress, signal: opts.signal }
    if (!background) {
      clearMessages()
      loading.value = true
    }
    try {
      const created = await tresorerieApi.resubmitDemande(parentId, payload, devisFiles, apiOpts)
      if (!background) {
        successMessage.value = `Nouvelle version ${created.reference} envoyée.`
        await refreshMine()
      } else {
        delete _fetchedAt.mine
      }
      return created
    } catch (e) {
      if (!background) error.value = e.message
      throw e
    } finally {
      if (!background) loading.value = false
    }
  }

  return {
    exchangeRate,
    myDemandes,
    pendingDemandes,
    pendingFactures,
    pendingReimbursements,
    approvedDemandes,
    history,
    compta,
    pendingAccessRequests,
    validationError,
    validationVersion,
    historyError,
    historyLoading,
    historyProgress,
    historyProgressLabel,
    loading,
    error,
    successMessage,
    loadExchangeRate,
    previewEur,
    submitDemande,
    submitFacture,
    submitFacturesBatch,
    submitDirectExpense,
    refreshMine,
    refreshPending,
    startValidationPolling,
    stopValidationPolling,
    pollValidationVersion,
    refreshReimbursements,
    loadApprovedDemandes,
    validateDemandeDevis,
    rejectDemandeDevis,
    resubmitDemandeDevis,
    approveDemande,
    rejectDemande,
    validateFacture,
    closeDemandeInvoicing,
    validateDemandeFactures,
    markReimbursed,
    rejectFacture,
    loadHistory,
    loadCompta,
    refreshAccessRequests,
    submitAccessRequest,
    resubmitDemande,
    clearMessages
  }
})
