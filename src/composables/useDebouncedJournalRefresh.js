/**
 * Coalesce les rechargements journal (loadLive force) après des tâches background.
 * Max 1 refresh par fenêtre de DEBOUNCE_MS, même si plusieurs OK rapides.
 */

const DEBOUNCE_MS = 2000

/** @type {Map<string, { loadFn: Function, timer: ReturnType<typeof setTimeout> | null, years: Set<string> }>} */
const channels = new Map()

function channelKey(loadFn) {
  return loadFn
}

/**
 * @param {(year: string, opts?: object) => Promise<unknown>} loadFn
 * @returns {{ schedule: (year: string | number) => void, flush: () => Promise<void> }}
 */
export function useDebouncedJournalRefresh(loadFn) {
  const key = channelKey(loadFn)
  if (!channels.has(key)) {
    channels.set(key, { loadFn, timer: null, years: new Set() })
  }
  const ch = channels.get(key)

  function schedule(year) {
    ch.years.add(String(year))
    if (ch.timer) return
    ch.timer = setTimeout(async () => {
      const years = [...ch.years]
      ch.years.clear()
      ch.timer = null
      await Promise.all(years.map((y) => ch.loadFn(y, { force: true, quiet: true })))
    }, DEBOUNCE_MS)
  }

  async function flush() {
    if (ch.timer) {
      clearTimeout(ch.timer)
      ch.timer = null
    }
    const years = [...ch.years]
    ch.years.clear()
    if (years.length) {
      await Promise.all(years.map((y) => ch.loadFn(y, { force: true, quiet: true })))
    }
  }

  return { schedule, flush }
}
