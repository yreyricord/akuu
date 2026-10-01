/**
 * Config métier trésorerie — alignée finances-ag.json + doc 05-plan-comptable-categories.md
 */

export const TRESORERIE_PROJECTS = [
  { code: 'musee', label: 'Musée Shapishiko' },
  { code: 'maison', label: 'Projet Maison communautaire' },
  { code: 'akuuvision', label: 'AKUUVision' },
  { code: 'anglais', label: "Cours d'anglais" },
  { code: 'hydrama', label: 'Hydrama' },
  { code: 'lowtech', label: 'Low Tech' },
  { code: 'dechets', label: 'Gestion des déchets' },
  { code: 'sensibilisation', label: 'Sensibilisation' },
  { code: 'fonctionnement', label: 'Frais de fonctionnement' },
  { code: 'divers', label: 'Divers / non affecté' }
]

export const TRESORERIE_CATEGORIES = [
  { code: 'transport', label: 'Transport & logistique' },
  { code: 'hebergement_resto', label: 'Hébergement & restauration mission' },
  { code: 'materiel', label: 'Matériel & fournitures' },
  { code: 'equipement', label: 'Équipement durable' },
  { code: 'communication', label: 'Communication' },
  { code: 'services_locaux', label: 'Services locaux & main d\'œuvre' },
  { code: 'sante', label: 'Santé & pharmacie' },
  { code: 'batiment_travaux', label: 'Bâtiment & travaux' },
  { code: 'formation', label: 'Formation & animation' },
  { code: 'banque_frais', label: 'Frais bancaires & change' },
  { code: 'admin_assurance', label: 'Administratif & assurance' },
  { code: 'autre', label: 'Autre (justification obligatoire)' }
]

export const PAYMENT_TYPES = [
  { code: 'avance_benevole', label: "J'ai avancé l'argent (demande remboursement)" },
  { code: 'avance_asso', label: 'Avance trésorerie association' },
  { code: 'carte_asso', label: 'Payé carte bancaire AKUU' }
]

/** Catégories autorisées pour saisie directe trésorier (sans demande préalable) */
export const OPERATING_EXPENSE_CATEGORIES = [
  'banque_frais',
  'admin_assurance',
  'communication',
  'autre'
]

export const OPERATING_EXPENSE_PROJECT = 'fonctionnement'

export const DIRECT_EXPENSE_PAYMENT_TYPES = ['carte_asso', 'virement', 'avance_asso']

export const PAYMENT_METHODS = [
  { code: 'especes', label: 'Espèces (caisse Pérou)' },
  { code: 'avance', label: 'Avance bénévole (hors caisse)' },
  { code: 'cb', label: 'Carte bancaire' },
  { code: 'virement', label: 'Virement' },
  { code: 'paypal', label: 'PayPal' },
  { code: 'yape_plin', label: 'Yape / Plin (Pérou)' },
  { code: 'autre', label: 'Autre' }
]

export const DEMANDE_STATUSES = {
  awaiting_approval: { label: 'En attente', color: 'ochre' },
  approved: { label: 'Approuvée', color: 'leaf' },
  rejected: { label: 'Refusée', color: 'terracotta' },
  cancelled: { label: 'Annulée', color: 'night' }
}

export const FACTURE_STATUSES = {
  draft: { label: 'Brouillon', color: 'night' },
  pending: { label: 'En attente', color: 'ochre' },
  validated: { label: 'Validée', color: 'leaf' },
  rejected: { label: 'Refusée', color: 'terracotta' }
}

/** Suivi remboursement bénévole (avance_benevole uniquement) */
export const REIMBURSEMENT_STATUSES = {
  not_applicable: { label: '—', color: 'night' },
  awaiting_validation: { label: 'Preuve à valider', color: 'bleu' },
  to_pay: { label: 'À rembourser', color: 'ochre' },
  paid: { label: 'Remboursé', color: 'leaf' }
}

export function initialReimbursementStatus(paymentType) {
  return paymentType === 'avance_benevole' ? 'awaiting_validation' : 'not_applicable'
}

export function reimbursementStatusOnValidate(paymentType) {
  return paymentType === 'avance_benevole' ? 'to_pay' : 'not_applicable'
}

/** Normalise les factures existantes sans colonne reimbursement_status */
export function normalizeFactureReimbursement(facture) {
  if (!facture || facture.payment_type !== 'avance_benevole') {
    return { ...facture, reimbursement_status: 'not_applicable' }
  }
  if (facture.reimbursement_status) return facture
  if (facture.status === 'validated') {
    return { ...facture, reimbursement_status: facture.reimbursed_at ? 'paid' : 'to_pay' }
  }
  return { ...facture, reimbursement_status: 'awaiting_validation' }
}

export function isReimbursementDue(facture) {
  const f = normalizeFactureReimbursement(facture)
  return f.reimbursement_status === 'to_pay'
}

export function isReimbursementOverdue(facture) {
  if (!isReimbursementDue(facture) || !facture.validated_at) return false
  const ms = Date.now() - new Date(facture.validated_at).getTime()
  return ms / 86400000 > ADVANCE_REGULARIZATION_DAYS
}

export function sumPen(rows) {
  return rows.reduce((acc, r) => acc + (Number(r.amount_pen) || 0), 0)
}

export function sumEur(rows) {
  return rows.reduce((acc, r) => acc + (Number(r.amount_eur) || 0), 0)
}

export { TREASORERIE_TABS, ADMIN_TABS } from './tresorerie-tabs.js'

export function labelFor(code, list) {
  return list.find((item) => item.code === code)?.label ?? code
}

export function formatPen(amount) {
  return `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PEN`
}

export function formatEur(amount) {
  return `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/**
 * Seuils · Procédure de gestion des dépenses AKUU (version 2026, en soles PEN)
 * @see Processus de gestion des dépenses.docx
 */
export const PEN_ROUTINE_MAX = 50
export const PEN_TREASURER_MAX = 300
/** Au-delà de ce montant : photos/PDF des devis fournisseurs obligatoires (la demande/devis reste toujours requise). */
export const DEVIS_PEN_THRESHOLD = 1000
export const MIN_DEVIS_ATTACHMENTS = 2
export const ADVANCE_REGULARIZATION_DAYS = 30

/** @deprecated Affichage legacy */
export const DEVIS_EUR_THRESHOLD = 500

/** Photos ou PDF de devis fournisseurs à joindre (> 1000 S/.). */
export function requiresDevisPhotoAttachments(amountPen) {
  return Number(amountPen) > DEVIS_PEN_THRESHOLD
}

/** @deprecated Alias · préférer requiresDevisPhotoAttachments */
export function requiresDevisAttachments(amountPen) {
  return requiresDevisPhotoAttachments(amountPen)
}

/** Suivi validation des pièces de devis jointes (> 1000 S/.) */
export const DEVIS_STATUSES = {
  not_required: { label: 'Sans photo de devis', color: 'night' },
  pending: { label: 'Photos de devis à valider', color: 'ochre' },
  validated: { label: 'Photos de devis validées', color: 'leaf' },
  rejected: { label: 'Photos de devis refusées', color: 'terracotta' }
}

export function initialDevisStatus(amountPen) {
  return requiresDevisPhotoAttachments(amountPen) ? 'pending' : 'not_required'
}

export function canApproveDemande(demande) {
  if (!demande) return false
  if (!requiresDevisPhotoAttachments(demande.amount_pen_estimated)) return true
  return demande.devis_status === 'validated'
}

/** Trésorier peut valider ou refuser les pièces de devis (pas si déjà validées ou refusées). */
export function canValidateDevisPhotos(demande) {
  if (!demande || !requiresDevisPhotoAttachments(demande.amount_pen_estimated)) return false
  const st = demande.devis_status || initialDevisStatus(demande.amount_pen_estimated)
  if (st === 'validated' || st === 'rejected') return false
  return (demande.devis_attachments?.length ?? 0) >= MIN_DEVIS_ATTACHMENTS
}

/** Devis refusés : le bénévole doit renvoyer de nouvelles pièces (onglet Demande). */
export function awaitingVolunteerDevisResubmit(demande) {
  return demande?.status === 'awaiting_approval' && demande?.devis_status === 'rejected'
}

/** Niveau de validation selon le montant (procédure § IV) */
export function getValidationLevel(amountPen) {
  const n = Number(amountPen)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n <= PEN_ROUTINE_MAX) return 'routine'
  if (n <= PEN_TREASURER_MAX) return 'treasurer'
  return 'cg'
}

export const VALIDATION_LEVEL_LABELS = {
  routine: 'Dépense courante (≤ 50 S/.) — doit rester utile au projet et prévue au budget',
  treasurer: 'Validation trésorier requise (51–300 S/.) — demande obligatoire avant achat',
  cg: 'Validation Conseil général (> 300 S/.) — demande (devis) obligatoire · photos des devis si > 1000 S/.'
}

export const PROCESS_EXCLUDED_EXPENSES = [
  'Alimentation destinée aux volontaires',
  'Déplacements sans accord préalable du Conseil général'
]

/** Dépassement max facture vs devis demande (+10 % · moins = OK) */
export const AMOUNT_TOLERANCE_PERCENT = 10

export function amountPenMax(estimatedPen) {
  const base = Number(estimatedPen)
  return Math.round(base * (1 + AMOUNT_TOLERANCE_PERCENT / 100) * 100) / 100
}

export function amountPenBounds(estimatedPen) {
  const base = Number(estimatedPen)
  return {
    base,
    max: amountPenMax(base)
  }
}

export function isAmountWithinTolerance(actualPen, estimatedPen) {
  const actual = Number(actualPen)
  if (!Number.isFinite(actual) || actual <= 0) return false
  return actual <= amountPenMax(estimatedPen)
}
