import { mockBackend } from './mockBackend.js'
import { fileToAttachment, filesToAttachments } from './filePayload.js'

const API_URL = import.meta.env.VITE_TRESORERIE_API_URL?.trim() || ''
const AUTH_KEY = 'akuu_tresorerie_auth'
const mockCorrections = []

export function isMockMode() {
  return !API_URL
}

/** En production, l'absence d'API n'est jamais silencieuse (sinon le site afficherait des données fictives). */
export const apiMisconfigured = import.meta.env.PROD && !API_URL

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
async function remoteRequest(path, { method = 'GET', body, query } = {}) {
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
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('Connexion impossible au serveur. Vérifiez votre connexion internet puis réessayez.')
  }
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(res.ok ? 'Réponse du serveur illisible. Réessayez.' : `Serveur indisponible (${res.status}). Réessayez plus tard.`)
  }
  if (!json.ok) {
    const err = new Error(json.error?.message ?? 'Erreur du serveur')
    err.code = json.error?.code ?? 'API_ERROR'
    if (err.code === 'UNAUTHORIZED') {
      try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
    }
    throw err
  }
  return json.data
}

async function mockCall(fn, ...args) {
  const res = await fn(...args)
  return res.data
}

/** Façade unifiée — mock localStorage ou Apps Script (Phase B). Retourne toujours `data`. */
export const tresorerieApi = {
  isMockMode,

  login(credentials) {
    if (isMockMode()) return mockCall(mockBackend.login, credentials)
    return remoteRequest('/auth/login', { method: 'POST', body: credentials })
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

  async createDemande(payload, devisFiles = []) {
    if (isMockMode()) {
      const meta = devisFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      return mockCall(mockBackend.createDemande, payload, meta)
    }
    const devis = await filesToAttachments(devisFiles)
    return remoteRequest('/demandes', {
      method: 'POST',
      body: { ...payload, _attachments: { devis } }
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

  approveDemande(reference) {
    if (isMockMode()) return mockCall(mockBackend.approveDemande, reference)
    return remoteRequest(`/demandes/${reference}/approve`, { method: 'POST' })
  },

  validateDemandeDevis(reference) {
    if (isMockMode()) return mockCall(mockBackend.validateDemandeDevis, reference)
    return remoteRequest(`/demandes/${reference}/validate-devis`, { method: 'POST' })
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

  async createDirectExpense(payload, file) {
    if (isMockMode()) {
      return mockCall(mockBackend.createDirectExpense, payload, file ? { name: file.name, size: file.size } : null)
    }
    const receipt = file ? await fileToAttachment(file) : null
    return remoteRequest('/expenses/direct', {
      method: 'POST',
      body: { ...payload, _attachments: { receipt } }
    })
  },

  async createFacture(payload, file) {
    if (isMockMode()) {
      return mockCall(mockBackend.createFacture, payload, file ? { name: file.name, size: file.size } : null)
    }
    const receipt = file ? await fileToAttachment(file) : null
    return remoteRequest('/factures', {
      method: 'POST',
      body: { ...payload, _attachments: { receipt } }
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

  rejectFacture(reference, rejectReason) {
    if (isMockMode()) return mockCall(mockBackend.rejectFacture, reference, rejectReason)
    return remoteRequest(`/factures/${reference}/reject`, { method: 'POST', body: { reject_reason: rejectReason } })
  },

  getReimbursementsPending() {
    if (isMockMode()) return mockCall(mockBackend.getReimbursementsPending)
    return remoteRequest('/factures/reimbursements-pending')
  },

  reimburseFacture(reference) {
    if (isMockMode()) return mockCall(mockBackend.reimburseFacture, reference)
    return remoteRequest(`/factures/${reference}/reimburse`, { method: 'POST' })
  },

  getHistory() {
    if (isMockMode()) return mockCall(mockBackend.getHistory)
    return remoteRequest('/history')
  },

  getCompta() {
    if (isMockMode()) return mockCall(mockBackend.getCompta)
    return remoteRequest('/compta')
  },

  /** Import d'un relevé bancaire lu dans le navigateur : { date_fin, solde_debut, solde_fin, operations } + PDF */
  async importReleve(releve, file) {
    if (isMockMode()) return { added: releve.operations.length, skipped: 0, file_name: 'mock.pdf', url: '' }
    const receipt = file ? await fileToAttachment(file) : null
    return remoteRequest('/releves/import', { method: 'POST', body: { ...releve, _attachments: { receipt } } })
  },

  /** Chiffres de l'année en cours calculés depuis le journal Google */
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
  getJournalAnnee(year) {
    if (isMockMode()) return Promise.resolve({ year, live: false, rows: [] })
    return remoteRequest('/journal-annee', { query: { year } })
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
  },

  async attachInvoice(row, file) {
    if (isMockMode()) {
      const c = {
        id: `mock-${Date.now()}`, type: 'attach', reference: row.reference, year: row.year, status: 'pending',
        file_name: file?.name ?? 'facture.pdf', drive_file_url: '#', created_at: new Date().toISOString()
      }
      mockCorrections.push(c)
      return c
    }
    const receipt = file ? await fileToAttachment(file) : null
    return remoteRequest('/corrections/attach', {
      method: 'POST',
      body: { ...row, _attachments: { receipt } }
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
