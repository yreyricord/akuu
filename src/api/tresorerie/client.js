import { mockBackend } from './mockBackend.js'
import { fileToAttachment, filesToAttachments, estimatePayloadBytes, abortError } from './filePayload.js'

const REMOTE_API_URL = import.meta.env.VITE_TRESORERIE_API_URL?.trim() || ''
/** En dev, requêtes same-origin via proxy Vite (évite CORS vers script.google.com). */
const API_URL =
  import.meta.env.DEV && REMOTE_API_URL ? '/api/tresorerie-proxy' : REMOTE_API_URL
const AUTH_KEY = 'akuu_tresorerie_auth'
const mockCorrections = []
const JOURNAL_CACHE_TTL_MS = 3 * 60 * 1000
const EXERCICES_CACHE_TTL_MS = 5 * 60 * 1000
const _journalCache = {}
const _exercicesCache = { at: 0, data: null, inflight: null }

function journalCacheHit(year) {
  const e = _journalCache[String(year)]
  if (e?.data && Date.now() - e.at < JOURNAL_CACHE_TTL_MS) return e.data
  return null
}

export function invalidateJournalCache(year) {
  if (year != null) delete _journalCache[String(year)]
  else Object.keys(_journalCache).forEach((k) => { delete _journalCache[k] })
}

export function invalidateExercicesCache() {
  _exercicesCache.at = 0
  _exercicesCache.data = null
  _exercicesCache.inflight = null
}

export function isMockMode() {
  return !REMOTE_API_URL
}

/** En production, l'absence d'API n'est jamais silencieuse (sinon le site afficherait des données fictives). */
export const apiMisconfigured = import.meta.env.PROD && !REMOTE_API_URL

function getToken() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw).token : null
  } catch {
    return null
  }
}

/** URL de l'API : seulement la route (jamais le jeton ni de donnée personnelle). */
function buildApiUrl(path) {
  const base = API_URL.replace(/\/$/, '')
  const route = (path.startsWith('/') ? path.slice(1) : path).replace(/^\/+/, '')
  return route ? `${base}?path=${encodeURIComponent(route)}` : base
}

/**
 * Toutes les requêtes partent en POST : le jeton de session voyage dans le corps,
 * jamais dans l'URL (journaux Google, historique du navigateur, en-tête Referer).
 * Les lectures portent _method: 'GET' ; les paramètres (ex. year) sont dans le corps.
 */
async function remoteRequest(path, { method = 'GET', body, query, timeoutMs, signal } = {}) {
  const token = getToken()
  const url = buildApiUrl(path)
  const payload = {
    ...(query || {}),
    ...(body && typeof body === 'object' ? body : {}),
    _method: method,
    _token: token
  }
  const options = {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }
  const perfOn = import.meta.env.DEV || import.meta.env.VITE_TRESORERIE_PERF === 'true'
  const t0 = perfOn ? performance.now() : 0
  let res
  if (signal?.aborted) throw abortError()
  const controller = timeoutMs || signal ? new AbortController() : null
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort, { once: true })
  if (controller) options.signal = controller.signal
  try {
    res = await fetch(url, options)
  } catch (err) {
    if (signal?.aborted) throw abortError()
    if (controller?.signal.aborted) {
      throw new Error('Délai dépassé (plus de 2 minutes) — le serveur met trop de temps à répondre. Réessayez.')
    }
    const hint = import.meta.env.DEV
      ? ' (dev local · redémarrez npm run dev si vous venez de modifier .env.local)'
      : ''
    throw new Error(
      `Connexion impossible au serveur${hint}. Vérifiez votre connexion internet, ou que l’Apps Script AKUU est bien déployé (App.gs avec doPost).`
    )
  } finally {
    if (timer) clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
  const text = await res.text()
  if (/Fonction de script introuvable|Script function not found/i.test(text)) {
    throw new Error(
      'API Trésorerie non déployée : le script Google ne contient pas doGet/doPost (App.gs manquant). Redéployez l’Apps Script depuis akuu.asso@gmail.com puis mettez à jour VITE_TRESORERIE_API_URL.'
    )
  }
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(res.ok ? 'Réponse du serveur illisible. L’URL Apps Script est peut-être incorrecte ou obsolète.' : `Serveur indisponible (${res.status}). Réessayez plus tard.`)
  }
  if (!json.ok) {
    const err = new Error(json.error?.message ?? 'Erreur du serveur')
    err.code = json.error?.code ?? 'API_ERROR'
    if (err.code === 'UNAUTHORIZED') {
      try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
    }
    throw err
  }
  if (perfOn && t0) {
    console.debug(`[tresorerie] ${path} ${Math.round(performance.now() - t0)}ms`)
  }
  return json.data
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(abortError())
    }, { once: true })
  })
}

/**
 * Prépare les pièces jointes d'un envoi en signalant la progression :
 * onProgress('encode', ratio) pendant la lecture, puis onProgress('upload', 0, { bytes })
 * juste avant la requête (pas de % réseau réel : un écouteur upload XHR
 * déclencherait un preflight CORS refusé par Apps Script).
 */
async function encodeForUpload(files, opts = {}) {
  const list = Array.from(files || []).filter(Boolean)
  const attachments = await filesToAttachments(list, {
    signal: opts.signal,
    onProgress: (r) => opts.onProgress?.('encode', r)
  })
  opts.onProgress?.('upload', 0, { bytes: estimatePayloadBytes(list) })
  return attachments
}

/** Mode démo : encode réellement puis simule un réseau ~400 Ko/s (UX testable sans API). */
async function mockUpload(files, opts = {}) {
  const list = Array.from(files || []).filter(Boolean)
  if (!opts.onProgress && !opts.signal) return
  await encodeForUpload(list, opts)
  const bytes = estimatePayloadBytes(list)
  await sleep(Math.min(9000, 1200 + bytes / 400), opts.signal)
}

/**
 * Mode démo : quelques dépenses sans facture pour l'année courante, afin de
 * pouvoir tester « Compta → Factures → rattacher » (scénario UP4) sans API.
 */
function mockJournalAnnee(year) {
  const y = String(year)
  if (y !== String(new Date().getFullYear())) return { year, live: false, rows: [], reason: 'Mode démo : seul le journal de l\'année courante est simulé.' }
  const rows = [
    { ref: `B${y}-014`, date: `${y}-03-12`, label: 'Hébergement site web', vendor: 'GreenGeeks', eur: 131.4, pen: null, type: 'depense', category: 'Frais de fonctionnement', project: 'Fonctionnement', source: 'banque' },
    { ref: `T${y}-031`, date: `${y}-05-04`, label: 'Ciment et fer', vendor: 'Ferretería El Sol', eur: null, pen: 412.5, type: 'depense', category: 'Matériaux', project: 'Casa AKUU', source: 'terrain' },
    { ref: `T${y}-032`, date: `${y}-05-06`, label: 'Transport bateau Nauta', vendor: 'Lancha Nauta', eur: null, pen: 60, type: 'depense', category: 'Transport', project: 'Casa AKUU', source: 'terrain' }
  ]
  return { year, live: true, rows }
}

async function mockCall(fn, ...args) {
  // apply : plusieurs méthodes du mock s'appellent entre elles via `this`
  // (file de validation, lot de factures) — sans contexte elles plantaient.
  const res = await fn.apply(mockBackend, args)
  return res.data
}

/** Façade unifiée — mock localStorage ou Apps Script (Phase B). Retourne toujours `data`. */
export const tresorerieApi = {
  isMockMode,

  login(credentials) {
    if (isMockMode()) return mockCall(mockBackend.login, credentials)
    return remoteRequest('/auth/login', { method: 'POST', body: credentials })
  },

  forgotPassword({ email }) {
    if (isMockMode()) return mockCall(mockBackend.forgotPassword, { email })
    return remoteRequest('/auth/forgot-password', { method: 'POST', body: { email } })
  },

  resetPassword({ token, new_password }) {
    if (isMockMode()) return mockCall(mockBackend.resetPassword, { token, new_password })
    return remoteRequest('/auth/reset-password', { method: 'POST', body: { token, new_password } })
  },

  me() {
    if (isMockMode()) return mockCall(mockBackend.me)
    return remoteRequest('/auth/me')
  },

  async logout() {
    if (isMockMode()) return mockCall(mockBackend.logout)
    try { await remoteRequest('/auth/logout', { method: 'POST' }) } catch { /* session déjà expirée */ }
    localStorage.removeItem(AUTH_KEY)
    return { loggedOut: true }
  },

  changePassword({ current_password, new_password }) {
    if (isMockMode()) return Promise.resolve({ ok: true })
    return remoteRequest('/auth/password', { method: 'POST', body: { current_password, new_password } })
  },

  async createDemande(payload, devisFiles = [], opts = {}) {
    if (isMockMode()) {
      await mockUpload(devisFiles, opts)
      const meta = devisFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      return mockCall(mockBackend.createDemande, payload, meta)
    }
    const devis = await encodeForUpload(devisFiles, opts)
    return remoteRequest('/demandes', {
      method: 'POST',
      body: { ...payload, _attachments: { devis } },
      signal: opts.signal
    })
  },

  getDemandesMine() {
    if (isMockMode()) return mockCall(mockBackend.getDemandesMine)
    return remoteRequest('/demandes/mine')
  },

  getDemandesPending() {
    if (isMockMode()) return mockCall(mockBackend.getDemandesPending)
    return remoteRequest('/demandes/pending')
  },

  getValidationStats() {
    if (isMockMode()) return mockCall(mockBackend.getValidationStats)
    return remoteRequest('/validation/stats', { query: {} })
  },

  getValidationQueue() {
    if (isMockMode()) return mockCall(mockBackend.getValidationQueue)
    return remoteRequest('/validation/queue')
  },

  getValidationVersion() {
    if (isMockMode()) return mockCall(mockBackend.getValidationVersion)
    return remoteRequest('/validation/version')
  },

  approveDemande(reference) {
    if (isMockMode()) return mockCall(mockBackend.approveDemande, reference)
    return remoteRequest(`/demandes/${reference}/approve`, { method: 'POST' })
  },

  validateDemandeDevis(reference) {
    if (isMockMode()) return mockCall(mockBackend.validateDemandeDevis, reference)
    return remoteRequest(`/demandes/${reference}/validate-devis`, { method: 'POST' })
  },

  rejectDemandeDevis(reference, rejectReason) {
    if (isMockMode()) return mockCall(mockBackend.rejectDemandeDevis, reference, rejectReason)
    return remoteRequest(`/demandes/${reference}/reject-devis`, { method: 'POST', body: { reject_reason: rejectReason } })
  },

  async resubmitDemandeDevis(reference, devisFiles = []) {
    if (isMockMode()) {
      const meta = devisFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      return mockCall(mockBackend.resubmitDemandeDevis, reference, meta)
    }
    const devis = await filesToAttachments(devisFiles)
    return remoteRequest(`/demandes/${reference}/resubmit-devis`, {
      method: 'POST',
      body: { _attachments: { devis } }
    })
  },

  rejectDemande(reference, rejectReason) {
    if (isMockMode()) return mockCall(mockBackend.rejectDemande, reference, rejectReason)
    return remoteRequest(`/demandes/${reference}/reject`, { method: 'POST', body: { reject_reason: rejectReason } })
  },

  async resubmitDemande(parentId, payload, devisFiles = []) {
    if (isMockMode()) {
      const meta = devisFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      return mockCall(mockBackend.resubmitDemande, parentId, payload, meta)
    }
    const devis = await filesToAttachments(devisFiles)
    return remoteRequest(`/demandes/${parentId}/resubmit`, {
      method: 'POST',
      body: { ...payload, _attachments: { devis } }
    })
  },

  getApprovedDemandReferences() {
    if (isMockMode()) return mockCall(mockBackend.getApprovedDemandReferences)
    return remoteRequest('/demandes/approved')
  },

  async createDirectExpense(payload, file, opts = {}) {
    if (isMockMode()) {
      await mockUpload([file], opts)
      return mockCall(mockBackend.createDirectExpense, payload, file ? { name: file.name, size: file.size } : null)
    }
    const [receipt = null] = file ? await encodeForUpload([file], opts) : []
    return remoteRequest('/expenses/direct', {
      method: 'POST',
      body: { ...payload, _attachments: { receipt } },
      signal: opts.signal
    })
  },

  async createFacture(payload, file, opts = {}) {
    if (isMockMode()) {
      await mockUpload([file], opts)
      return mockCall(mockBackend.createFacture, payload, file ? { name: file.name, size: file.size } : null)
    }
    const [receipt = null] = file ? await encodeForUpload([file], opts) : []
    return remoteRequest('/factures', {
      method: 'POST',
      body: { ...payload, _attachments: { receipt } },
      signal: opts.signal
    })
  },

  async createFacturesBatch(sharedPayload, items, opts = {}) {
    if (isMockMode()) {
      await mockUpload(items.map((i) => i.file), opts)
      return mockCall(mockBackend.createFacturesBatch, sharedPayload, items)
    }
    const files = items.map((i) => i.file)
    const encoded = await encodeForUpload(files, opts)
    let k = 0
    const batchItems = items.map((item) => ({
      expense_date: item.expense_date,
      amount: item.amount,
      vendor_name: item.vendor_name,
      receipt_number: item.receipt_number || '',
      receipt: item.file ? encoded[k++] : null
    }))
    return remoteRequest('/factures/batch', {
      method: 'POST',
      body: { shared: sharedPayload, items: batchItems },
      signal: opts.signal
    })
  },

  getFacturesPending() {
    if (isMockMode()) return mockCall(mockBackend.getFacturesPending)
    return remoteRequest('/factures/pending')
  },

  validateFacture(reference) {
    if (isMockMode()) return mockCall(mockBackend.validateFacture, reference)
    return remoteRequest(`/factures/${reference}/validate`, { method: 'POST' })
  },

  closeDemandeInvoicing(reference) {
    if (isMockMode()) return mockCall(mockBackend.closeDemandeInvoicing, reference)
    return remoteRequest(`/demandes/${reference}/close-invoicing`, { method: 'POST' })
  },

  validateDemandeFactures(reference) {
    if (isMockMode()) return mockCall(mockBackend.validateDemandeFactures, reference)
    return remoteRequest(`/demandes/${reference}/validate-factures`, { method: 'POST' })
  },

  rejectFacture(reference, rejectReason) {
    if (isMockMode()) return mockCall(mockBackend.rejectFacture, reference, rejectReason)
    return remoteRequest(`/factures/${reference}/reject`, { method: 'POST', body: { reject_reason: rejectReason } })
  },

  getReimbursementsPending() {
    if (isMockMode()) return mockCall(mockBackend.getReimbursementsPending)
    return remoteRequest('/factures/reimbursements-pending')
  },

  getAvances(year) {
    if (isMockMode()) return mockCall(mockBackend.getAvances, year)
    return remoteRequest('/avances', { query: { year } })
  },

  getCaissePerou(year) {
    if (isMockMode()) return mockCall(mockBackend.getCaissePerou, year)
    return remoteRequest('/caisse-perou', { query: { year } })
  },

  reimburseFacture(reference) {
    if (isMockMode()) return mockCall(mockBackend.reimburseFacture, reference)
    return remoteRequest(`/factures/${reference}/reimburse`, { method: 'POST' })
  },

  getHistory(opts = {}) {
    if (isMockMode()) return mockCall(mockBackend.getHistory, opts)
    return remoteRequest('/history', { query: { limit: opts.limit, since: opts.since } })
  },

  getAllDemandes() {
    if (isMockMode()) return mockCall(mockBackend.getHistory).then((h) => h?.demandes ?? [])
    return remoteRequest('/demandes/all', { query: {} })
  },

  getAllFactures() {
    if (isMockMode()) return mockCall(mockBackend.getHistory).then((h) => h?.factures ?? [])
    return remoteRequest('/factures/all', { query: {} })
  },

  getAuditLog() {
    if (isMockMode()) return mockCall(mockBackend.getHistory).then((h) => h?.audit ?? [])
    return remoteRequest('/audit', { query: {} })
  },

  getCompta() {
    if (isMockMode()) return mockCall(mockBackend.getCompta)
    return remoteRequest('/compta')
  },

  /** Import d'un relevé bancaire lu dans le navigateur : { date_fin, solde_debut, solde_fin, operations } + PDF */
  async importReleve(releve, file) {
    if (isMockMode()) return { added: releve.operations?.length ?? 0, skipped: 0, file_name: 'mock.pdf', url: '' }
    const receipt = file ? await fileToAttachment(file) : null
    const year = String(releve.date_fin || '').slice(-4) || new Date().getFullYear()
    if (file && file.size > 10 * 1024 * 1024) {
      throw Object.assign(new Error('PDF trop volumineux (max 10 Mo).'), { code: 'VALIDATION_FAILED' })
    }
    return remoteRequest('/releves/import', { method: 'POST', body: { ...releve, _attachments: { receipt } }, timeoutMs: 120_000 })
      .then((res) => { invalidateJournalCache(year); invalidateExercicesCache(); return res })
  },

  /** Tous les exercices (2017 → année en cours) lus depuis les Google Sheets */
  getExercices({ force = false } = {}) {
    if (isMockMode()) return Promise.resolve({ source: 'mock', years: [] })
    if (!force && _exercicesCache.data && Date.now() - _exercicesCache.at < EXERCICES_CACHE_TTL_MS) {
      return Promise.resolve(_exercicesCache.data)
    }
    if (!force && _exercicesCache.inflight) return _exercicesCache.inflight
    _exercicesCache.inflight = remoteRequest('/exercices')
      .then((data) => {
        _exercicesCache.data = data
        _exercicesCache.at = Date.now()
        _exercicesCache.inflight = null
        return data
      })
      .catch((e) => {
        _exercicesCache.inflight = null
        throw e
      })
    return _exercicesCache.inflight
  },

  invalidateExercicesCache() {
    _exercicesCache.at = 0
    _exercicesCache.data = null
    _exercicesCache.inflight = null
  },

  getExercice(year) {
    if (isMockMode()) return Promise.resolve({ year, live: false })
    return remoteRequest(`/exercices/${year}`)
  },

  getExerciceHistorique(year) {
    if (isMockMode()) return Promise.resolve([])
    return remoteRequest(`/exercices/${year}/historique`)
  },

  rouvrirExercice(year, motif) {
    if (isMockMode()) return Promise.reject(new Error('Réouverture disponible une fois l\'application connectée'))
    return remoteRequest('/exercice/rouvrir', { method: 'POST', body: { year: Number(year), motif } })
  },

  recloturerExercice(year, opts = {}) {
    if (isMockMode()) return Promise.reject(new Error('Reclôture disponible une fois l\'application connectée'))
    return remoteRequest('/exercice/recloturer', { method: 'POST', body: { year: Number(year), ...opts } })
  },

  regenererCloture(year, opts = {}) {
    if (isMockMode()) return Promise.reject(new Error('Régénération disponible une fois l\'application connectée'))
    return remoteRequest('/exercice/regenerer', { method: 'POST', body: { year: Number(year), ...opts } })
  },

  getFinancesPubliques() {
    if (isMockMode()) return Promise.reject(new Error('Finances publiques disponibles une fois l\'application connectée'))
    return remoteRequest('/finances-publiques')
  },

  /** Chiffres d'une année calculés depuis le journal Google (alias d'un exercice) */
  getComptaAnnee(year) {
    if (isMockMode()) return Promise.resolve({ year, live: false })
    return remoteRequest('/compta-annee', { query: { year } })
  },

  /** Exports Excel générés à la demande : { file_name, base64 } */
  exportJournal(year) {
    if (isMockMode()) return Promise.reject(new Error('Export disponible une fois l\'application connectée'))
    return remoteRequest('/export-journal', { query: { year } })
  },

  exportRegistre(year) {
    if (isMockMode()) return Promise.reject(new Error('Export disponible une fois l\'application connectée'))
    return remoteRequest('/export-registre', { query: { year } })
  },

  /** Journal de l'année en cours (Google Sheet) — { live, rows, sheet_url } */
  getJournalAnnee(year, { force = false } = {}) {
    if (isMockMode()) return Promise.resolve(mockJournalAnnee(year))
    const y = String(year)
    if (!force) {
      const hit = journalCacheHit(y)
      if (hit) return Promise.resolve(hit)
      if (_journalCache[y]?.inflight) return _journalCache[y].inflight
    }
    const inflight = remoteRequest('/journal-annee', { query: { year } })
      .then((data) => {
        _journalCache[y] = { at: Date.now(), data, inflight: null }
        return data
      })
      .catch((e) => {
        if (_journalCache[y]) _journalCache[y].inflight = null
        throw e
      })
    _journalCache[y] = { at: _journalCache[y]?.at || 0, data: _journalCache[y]?.data, inflight }
    return inflight
  },

  peekJournalAnnee(year) {
    return journalCacheHit(year)
  },

  /** Corrections du trésorier (suppressions année en cours, factures ajoutées) */
  getCorrections() {
    if (isMockMode()) return Promise.resolve([...mockCorrections])
    return remoteRequest('/corrections')
  },

  requestDeletion({ reference, year, reason }) {
    if (isMockMode()) {
      if (Number(year) !== new Date().getFullYear()) return Promise.reject(new Error('Exercice clôturé : suppression impossible'))
      const c = { id: `mock-${Date.now()}`, type: 'delete', reference, year, reason, status: 'pending', created_at: new Date().toISOString() }
      mockCorrections.push(c)
      return Promise.resolve(c)
    }
    return remoteRequest('/corrections/delete', { method: 'POST', body: { reference, year, reason } })
      .then((res) => { invalidateJournalCache(year); return res })
  },

  updateJournalLine({ reference, year, project, payment_method, category, amount_pen, notes }) {
    if (isMockMode()) {
      return Promise.resolve({ reference, year, project, payment_method, amount_pen, tab: 'Detail_PM' })
    }
    return remoteRequest('/corrections/update', {
      method: 'POST',
      body: { reference, year, project, payment_method, category, amount_pen, notes }
    }).then((res) => { invalidateJournalCache(year); return res })
  },

  async createJournalLine(payload, file, opts = {}) {
    if (isMockMode()) {
      if (file) await mockUpload([file], opts)
      const ref = payload.source === 'banque'
        ? `AKUU-IMP-${payload.year}-9999`
        : `AKUU-PM-${payload.year}-9999`
      return Promise.resolve({ reference: ref, year: payload.year, source: payload.source || 'terrain', label: payload.label })
    }
    const [receipt = null] = file ? await encodeForUpload([file], opts) : []
    return remoteRequest('/corrections/create', {
      method: 'POST',
      body: { ...payload, _attachments: receipt ? { receipt } : undefined },
      signal: opts.signal
    }).then((res) => { invalidateJournalCache(payload.year); return res })
  },

  getTresorerieMeta() {
    if (isMockMode()) {
      return Promise.resolve({ projects: [], categories: [] })
    }
    return remoteRequest('/tresorerie-meta', { query: {} })
  },

  saveTresorerieMeta(body) {
    if (isMockMode()) return Promise.resolve(body)
    return remoteRequest('/tresorerie-meta', { method: 'POST', body })
  },

  async attachInvoice(row, file, opts = {}) {
    if (isMockMode()) {
      await mockUpload([file], opts)
      const c = {
        id: `mock-${Date.now()}`, type: 'attach', reference: row.reference, year: row.year, status: 'pending',
        file_name: file?.name ?? 'facture.pdf', drive_file_url: '#', created_at: new Date().toISOString()
      }
      mockCorrections.push(c)
      return c
    }
    const [receipt = null] = file ? await encodeForUpload([file], opts) : []
    return remoteRequest('/corrections/attach', {
      method: 'POST',
      body: { ...row, _attachments: { receipt } },
      signal: opts.signal
    })
  },

  getExchangeRate() {
    if (isMockMode()) return mockCall(mockBackend.getExchangeRate)
    return remoteRequest('/exchange-rate/pen-eur')
  },

  createAccessRequest(payload) {
    if (isMockMode()) return mockCall(mockBackend.createAccessRequest, payload)
    return remoteRequest('/access-requests', { method: 'POST', body: payload })
  },

  getAccessRequestsPending() {
    if (isMockMode()) return mockCall(mockBackend.getAccessRequestsPending)
    return remoteRequest('/access-requests/pending')
  },

  approveAccessRequest(id) {
    if (isMockMode()) return mockCall(mockBackend.approveAccessRequest, id)
    return remoteRequest(`/access-requests/${id}/approve`, { method: 'POST' })
  },

  rejectAccessRequest(id, rejectReason) {
    if (isMockMode()) return mockCall(mockBackend.rejectAccessRequest, id, rejectReason)
    return remoteRequest(`/access-requests/${id}/reject`, { method: 'POST', body: { reject_reason: rejectReason } })
  },

  /** Données privées publiées sur le Drive (ex. détail des écritures des archives) */
  getSiteData(name) {
    if (isMockMode()) return Promise.resolve(null)
    return remoteRequest('/site-data', { query: { name } })
  },

  /** Fichier d'archive du Drive (journal, registre, clôture, relevé) : { file_name, mime, base64 } */
  downloadArchiveFile(path) {
    if (isMockMode()) return Promise.reject(new Error("Téléchargement disponible une fois l'application connectée"))
    return remoteRequest('/archive-file', { query: { path } })
  },

  /** ZIP à la demande : { kind: 'releves', year } ou { kind: 'tout' } */
  zipArchive(opts) {
    if (isMockMode()) return Promise.reject(new Error("Téléchargement disponible une fois l'application connectée"))
    return remoteRequest('/archive-zip', { query: opts })
  },

  /** Lien PDF d'un relevé mensuel (Drive ou onglet Releves). */
  getRelevePdfLink(year, month) {
    if (isMockMode()) return Promise.resolve({ url: '', file_name: 'mock.pdf' })
    return remoteRequest('/releves/link', { query: { year: String(year), month: String(month) } })
  },

  /** Relevé PDF seul (années archivées) → 3_Trésorerie/<année>/Documents/Releves_bancaires sur le Drive. */
  async uploadReleve({ year, month, file }) {
    const attachment = await fileToAttachment(file)
    let result = null
    if (!isMockMode()) {
      result = await remoteRequest('/releves', {
        method: 'POST',
        body: { year, month, filename: attachment.name, base64: attachment.base64 }
      })
    }
    // En développement local : copie aussi dans RELEVES/UPLOAD_DRIVE (bilan regénérable tout de suite)
    if (import.meta.env.DEV) {
      try {
        const res = await fetch('/api/dev/releves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year, month, filename: attachment.name, base64: attachment.base64 })
        })
        const json = await res.json()
        if (!result && json.ok) result = json.data
      } catch { /* serveur de dev absent : sans importance */ }
    }
    if (!result) throw new Error("Dépôt impossible : l'application n'est pas connectée. Réessayez depuis le site en ligne.")
    return result
  },

  listRelevesArchives() {
    if (isMockMode()) return Promise.resolve([])
    return remoteRequest('/releves/archives')
  }

}
