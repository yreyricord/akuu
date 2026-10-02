import { fetchPenEurRate } from './exchangeRate.js'
import {
  amountMaxWithTolerance,
  nativeEstimated,
  normalizeAmountPair
} from '@/data/currency.js'
import {
  AMOUNT_TOLERANCE_PERCENT,
  requiresDevisAttachments,
  MIN_DEVIS_ATTACHMENTS,
  DEVIS_PEN_THRESHOLD,
  initialReimbursementStatus,
  reimbursementStatusOnValidate,
  normalizeFactureReimbursement,
  isReimbursementDue,
  initialDevisStatus,
  OPERATING_EXPENSE_CATEGORIES,
  OPERATING_EXPENSE_PROJECT,
  DIRECT_EXPENSE_PAYMENT_TYPES
} from '@/data/tresorerie-config.js'
import { ADMIN_EMAIL, isSuperAdmin, isTreasurerRole, normalizeRole } from '@/data/member-roles.js'
import { buildFullName, normalizeUserProfile } from '@/data/user-profile.js'
import { buildComptaSummary } from '@/data/compta-summary.js'
import { buildStandardFilename } from '@/utils/factureFilename.js'

const STORAGE_KEY = 'akuu_tresorerie_v1'
const AUTH_KEY = 'akuu_tresorerie_auth'
const MOCK_RESET_KEY = 'akuu_tresorerie_mock_reset'

const DEMO_USERS = [
  { email: ADMIN_EMAIL, password: 'demo-akuu-2026', role: 'admin', first_name: 'Yoann', last_name: 'Rey-Ricord', name: 'Yoann Rey-Ricord' },
  { email: 'admin@demo.akuu.fr', password: 'demo-akuu-2026', role: 'admin', first_name: 'Admin', last_name: 'Démo', name: 'Admin Démo' },
  { email: 'tresorier@demo.akuu.fr', password: 'demo-akuu-2026', role: 'tresorier', first_name: 'Trésorier', last_name: 'Démo', name: 'Trésorier Démo' },
  { email: 'adherent@demo.akuu.fr', password: 'demo-akuu-2026', role: 'benevole', first_name: 'Bénévole', last_name: 'Démo', name: 'Bénévole Démo' }
]

function sessionFromUser(user) {
  const profile = normalizeUserProfile(user)
  return {
    token: `mock-${uuid()}`,
    email: user.email,
    role: user.role,
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name
  }
}

function uuid() {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return {
    demandes: [],
    factures: [],
    journal: [],
    audit: [],
    accessRequests: [],
    registeredUsers: [],
    counters: {}
  }
}

function allUsers() {
  const store = loadStore()
  return [...DEMO_USERS, ...(store.registeredUsers ?? [])]
}

function findUser(email) {
  return allUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

function hasAccess(email) {
  return Boolean(findUser(email))
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function appendAudit(store, actorEmail, action, entityType, entityId, payload = {}) {
  store.audit.unshift({
    id: uuid(),
    timestamp: new Date().toISOString(),
    actor_email: actorEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload_json: JSON.stringify(payload)
  })
}

function nextRef(store, prefix, year) {
  const key = `${prefix}_${year}`
  store.counters[key] = (store.counters[key] ?? 0) + 1
  const n = String(store.counters[key]).padStart(4, '0')
  return `AKUU-${prefix}-${year}-${n}`
}

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function requireAuth(level) {
  const session = getSession()
  if (!session?.email) throw apiError('UNAUTHORIZED', 'Session requise')
  if (level === 'treasurer' && !isTreasurerRole(session.role)) {
    throw apiError('FORBIDDEN', 'Rôle trésorier requis')
  }
  if (level === 'admin' && !isSuperAdmin(session.email, session.role)) {
    throw apiError('FORBIDDEN', 'Administrateur requis')
  }
  return session
}

function apiError(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

function todayIsoLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function assertNeededByDateNotPast(neededByDate) {
  if (neededByDate && neededByDate < todayIsoLocal()) {
    throw apiError('VALIDATION_FAILED', 'La date d\'achat prévue ne peut pas être antérieure à aujourd\'hui.')
  }
}

function ok(data) {
  return { ok: true, data }
}

export const mockBackend = {
  isMock: true,

  async login({ email, password }) {
    const user = findUser(email)
    if (!user || user.password !== password) {
      throw apiError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect')
    }
    const session = sessionFromUser(user)
    session.token = `mock-${uuid()}`
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    return ok({ ...session })
  },

  async me() {
    const session = getSession()
    if (!session) throw apiError('UNAUTHORIZED', 'Non connecté')
    const profile = normalizeUserProfile(session)
    return ok({
      email: session.email,
      role: session.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      name: profile.name
    })
  },

  logout() {
    localStorage.removeItem(AUTH_KEY)
    return ok({ loggedOut: true })
  },

  async forgotPassword({ email }) {
    const normalized = String(email || '').toLowerCase().trim()
    const user = findUser(normalized)
    if (user) {
      const token = `mock-${uuid()}`
      const store = JSON.parse(sessionStorage.getItem(MOCK_RESET_KEY) || '{}')
      store[token] = { email: normalized, exp: Date.now() + 30 * 60 * 1000 }
      sessionStorage.setItem(MOCK_RESET_KEY, JSON.stringify(store))
      console.info('[mock] Lien reset :', `/admin/reset-password?token=${token}`)
    }
    return ok({
      message: 'Si un compte existe pour cette adresse, un email de réinitialisation vient d\'être envoyé. Pensez à vérifier vos spams.'
    })
  },

  async resetPassword({ token, new_password }) {
    const store = JSON.parse(sessionStorage.getItem(MOCK_RESET_KEY) || '{}')
    const entry = store[token]
    if (!entry || Date.now() > entry.exp) {
      throw apiError('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.')
    }
    const user = findUser(entry.email)
    if (!user) throw apiError('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.')
    user.password = new_password
    delete store[token]
    sessionStorage.setItem(MOCK_RESET_KEY, JSON.stringify(store))
    return ok({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' })
  },

  async createDemande(payload, devisFiles = []) {
    const session = requireAuth('member')
    assertNeededByDateNotPast(payload.needed_by_date)
    const store = loadStore()
    const year = new Date().getFullYear()
    const rateInfo = await fetchPenEurRate()
    const amounts = normalizeAmountPair({
      currency: payload.currency,
      amount: payload.amount,
      rate: rateInfo.rate,
      amount_pen: payload.amount_pen_estimated
    })
    const amountPen = amounts.amount_pen

    if (requiresDevisAttachments(amountPen)) {
      const files = Array.isArray(devisFiles) ? devisFiles : []
      if (files.length < MIN_DEVIS_ATTACHMENTS) {
        throw apiError(
          'VALIDATION_FAILED',
          `Dépense > ${DEVIS_PEN_THRESHOLD} S/. : joignez au moins ${MIN_DEVIS_ATTACHMENTS} photos/PDF de devis (fourni : ${files.length}).`
        )
      }
    }

    const demande = {
      id: uuid(),
      reference: nextRef(store, 'DEM', year),
      created_at: new Date().toISOString(),
      submitter_email: session.email,
      project: payload.project,
      category: payload.category,
      amount_pen_estimated: amountPen,
      amount_eur_estimated: amounts.amount_eur,
      currency: amounts.currency,
      exchange_rate: rateInfo.rate,
      devis_attachments: (devisFiles ?? []).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type ?? null
      })),
      payment_type: payload.payment_type,
      description: payload.description,
      justification: payload.justification,
      needed_by_date: payload.needed_by_date,
      status: 'awaiting_approval',
      treasurer_email: null,
      decided_at: null,
      reject_reason: null,
      resubmission_of: payload.resubmission_of ?? null,
      version: payload.version ?? 1,
      devis_status: initialDevisStatus(amountPen),
      devis_validated_at: null,
      devis_validated_by: null
    }
    store.demandes.unshift(demande)
    appendAudit(store, session.email, 'demande_created', 'demande', demande.id, { reference: demande.reference })
    saveStore(store)
    return ok(demande)
  },

  async getDemandesMine() {
    const session = requireAuth('member')
    const store = loadStore()
    const items = store.demandes.filter((d) => d.submitter_email === session.email)
    return ok(items)
  },

  async getDemandesPending() {
    requireAuth('treasurer')
    const store = loadStore()
    return ok(store.demandes.filter((d) => d.status === 'awaiting_approval'))
  },

  async getValidationStats() {
    requireAuth('treasurer')
    const store = loadStore()
    return ok({
      demandes_total: store.demandes.length,
      demandes_pending: store.demandes.filter((d) => d.status === 'pending').length,
      demandes_by_status: {},
      factures_total: store.factures.length,
      factures_pending: store.factures.filter((f) => f.status === 'pending').length,
      factures_by_status: {},
      demandes_sheet_exists: true
    })
  },

  async getValidationQueue() {
    requireAuth('treasurer')
    const [dem, fac, reimb, stats] = await Promise.all([
      this.getDemandesPending(),
      this.getFacturesPending(),
      this.getReimbursementsPending(),
      this.getValidationStats()
    ])
    const version = {
      version: `mock|d${dem.data.length}|f${fac.data.length}`,
      demandes_pending: dem.data.length,
      factures_pending: fac.data.length,
      updated_at: new Date().toISOString()
    }
    return ok({
      demandes: dem.data,
      factures: fac.data,
      reimbursements: reimb.data,
      stats: stats.data,
      version
    })
  },

  async getValidationVersion() {
    const q = await this.getValidationQueue()
    return ok(q.data.version)
  },

  async validateDemandeDevis(reference) {
    const session = requireAuth('treasurer')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    if (demande.status !== 'awaiting_approval') {
      throw apiError('VALIDATION_FAILED', 'Demande déjà traitée')
    }
    if (!requiresDevisAttachments(demande.amount_pen_estimated)) {
      throw apiError('VALIDATION_FAILED', `Photos de devis non requises (≤ ${DEVIS_PEN_THRESHOLD} S/.)`)
    }
    if ((demande.devis_attachments?.length ?? 0) < MIN_DEVIS_ATTACHMENTS) {
      throw apiError('VALIDATION_FAILED', `Devis manquants — au moins ${MIN_DEVIS_ATTACHMENTS} requis`)
    }
    demande.devis_status = 'validated'
    demande.devis_validated_at = new Date().toISOString()
    demande.devis_validated_by = session.email
    demande.devis_reject_reason = ''
    appendAudit(store, session.email, 'devis_validated', 'demande', demande.id, { reference })
    saveStore(store)
    return ok(demande)
  },

  async rejectDemandeDevis(reference, rejectReason) {
    const session = requireAuth('treasurer')
    if (!rejectReason?.trim()) throw apiError('REJECT_REASON_REQUIRED', 'Motif de refus obligatoire')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    if (demande.status !== 'awaiting_approval') throw apiError('VALIDATION_FAILED', 'Demande déjà traitée')
    demande.devis_status = 'rejected'
    demande.devis_reject_reason = rejectReason.trim()
    demande.devis_validated_at = null
    demande.devis_validated_by = null
    appendAudit(store, session.email, 'devis_rejected', 'demande', demande.id, { reference, rejectReason })
    saveStore(store)
    return ok(demande)
  },

  async resubmitDemandeDevis(reference, devisFiles = []) {
    const session = requireAuth('member')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    if (demande.submitter_email !== session.email) throw apiError('FORBIDDEN', 'Demande non autorisée')
    if (demande.status !== 'awaiting_approval') throw apiError('VALIDATION_FAILED', 'Demande déjà traitée')
    if (demande.devis_status !== 'rejected') {
      throw apiError('VALIDATION_FAILED', 'Seuls les devis refusés peuvent être renvoyés')
    }
    if (devisFiles.length < MIN_DEVIS_ATTACHMENTS) {
      throw apiError('VALIDATION_FAILED', `Au moins ${MIN_DEVIS_ATTACHMENTS} devis requis`)
    }
    demande.devis_attachments = devisFiles.map((f, i) => ({ name: f.name || `devis-${i + 1}.pdf`, drive_file_url: '#' }))
    demande.devis_status = 'pending'
    demande.devis_reject_reason = ''
    appendAudit(store, session.email, 'devis_resubmitted', 'demande', demande.id, { reference })
    saveStore(store)
    return ok(demande)
  },

  async approveDemande(reference) {
    const session = requireAuth('treasurer')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    if (demande.status !== 'awaiting_approval') {
      throw apiError('VALIDATION_FAILED', 'Demande déjà traitée')
    }
    if (requiresDevisAttachments(demande.amount_pen_estimated) && demande.devis_status !== 'validated') {
      throw apiError('DEVIS_NOT_VALIDATED', 'Validez les devis avant d\'approuver la demande')
    }
    demande.status = 'approved'
    demande.invoicing_status = 'open'
    demande.invoicing_submitted_at = null
    demande.treasurer_email = session.email
    demande.decided_at = new Date().toISOString()
    appendAudit(store, session.email, 'demande_approved', 'demande', demande.id, { reference })
    saveStore(store)
    return ok({ ...demande, emailSent: true, emailSubject: `[${reference}] Demande approuvée` })
  },

  async rejectDemande(reference, rejectReason) {
    const session = requireAuth('treasurer')
    if (!rejectReason?.trim()) throw apiError('REJECT_REASON_REQUIRED', 'Motif de refus obligatoire')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    demande.status = 'rejected'
    demande.reject_reason = rejectReason.trim()
    demande.treasurer_email = session.email
    demande.decided_at = new Date().toISOString()
    appendAudit(store, session.email, 'demande_rejected', 'demande', demande.id, { reference, rejectReason })
    saveStore(store)
    return ok(demande)
  },

  async resubmitDemande(parentId, payload, devisFiles = []) {
    const session = requireAuth('member')
    const store = loadStore()
    const parent = store.demandes.find((d) => d.id === parentId)
    if (!parent || parent.submitter_email !== session.email) {
      throw apiError('DEMAND_NOT_FOUND', 'Demande parente introuvable')
    }
    const siblings = store.demandes.filter((d) => d.resubmission_of === parentId || d.id === parentId)
    const version = Math.max(...siblings.map((d) => d.version ?? 1)) + 1
    return this.createDemande(
      {
        ...payload,
        resubmission_of: parentId,
        version
      },
      devisFiles
    )
  },

  async getApprovedDemandReferences() {
    const session = requireAuth('member')
    const store = loadStore()
    const enrich = (d) => {
      let sumPen = 0
      let count = 0
      let draftCount = 0
      let pendingCount = 0
      store.factures.forEach((f) => {
        if (f.demand_reference !== d.reference || f.status === 'rejected') return
        sumPen += Number(f.amount_pen) || 0
        count++
        if (f.status === 'draft') draftCount++
        if (f.status === 'pending') pendingCount++
      })
      const maxPen = amountMaxWithTolerance(Number(d.amount_pen_estimated))
      const remaining_pen = Math.max(0, Math.round((maxPen - sumPen) * 100) / 100)
      return {
        ...d,
        invoiced_pen: sumPen,
        facture_count: count,
        draft_count: draftCount,
        pending_facture_count: pendingCount,
        invoicing_status: d.invoicing_status || (d.status === 'approved' ? 'open' : ''),
        max_pen: maxPen,
        remaining_pen
      }
    }
    const refs = store.demandes
      .filter((d) => d.submitter_email === session.email && d.status === 'approved')
      .filter((d) => (d.invoicing_status || 'open') !== 'submitted')
      .map(enrich)
      .filter((d) => d.remaining_pen > 0)
    return ok(refs)
  },

  async createFacture(payload, fileMeta) {
    const session = requireAuth('member')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === payload.demand_reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Référence demande introuvable')
    if (demande.status !== 'approved') {
      throw apiError('DEMAND_NOT_APPROVED', 'La demande doit être approuvée par le trésorier')
    }
    if (demande.submitter_email !== session.email) {
      throw apiError('FORBIDDEN', 'Cette demande ne vous appartient pas')
    }
    if ((demande.invoicing_status || 'open') === 'submitted') {
      throw apiError('CONFLICT', 'Ce devis est clôturé et en attente de validation trésorier.', 409)
    }
    const maxPen = amountMaxWithTolerance(nativeEstimated(demande))
    let invoicedPen = 0
    store.factures.forEach((f) => {
      if (f.demand_reference === payload.demand_reference && f.status !== 'rejected') {
        invoicedPen += Number(f.amount_pen) || 0
      }
    })
    const remainingPen = Math.max(0, Math.round((maxPen - invoicedPen) * 100) / 100)
    if (remainingPen <= 0) {
      throw apiError('CONFLICT', 'Le plafond de cette demande est déjà entièrement couvert', 409)
    }

    const rateInfo = await fetchPenEurRate()
    const amounts = normalizeAmountPair({
      currency: payload.currency ?? demande.currency,
      amount: payload.amount,
      rate: rateInfo.rate,
      amount_pen: payload.amount_pen
    })
    const actualNative = amounts.currency === 'EUR' ? amounts.amount_eur : amounts.amount_pen
    if (actualNative > remainingPen + 0.001) {
      throw apiError(
        'VALIDATION_FAILED',
        `Montant supérieur au reste à facturer (${remainingPen} PEN restants).`
      )
    }

    if (
      payload.project !== demande.project ||
      payload.category !== demande.category ||
      payload.payment_type !== demande.payment_type ||
      payload.label !== demande.description
    ) {
      throw apiError('VALIDATION_FAILED', 'Les champs figés doivent correspondre à la demande approuvée.')
    }

    const year = new Date().getFullYear()
    const reference = nextRef(store, 'FAC', year)
    const standardFileName = fileMeta
      ? buildStandardFilename({
          expense_date: payload.expense_date,
          reference,
          currency: amounts.currency,
          amount_pen: amounts.amount_pen,
          amount_eur: amounts.amount_eur,
          vendor_name: payload.vendor_name,
          label: payload.label,
          ext: '.pdf'
        })
      : null
    const facture = {
      id: uuid(),
      reference,
      demand_reference: payload.demand_reference,
      entry_source: 'demande',
      created_at: new Date().toISOString(),
      expense_date: payload.expense_date,
      submitter_email: session.email,
      project: payload.project,
      category: payload.category,
      amount_pen: amounts.amount_pen,
      amount_eur: amounts.amount_eur,
      currency: amounts.currency,
      exchange_rate: rateInfo.rate,
      exchange_source: `${rateInfo.source} · ${rateInfo.date}`,
      payment_type: payload.payment_type,
      payment_method: payload.payment_method,
      paid_by: payload.paid_by,
      vendor_name: payload.vendor_name,
      receipt_number: payload.receipt_number ?? '',
      location: payload.location,
      label: payload.label,
      status: 'draft',
      drive_file_id: null,
      drive_file_url: null,
      file_name: standardFileName,
      file_size: fileMeta?.size ?? null,
      treasurer_email: null,
      validated_at: null,
      reject_reason: null,
      resubmission_of: payload.resubmission_of ?? null,
      reimbursement_status: initialReimbursementStatus(payload.payment_type),
      reimbursed_at: null,
      reimbursed_by: null
    }
    store.factures.unshift(facture)
    appendAudit(store, session.email, 'facture_created', 'facture', facture.id, {
      reference: facture.reference,
      demand_reference: payload.demand_reference
    })
    if (!demande.invoicing_status) demande.invoicing_status = 'open'
    saveStore(store)
    return ok(facture)
  },

  async createFacturesBatch(sharedPayload, items) {
    const created = []
    for (const item of items) {
      const res = await this.createFacture(
        { ...sharedPayload, ...item },
        item.file ? { name: item.file.name, size: item.file.size } : null
      )
      created.push(res.data)
    }
    return ok({ factures: created, count: created.length })
  },

  async closeDemandeInvoicing(reference) {
    const session = requireAuth('member')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    if (demande.status !== 'approved') throw apiError('DEMAND_NOT_APPROVED', 'Demande non approuvée')
    if (demande.submitter_email !== session.email) throw apiError('FORBIDDEN', 'Demande non autorisée')
    if (demande.invoicing_status === 'submitted') {
      throw apiError('CONFLICT', 'Ce devis est déjà clôturé.', 409)
    }
    const drafts = store.factures.filter((f) => f.demand_reference === reference && f.status === 'draft')
    if (!drafts.length) {
      throw apiError('VALIDATION_FAILED', 'Aucune facture en brouillon')
    }
    demande.invoicing_status = 'submitted'
    demande.invoicing_submitted_at = new Date().toISOString()
    drafts.forEach((f) => {
      f.status = 'pending'
    })
    appendAudit(store, session.email, 'demande_invoicing_closed', 'demande', demande.id, {
      reference,
      facture_count: drafts.length
    })
    saveStore(store)
    return ok({
      ...demande,
      pending_facture_count: drafts.length,
      draft_count: 0
    })
  },

  async validateDemandeFactures(reference) {
    const session = requireAuth('treasurer')
    const store = loadStore()
    const demande = store.demandes.find((d) => d.reference === reference)
    if (!demande) throw apiError('DEMAND_NOT_FOUND', 'Demande introuvable')
    const pending = store.factures.filter((f) => f.demand_reference === reference && f.status === 'pending')
    if (!pending.length) throw apiError('VALIDATION_FAILED', 'Aucune facture en attente')
    const validatedAt = new Date().toISOString()
    const validated = []
    pending.forEach((facture) => {
      facture.status = 'validated'
      facture.treasurer_email = session.email
      facture.validated_at = validatedAt
      facture.reimbursement_status = reimbursementStatusOnValidate(facture.payment_type)
      store.journal.unshift({ ...facture, journal_at: validatedAt })
      validated.push(facture.reference)
    })
    let invoicedPen = 0
    store.factures.forEach((f) => {
      if (f.demand_reference === reference && f.status !== 'rejected') invoicedPen += Number(f.amount_pen) || 0
    })
    const maxPen = amountMaxWithTolerance(Number(demande.amount_pen_estimated))
    if (maxPen - invoicedPen > 0.001) {
      demande.invoicing_status = 'open'
      demande.invoicing_submitted_at = null
    }
    appendAudit(store, session.email, 'demande_factures_validated', 'demande', demande.id, {
      reference,
      facture_references: validated
    })
    saveStore(store)
    return ok({ demand_reference: reference, validated, count: validated.length, validated_at: validatedAt })
  },

  async createDirectExpense(payload, fileMeta) {
    const session = requireAuth('treasurer')
    if (!OPERATING_EXPENSE_CATEGORIES.includes(payload.category)) {
      throw apiError('VALIDATION_FAILED', 'Catégorie non autorisée pour saisie directe')
    }
    if (!DIRECT_EXPENSE_PAYMENT_TYPES.includes(payload.payment_type)) {
      throw apiError('VALIDATION_FAILED', 'Type de flux non autorisé')
    }

    const rateInfo = await fetchPenEurRate()
    const amounts = normalizeAmountPair({
      currency: payload.currency,
      amount: payload.amount,
      rate: rateInfo.rate
    })
    const validatedAt = new Date().toISOString()
    const year = new Date().getFullYear()
    const store = loadStore()

    const reference = nextRef(store, 'FAC', year)
    const standardFileName = fileMeta
      ? buildStandardFilename({
          expense_date: payload.expense_date,
          reference,
          currency: amounts.currency,
          amount_pen: amounts.amount_pen,
          amount_eur: amounts.amount_eur,
          vendor_name: payload.vendor_name,
          label: payload.label,
          ext: '.pdf'
        })
      : null
    const facture = {
      id: uuid(),
      reference,
      demand_reference: '',
      entry_source: 'direct',
      created_at: validatedAt,
      expense_date: payload.expense_date,
      submitter_email: session.email,
      project: OPERATING_EXPENSE_PROJECT,
      category: payload.category,
      amount_pen: amounts.amount_pen,
      amount_eur: amounts.amount_eur,
      currency: amounts.currency,
      exchange_rate: rateInfo.rate,
      exchange_source: `${rateInfo.source} · ${rateInfo.date}`,
      payment_type: payload.payment_type,
      payment_method: payload.payment_method,
      paid_by: 'AKUU',
      vendor_name: payload.vendor_name,
      receipt_number: payload.receipt_number ?? '',
      location: payload.location ?? 'France',
      label: payload.label,
      status: 'validated',
      drive_file_id: null,
      drive_file_url: null,
      file_name: standardFileName,
      treasurer_email: session.email,
      validated_at: validatedAt,
      reject_reason: null,
      resubmission_of: null,
      reimbursement_status: 'not_applicable',
      reimbursed_at: null,
      reimbursed_by: null
    }

    store.factures.unshift(facture)
    store.journal.unshift({
      journal_at: validatedAt,
      reference: facture.reference,
      demand_reference: '',
      expense_date: facture.expense_date,
      submitter_email: facture.submitter_email,
      project: facture.project,
      category: facture.category,
      amount_pen: facture.amount_pen,
      amount_eur: facture.amount_eur,
      exchange_rate: facture.exchange_rate,
      label: facture.label,
      drive_file_url: '',
      treasurer_email: session.email,
      validated_at: validatedAt
    })
    appendAudit(store, session.email, 'direct_expense_created', 'facture', facture.id, {
      reference: facture.reference
    })
    saveStore(store)
    return ok(facture)
  },

  async getFacturesPending() {
    requireAuth('treasurer')
    const store = loadStore()
    const demandesByRef = Object.fromEntries(store.demandes.map((d) => [d.reference, d]))
    return ok(
      store.factures.filter((f) => {
        if (f.status !== 'pending') return false
        if (!f.demand_reference) return true
        const d = demandesByRef[f.demand_reference]
        if (!d) return true
        const inv = d.invoicing_status || ''
        return !inv || inv === 'submitted'
      })
    )
  },

  async validateFacture(reference) {
    const session = requireAuth('treasurer')
    const store = loadStore()
    const facture = store.factures.find((f) => f.reference === reference)
    if (!facture) throw apiError('DEMAND_NOT_FOUND', 'Facture introuvable')
    facture.status = 'validated'
    facture.treasurer_email = session.email
    facture.validated_at = new Date().toISOString()
    facture.reimbursement_status = reimbursementStatusOnValidate(facture.payment_type)
    store.journal.unshift({ ...facture, journal_at: new Date().toISOString() })
    appendAudit(store, session.email, 'facture_validated', 'facture', facture.id, { reference })
    saveStore(store)
    return ok(facture)
  },

  async rejectFacture(reference, rejectReason) {
    const session = requireAuth('treasurer')
    if (!rejectReason?.trim()) throw apiError('REJECT_REASON_REQUIRED', 'Motif de refus obligatoire')
    const store = loadStore()
    const facture = store.factures.find((f) => f.reference === reference)
    if (!facture) throw apiError('DEMAND_NOT_FOUND', 'Facture introuvable')
    facture.status = 'rejected'
    facture.reject_reason = rejectReason.trim()
    facture.treasurer_email = session.email
    if (facture.demand_reference) {
      const demande = store.demandes.find((d) => d.reference === facture.demand_reference)
      const stillPending = store.factures.some(
        (f) => f.demand_reference === facture.demand_reference && f.status === 'pending'
      )
      if (demande?.invoicing_status === 'submitted' && !stillPending) {
        demande.invoicing_status = 'open'
        demande.invoicing_submitted_at = null
      }
    }
    appendAudit(store, session.email, 'facture_rejected', 'facture', facture.id, { reference, rejectReason })
    saveStore(store)
    return ok(facture)
  },

  async getReimbursementsPending() {
    requireAuth('treasurer')
    const store = loadStore()
    const rows = store.factures
      .map(normalizeFactureReimbursement)
      .filter(isReimbursementDue)
    return ok(rows)
  },

  async reimburseFacture(reference) {
    const session = requireAuth('treasurer')
    const store = loadStore()
    const facture = store.factures.find((f) => f.reference === reference)
    if (!facture) throw apiError('DEMAND_NOT_FOUND', 'Facture introuvable')
    if (facture.payment_type !== 'avance_benevole') {
      throw apiError('VALIDATION_FAILED', 'Remboursement réservé aux avances bénévoles')
    }
    if (facture.status !== 'validated') {
      throw apiError('VALIDATION_FAILED', 'La facture doit être validée avant remboursement')
    }
    if (facture.reimbursement_status === 'paid') {
      throw apiError('VALIDATION_FAILED', 'Déjà remboursé')
    }
    facture.reimbursement_status = 'paid'
    facture.reimbursed_at = new Date().toISOString()
    facture.reimbursed_by = session.email
    appendAudit(store, session.email, 'facture_reimbursed', 'facture', facture.id, { reference })
    saveStore(store)
    return ok(facture)
  },

  async getCompta() {
    requireAuth('treasurer')
    const store = loadStore()
    const journal = [...(store.journal ?? [])].sort((a, b) =>
      String(b.expense_date || b.journal_at).localeCompare(String(a.expense_date || a.journal_at))
    )
    return ok({ journal, summary: buildComptaSummary(journal) })
  },

  async getAvances(year) {
    requireAuth('treasurer')
    const y = Number(year) || new Date().getFullYear()
    const items =
      y === 2026
        ? [
            {
              id: 'avance-francois-ludovie-2026',
              year: 2026,
              beneficiary: 'François et Ludovie',
              amount_eur: 508.13,
              project: 'Musée Shapishiko',
              label: "Remboursement d'avances AKUU",
              statut: 'a_rembourser',
              echeance: '2026-12-31',
              source: 'engagement_tresorier'
            }
          ]
        : []
    const pending = items.filter((i) => i.statut === 'a_rembourser')
    return ok({
      year: y,
      items,
      pending_count: pending.length,
      total_a_rembourser_eur: pending.reduce((s, i) => s + i.amount_eur, 0)
    })
  },

  async getCaissePerou(year) {
    requireAuth('treasurer')
    const y = Number(year) || new Date().getFullYear()
    return ok({
      year: y,
      live: true,
      caisse_pen_ouverture: 0,
      caisse_pen_entrees: 0,
      caisse_pen_sorties: 0,
      caisse_pen_solde: 0,
      caisse_eur_equiv: 0,
      retraits_eur: 0,
      retraits_count: 0,
      especes_pen: 0,
      especes_count: 0,
      pen_to_eur: 0.24,
      pen_per_eur: 4.17,
      retraits: [],
      especes: [],
      note: 'Données mock — journal non branché.'
    })
  },

  async getHistory(opts = {}) {
    const session = requireAuth('member')
    const store = loadStore()
    const limit = Math.min(Math.max(Number(opts.limit) || 200, 50), 2000)
    let factures = store.factures.map(normalizeFactureReimbursement)
    let demandes
    let audit
    if (isTreasurerRole(session.role)) {
      demandes = store.demandes
      audit = store.audit
    } else {
      demandes = store.demandes.filter((d) => d.submitter_email === session.email)
      factures = factures.filter((f) => f.submitter_email === session.email)
      audit = store.audit.filter((a) => a.actor_email === session.email)
    }
    return ok({
      demandes: demandes.slice(0, limit),
      factures: factures.slice(0, limit),
      audit: audit.slice(0, limit),
      limit,
      truncated: demandes.length > limit || factures.length > limit || audit.length > limit
    })
  },

  async getExchangeRate() {
    requireAuth('member')
    const rateInfo = await fetchPenEurRate()
    return ok(rateInfo)
  },

  async createAccessRequest(payload) {
    const email = String(payload.email || '').toLowerCase().trim()
    const profile = normalizeUserProfile(payload)
    const requestedRole = normalizeRole(payload.requested_role || payload.requestedRole)
    const message = String(payload.message || '').trim()

    if (!email || !profile.first_name || !profile.last_name) {
      throw apiError('VALIDATION_FAILED', 'Prénom, nom et email requis')
    }
    if (!['benevole', 'tresorier', 'admin'].includes(requestedRole)) {
      throw apiError('VALIDATION_FAILED', 'Rôle demandé invalide')
    }
    if (hasAccess(email)) throw apiError('ALREADY_MEMBER', 'Cet email dispose déjà d\'un accès')

    const store = loadStore()
    store.accessRequests = store.accessRequests ?? []
    if (store.accessRequests.some((r) => r.email === email && r.status === 'pending')) {
      throw apiError('DUPLICATE_REQUEST', 'Une demande est déjà en cours pour cet email')
    }

    const row = {
      id: uuid(),
      created_at: new Date().toISOString(),
      email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      name: profile.name,
      requested_role: requestedRole,
      message,
      status: 'pending',
      decided_at: null,
      decided_by: null,
      reject_reason: null
    }
    store.accessRequests.unshift(row)
    appendAudit(store, email, 'access_request_create', 'access_request', row.id, { requested_role: requestedRole })
    saveStore(store)
    return ok(row)
  },

  async getAccessRequestsPending() {
    requireAuth('admin')
    const store = loadStore()
    return ok((store.accessRequests ?? []).filter((r) => r.status === 'pending'))
  },

  async approveAccessRequest(id) {
    const session = requireAuth('admin')
    const store = loadStore()
    const req = (store.accessRequests ?? []).find((r) => r.id === id && r.status === 'pending')
    if (!req) throw apiError('NOT_FOUND', 'Demande introuvable ou déjà traitée')

    store.registeredUsers = store.registeredUsers ?? []
    const profile = normalizeUserProfile(req)
    store.registeredUsers.push({
      email: req.email,
      password: 'demo-akuu-2026',
      role: normalizeRole(req.requested_role),
      first_name: profile.first_name,
      last_name: profile.last_name,
      name: profile.name
    })
    req.status = 'approved'
    req.decided_at = new Date().toISOString()
    req.decided_by = session.email
    appendAudit(store, session.email, 'access_request_approve', 'access_request', id, { email: req.email })
    saveStore(store)
    return ok({ id, email: req.email, role: req.requested_role, status: 'approved' })
  },

  async rejectAccessRequest(id, rejectReason) {
    const session = requireAuth('admin')
    if (!rejectReason?.trim()) throw apiError('VALIDATION_FAILED', 'Motif de refus obligatoire')
    const store = loadStore()
    const req = (store.accessRequests ?? []).find((r) => r.id === id && r.status === 'pending')
    if (!req) throw apiError('NOT_FOUND', 'Demande introuvable ou déjà traitée')

    req.status = 'rejected'
    req.decided_at = new Date().toISOString()
    req.decided_by = session.email
    req.reject_reason = rejectReason.trim()
    appendAudit(store, session.email, 'access_request_reject', 'access_request', id, { reason: rejectReason })
    saveStore(store)
    return ok({ id, status: 'rejected' })
  }
}

export { DEMO_USERS }
