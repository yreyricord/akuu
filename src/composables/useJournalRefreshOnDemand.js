/**
 * Regroupe les rechargements journal demandés après des tâches de fond.
 *
 * Le rechargement n'est plus automatique : schedule() note l'année à recharger et signale
 * que l'affichage est périmé ; c'est le bouton « Mettre à jour la page » de la barre de tâches
 * (voir usePendingRefresh) qui déclenche flush(). Plusieurs OK rapprochés = un seul rechargement.
 */

import { markDataStale, onPendingRefresh } from './usePendingRefresh.js'

/** @type {Map<Function, { loadFn: Function, years: Set<string>, registered: boolean }>} */
const channels = new Map()

/**
 * @param {(year: string, opts?: object) => Promise<unknown>} loadFn
 * @returns {{ schedule: (year: string | number) => void, flush: () => Promise<void> }}
 */
export function useJournalRefreshOnDemand(loadFn) {
  if (!channels.has(loadFn)) {
    channels.set(loadFn, { loadFn, years: new Set(), registered: false })
  }
  const ch = channels.get(loadFn)

  // Canal partagé par plusieurs composants : l'enregistrement doit survivre à leur démontage.
  if (!ch.registered) {
    ch.registered = true
    onPendingRefresh(() => flush(), { permanent: true })
  }

  function schedule(year) {
    if (year !== undefined && year !== null && year !== '') ch.years.add(String(year))
    markDataStale()
  }

  async function flush() {
    const years = [...ch.years]
    ch.years.clear()
    if (!years.length) return
    await Promise.all(years.map((y) => ch.loadFn(y, { force: true, quiet: true })))
  }

  return { schedule, flush }
}
