import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { fetchPenEurRate, penToEur } from '@/api/tresorerie/exchangeRate.js'

const CACHE_TTL = {
  pending: 30_000,
  history: 120_000,
  compta: 120_000,
  mine: 60_000,
  access: 60_000,
  exchangeRate: 86_400_000
}

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
  const validationStats = ref(null)
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

  async function submitDemande(payload, devisFiles = []) {
    clearMessages()
    loading.value = true
    try {
      const created = await tresorerieApi.createDemande(payload, devisFiles)
      successMessage.value = `Demande ${created.reference} envoyée au trésorier.`
      delete _fetchedAt.mine
      delete _fetchedAt.pending
      await refreshMine(true)
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitFacture(payload, file) {
    clearMessages()
    loading.value = true
    try {
      const created = await tresorerieApi.createFacture(payload, file)
      successMessage.value = `Facture ${created.reference} soumise.`
      await loadApprovedDemandes()
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitFacturesBatch(sharedPayload, items) {
    clearMessages()
    loading.value = true
    const created = []
    try {
      for (const item of items) {
        const facture = await tresorerieApi.createFacture(
          {
            ...sharedPayload,
            amount: item.amount,
            vendor_name: item.vendor_name,
            receipt_number: item.receipt_number || ''
          },
          item.file
        )
        created.push(facture)
      }
      const refs = created.map((f) => f.reference).join(', ')
      successMessage.value =
        created.length > 1
          ? `${created.length} factures enregistrées (brouillon) : ${refs}`
          : `Facture ${refs} enregistrée (brouillon).`
      return created
    } catch (e) {
      if (created.length) {
        error.value = `${created.length} facture(s) enregistrée(s), puis erreur : ${e.message}`
      } else {
        error.value = e.message
      }
      throw e
    } finally {
      loading.value = false
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

  async function refreshPending(force = false) {
    if (force) delete _fetchedAt.pending
    else if (_fetchedAt.pending && Date.now() - _fetchedAt.pending < CACHE_TTL.pending) return
    return dedupeFetch('pending', _inflight, async () => {
      validationError.value = null
      try {
        const [dem, fac, reimb, stats] = await Promise.all([
          tresorerieApi.getDemandesPending(),
          tresorerieApi.getFacturesPending(),
          tresorerieApi.getReimbursementsPending().catch(() => []),
          tresorerieApi.getValidationStats().catch(() => null)
        ])
        pendingDemandes.value = Array.isArray(dem) ? dem : []
        pendingFactures.value = Array.isArray(fac) ? fac : []
        pendingReimbursements.value = Array.isArray(reimb) ? reimb : []
        validationStats.value = stats
        _fetchedAt.pending = Date.now()
      } catch (e) {
        validationError.value = e.message || 'Impossible de charger les files d\'attente'
        pendingDemandes.value = []
        pendingFactures.value = []
      }
    })
  }

  async function refreshReimbursements() {
    try {
      pendingReimbursements.value = await tresorerieApi.getReimbursementsPending()
    } catch {
      pendingReimbursements.value = []
    }
  }

  async function loadApprovedDemandes() {
    approvedDemandes.value = await tresorerieApi.getApprovedDemandReferences()
  }

  async function validateDemandeDevis(reference) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.validateDemandeDevis(reference)
      successMessage.value = `Devis validés pour ${reference}.`
      delete _fetchedAt.history
      await refreshPending(true)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function rejectDemandeDevis(reference, reason) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.rejectDemandeDevis(reference, reason)
      successMessage.value = `Devis refusés pour ${reference} · le bénévole a été notifié.`
      delete _fetchedAt.history
      await refreshPending(true)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resubmitDemandeDevis(reference, devisFiles) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.resubmitDemandeDevis(reference, devisFiles)
      successMessage.value = `Nouveaux devis envoyés pour ${reference}.`
      delete _fetchedAt.history
      await refreshMine()
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function approveDemande(reference) {
    clearMessages()
    loading.value = true
    try {
      const approved = await tresorerieApi.approveDemande(reference)
      successMessage.value = `${reference} approuvée · email simulé.`
      delete _fetchedAt.history
      await refreshPending(true)
      return approved
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function rejectDemande(reference, reason) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.rejectDemande(reference, reason)
      successMessage.value = `${reference} refusée.`
      delete _fetchedAt.history
      await refreshPending(true)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function markReimbursed(reference) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.reimburseFacture(reference)
      successMessage.value = `${reference} marquée remboursée.`
      await refreshReimbursements()
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateFacture(reference) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.validateFacture(reference)
      successMessage.value = `${reference} validée · écriture journal.`
      delete _fetchedAt.history
      delete _fetchedAt.compta
      await refreshPending(true)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function closeDemandeInvoicing(reference) {
    clearMessages()
    loading.value = true
    try {
      const demande = await tresorerieApi.closeDemandeInvoicing(reference)
      successMessage.value = `Devis ${reference} clôturé — ${demande.pending_facture_count ?? ''} facture(s) envoyée(s) au trésorier.`
      await loadApprovedDemandes()
      return demande
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateDemandeFactures(reference) {
    clearMessages()
    loading.value = true
    try {
      const result = await tresorerieApi.validateDemandeFactures(reference)
      successMessage.value = `${result.count} facture(s) validée(s) pour ${reference} · journal à jour.`
      delete _fetchedAt.history
      delete _fetchedAt.compta
      await refreshPending(true)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function rejectFacture(reference, reason) {
    clearMessages()
    loading.value = true
    try {
      await tresorerieApi.rejectFacture(reference, reason)
      successMessage.value = `${reference} refusée.`
      delete _fetchedAt.history
      await refreshPending(true)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
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
        let done = 0
        const bump = (label) => {
          done += 1
          historyProgress.value = Math.min(92, Math.round((done / 4) * 88) + 8)
          historyProgressLabel.value = label
        }

        const demandesP = tresorerieApi.getAllDemandes().catch(() => []).finally(() => bump('Factures…'))
        const facturesP = tresorerieApi.getAllFactures().catch(() => []).finally(() => bump('Journal d\'audit…'))
        const auditP = tresorerieApi.getAuditLog().catch(() => []).finally(() => bump('Statistiques…'))
        const statsP = tresorerieApi.getValidationStats().catch(() => null).finally(() => bump('Finalisation…'))

        historyProgressLabel.value = 'Demandes…'
        const [demandes, factures, audit, stats] = await Promise.all([demandesP, facturesP, auditP, statsP])
        historyProgress.value = 96
        history.value = {
          demandes: Array.isArray(demandes) ? demandes : [],
          factures: Array.isArray(factures) ? factures : [],
          audit: Array.isArray(audit) ? audit : []
        }
        _fetchedAt.history = Date.now()
        if ((stats?.demandes_total ?? 0) > 0 && !history.value.demandes.length) {
          historyError.value =
            'Le tableur contient des demandes mais l’API renvoie une liste vide — redeploy Apps Script (Business.gs, App.gs) puis Actualiser.'
        }
      } catch (e) {
        historyError.value = e.message || 'Chargement historique impossible'
        try {
          const data = await tresorerieApi.getHistory()
          if ((data?.demandes?.length ?? 0) > 0 || (data?.factures?.length ?? 0) > 0) {
            history.value = {
              demandes: data.demandes ?? [],
              factures: data.factures ?? [],
              audit: data.audit ?? []
            }
            historyError.value = null
            _fetchedAt.history = Date.now()
          }
        } catch {
          history.value = { demandes: [], factures: [], audit: [] }
        }
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

  async function submitDirectExpense(payload, file = null) {
    clearMessages()
    loading.value = true
    try {
      const created = await tresorerieApi.createDirectExpense(payload, file)
      successMessage.value = `${created.reference} comptabilisé · visible dans Compta.`
      delete _fetchedAt.compta
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resubmitDemande(parentId, payload, devisFiles = []) {
    clearMessages()
    loading.value = true
    try {
      const created = await tresorerieApi.resubmitDemande(parentId, payload, devisFiles)
      successMessage.value = `Nouvelle version ${created.reference} envoyée.`
      await refreshMine()
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
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
    validationStats,
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
