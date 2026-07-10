/**
 * Structural catalog for the volunteer training area. Titles/descriptions
 * live in i18n (`formation.groups.group_N`, `formation.modules.module_N`);
 * this file only holds ordering, grouping and the accent color per group.
 */
export const FORMATION_GROUPS = [
  { id: 1, accent: 'forest', image: '/images/hero-amazon.jpg' },
  { id: 2, accent: 'bleu', image: '/images/projet-highlight.jpg' },
  { id: 3, accent: 'terracotta', image: '/images/hero-association.jpg' },
  { id: 4, accent: 'night', image: '/images/Histoire/5.jpg' }
]

export const FORMATION_MODULES = [
  { id: 1, groupId: 1 },
  { id: 2, groupId: 1 },
  { id: 3, groupId: 1 },
  { id: 4, groupId: 1 },
  { id: 5, groupId: 2 },
  { id: 6, groupId: 2 },
  { id: 7, groupId: 2 },
  { id: 8, groupId: 3 },
  { id: 9, groupId: 3 },
  { id: 10, groupId: 3 },
  { id: 11, groupId: 4 }
]

export function modulesForGroup (groupId) {
  return FORMATION_MODULES.filter((m) => m.groupId === groupId)
}

export function findModule (id) {
  const numericId = Number(id)
  return FORMATION_MODULES.find((m) => m.id === numericId)
}

export function findGroup (groupId) {
  return FORMATION_GROUPS.find((g) => g.id === groupId)
}

/**
 * Module ids with real interactive content (a Claude Design deck served as a
 * static bundle under public/formation/). Modules not listed here fall back
 * to the "coming soon" placeholder in FormationModuleView.vue.
 */
export const MODULE_DECKS = {
  1: '/formation/module-1-deck/index.html',
  2: '/formation/module-2-deck/index.html',
  3: '/formation/module-3-deck/index.html',
  4: '/formation/module-4-deck/index.html',
  5: '/formation/module-5-deck/index.html'
}

/**
 * Static Tailwind class strings per accent color, keyed by the `accent`
 * values used in FORMATION_GROUPS. Written out literally (not built via
 * template strings) so Tailwind's content scanner can find them - dynamic
 * class names like `text-${accent}` are invisible to the JIT compiler.
 */
export const ACCENT_CLASSES = {
  forest: {
    text: 'text-forest',
    rule: 'bg-forest',
    badge: 'bg-forest text-white',
    border: 'hover:border-forest',
    glow: 'shadow-[0_0_90px_-25px_rgba(45,105,21,0.7)]',
    corner: 'border-forest'
  },
  bleu: {
    text: 'text-bleu',
    rule: 'bg-bleu',
    badge: 'bg-bleu text-white',
    border: 'hover:border-bleu',
    glow: 'shadow-[0_0_90px_-25px_rgba(4,72,143,0.7)]',
    corner: 'border-bleu'
  },
  terracotta: {
    text: 'text-terracotta',
    rule: 'bg-terracotta',
    badge: 'bg-terracotta text-white',
    border: 'hover:border-terracotta',
    glow: 'shadow-[0_0_90px_-25px_rgba(231,111,81,0.7)]',
    corner: 'border-terracotta'
  },
  night: {
    text: 'text-night',
    rule: 'bg-night',
    badge: 'bg-night text-white',
    border: 'hover:border-night',
    glow: 'shadow-[0_0_90px_-25px_rgba(255,255,255,0.25)]',
    corner: 'border-night-200'
  }
}
