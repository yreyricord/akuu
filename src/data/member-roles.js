/** Rôles espace adhérent AKUU — admin / trésorier / bénévole */

export const ADMIN_EMAIL = 'yoannreyricord@gmail.com'

export const REQUESTABLE_ROLES = [
  { code: 'benevole', label: 'Bénévole', hint: 'Formations, missions, demandes de dépense' },
  { code: 'tresorier', label: 'Trésorier', hint: 'Validation des dépenses et compta' },
  { code: 'admin', label: 'Administrateur', hint: 'Gestion des accès et administration' }
]

export const ROLE_LABELS = {
  admin: 'Administrateur',
  tresorier: 'Trésorier',
  benevole: 'Bénévole',
  treasurer: 'Trésorier',
  member: 'Bénévole'
}

export function normalizeRole(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'treasurer') return 'tresorier'
  if (r === 'member') return 'benevole'
  return r
}

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS[normalizeRole(role)] ?? role
}

export function isTreasurerRole(role) {
  const r = normalizeRole(role)
  return r === 'tresorier' || r === 'admin'
}

export function isAdminRole(role) {
  return normalizeRole(role) === 'admin'
}

/** Seul l'admin principal peut valider les demandes d'accès */
export function isSuperAdmin(email, role) {
  return isAdminRole(role) && String(email || '').toLowerCase() === ADMIN_EMAIL
}

export function userHasTabAccess(userRole, tabRoles) {
  const normalized = normalizeRole(userRole)
  return tabRoles.some((r) => normalizeRole(r) === normalized)
}
