import { getCurrentScope, onScopeDispose, ref } from 'vue'

/**
 * Actualisation manuelle après les tâches de fond.
 *
 * Les envois (journal, validation, relevé…) ne rechargent plus l'écran tout seuls :
 * ils appellent markDataStale(), et c'est l'utilisateur qui déclenche le rechargement
 * depuis la barre de tâches (« Mettre à jour la page »).
 *
 * Chaque vue enregistre ici le rechargement qui la concerne ; runPendingRefresh()
 * les exécute tous. L'état est partagé au niveau du module : une seule barre pour toute l'app.
 */

const pending = ref(false)
const handlers = new Set()

/** Vrai dès qu'une tâche a modifié des données affichées, jusqu'au prochain rechargement manuel. */
export const dataPending = pending

/** À appeler par toute tâche de fond qui change le journal (édition, import, validation…). */
export function markDataStale() {
  pending.value = true
}

/** Effacer l'indicateur sans recharger (ex. la vue s'est déjà rafraîchie par un autre chemin). */
export function clearDataPending() {
  pending.value = false
}

/**
 * Enregistre un rechargement déclenché par le bouton de la barre de tâches.
 *
 * @param {() => unknown} fn
 * @param {{ permanent?: boolean }} [opts]
 *   permanent : le rechargement appartient à un canal partagé (journal, caisse) et doit
 *   survivre au démontage du composant qui l'a enregistré le premier.
 * @returns {() => void} désinscription
 */
export function onPendingRefresh(fn, { permanent = false } = {}) {
  handlers.add(fn)
  if (!permanent && getCurrentScope()) {
    onScopeDispose(() => handlers.delete(fn))
  }
  return () => handlers.delete(fn)
}

/** Exécute tous les rechargements enregistrés, puis éteint l'indicateur. */
export async function runPendingRefresh() {
  const list = [...handlers]
  pending.value = false
  // Aucune vue abonnée (onglet sans données de journal) : on recharge la page entière.
  if (!list.length) {
    window.location.reload()
    return
  }
  await Promise.allSettled(list.map((fn) => fn()))
}
