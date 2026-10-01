/** Modules de l'espace adhérent — extensible (Formation, etc.) */

export const ADMIN_MODULES = [
  {
    id: 'tresorerie',
    label: 'Trésorerie',
    tagline: 'Dépenses mission Pérou',
    description: 'Demandes avant achat, factures, validation trésorier et suivi comptable.',
    icon: 'wallet',
    accent: 'forest',
    available: true,
    defaultTab: 'guide'
  },
  {
    id: 'formation',
    label: 'Formation',
    tagline: 'Parcours volontaires',
    description: 'Modules de préparation mission, ressources et suivi de progression.',
    icon: 'graduation',
    accent: 'bleu',
    available: false,
    comingSoon: true
  }
]

export function getModule(id) {
  return ADMIN_MODULES.find((m) => m.id === id) ?? null
}
