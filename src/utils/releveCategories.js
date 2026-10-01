/** Catégorie et projet proposés pour une opération de relevé (mêmes règles que consolider_comptes.py). */

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export const RECETTE_CATEGORIES = [
  'HelloAsso - dons et campagnes', 'Dons directs', 'Subventions et prix', 'Adhésions', 'Loyers et logement',
  'Ventes et prestations', 'Remboursements / annulations', 'Prêts / avances', 'Recette à qualifier'
]
export const DEPENSE_CATEGORIES = [
  'Dépenses par carte', 'Virements sortants', 'Transferts et retraits terrain', 'Frais bancaires',
  'Abonnements et numérique', 'Prélèvements', 'Remboursements de prêts / avances', 'Autres dépenses'
]
export const JOURNAL_PROJECTS = [
  { code: 'MUSEE', label: 'Musée Shapishiko' },
  { code: 'MAISON', label: 'Maison communautaire' },
  { code: 'AKUUVISION', label: 'AKUUVision' },
  { code: 'ANGLAIS', label: "Cours d'anglais" },
  { code: 'HYDRAMA', label: 'Hydrama' },
  { code: 'LOW_TECH', label: 'Low Tech' },
  { code: 'GESTION_DECHETS', label: 'Gestion des déchets' },
  { code: 'SENSIBILISATION', label: 'Sensibilisation' },
  { code: 'FONCTIONNEMENT', label: 'Fonctionnement' },
  { code: 'DIVERS', label: 'Divers / à préciser' }
]

export function suggest(op) {
  const l = norm(op.label)
  if (op.amount > 0) {
    let category = 'Recette à qualifier'
    if (/helloasso|lemonway|stripe technology/.test(l)) category = 'HelloAsso - dons et campagnes'
    else if (/subvention|fonjep|fondation|ingenieurs icam|prix /.test(l)) category = 'Subventions et prix'
    else if (/loyer/.test(l)) category = 'Loyers et logement'
    else if (/^cb |remise\/cotisation/.test(l)) category = 'Remboursements / annulations'
    else if (/retour pret|remboursement d un pret|avance/.test(l)) category = 'Prêts / avances'
    else if (/cotisation|adhesion/.test(l)) category = 'Adhésions'
    else if (/vente|prestation|facture/.test(l)) category = 'Ventes et prestations'
    else if (/paypal|\bdon\b|lilo/.test(l)) category = 'Dons directs'
    return { category, project: /akuuvision/.test(l) ? 'AKUUVISION' : '' }
  }
  if (/esprit association|commission|cotisation carte|frais/.test(l)) return { category: 'Frais bancaires', project: 'FONCTIONNEMENT' }
  if (/wix|greengeeks|adobe|weglot|skype|google one|apple|bitwarden|ovh/.test(l)) return { category: 'Abonnements et numérique', project: 'FONCTIONNEMENT' }
  if (/western union|disposicion|atm |retrait/.test(l)) return { category: 'Transferts et retraits terrain', project: '' }
  if (/remboursement d un pret|\bpret\b/.test(l)) return { category: 'Remboursements de prêts / avances', project: '' }
  if (/^cb /.test(l)) return { category: 'Dépenses par carte', project: '' }
  if (/prlv|prelevement/.test(l)) return { category: 'Prélèvements', project: '' }
  if (/vir/.test(l)) return { category: 'Virements sortants', project: '' }
  return { category: 'Autres dépenses', project: '' }
}
