/** Onglets visibles en barre du bas mobile (≤4 + Modules + Plus). */
export const TREASORERIE_MOBILE_PRIMARY_TREASURER = ['guide', 'demande', 'facture', 'validation']
export const TREASORERIE_MOBILE_PRIMARY_MEMBER = ['guide', 'demande', 'facture', 'historique']

/** Onglets du module Trésorerie (barre du bas) — fichier léger pour le bundle admin. */
export const TREASORERIE_TABS = [
  { id: 'guide', label: 'Guide', roles: ['benevole', 'tresorier', 'admin'] },
  { id: 'demande', label: 'Demande', roles: ['benevole', 'tresorier', 'admin'] },
  { id: 'facture', label: 'Facture', roles: ['benevole', 'tresorier', 'admin'] },
  { id: 'validation', label: 'Validation', roles: ['tresorier', 'admin'] },
  { id: 'fonctionnement', label: 'Fonc.', roles: ['tresorier', 'admin'] },
  { id: 'compta', label: 'Compta', roles: ['tresorier', 'admin'] },
  { id: 'bilan', label: 'Bilan', roles: ['tresorier', 'admin'] },
  { id: 'acces', label: 'Accès', roles: ['admin'], superAdminOnly: true },
  { id: 'transparence', label: 'Transparence', roles: ['benevole', 'tresorier', 'admin'] },
  { id: 'historique', label: 'Historique', roles: ['benevole', 'tresorier', 'admin'] }
]

/** @deprecated Utiliser TREASORERIE_TABS */
export const ADMIN_TABS = TREASORERIE_TABS
