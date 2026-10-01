import { ref, computed, unref } from 'vue'

const STORAGE_KEY = 'akuu_releves_uploaded_v1'

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const version = ref(0)

/** Mois marqués comme uploadés (local dev ou en attente regénération JSON). */
export function useRelevesPending(yearRef) {
  const pending = computed(() => {
    void version.value
    const year = String(unref(yearRef))
    return loadAll()[year] ?? []
  })

  function isMonthPending(month) {
    return pending.value.includes(Number(month))
  }

  function refreshPending() {
    version.value += 1
  }

  return { pending, isMonthPending, refreshPending }
}

export function markReleveUploaded(year, month, filename) {
  const all = loadAll()
  const key = String(year)
  const set = new Set(all[key] ?? [])
  set.add(Number(month))
  all[key] = [...set].sort((a, b) => a - b)
  all[`${key}_meta`] = {
    ...(all[`${key}_meta`] ?? {}),
    [month]: { filename, at: new Date().toISOString() }
  }
  saveAll(all)
  version.value += 1
}

export function clearRelevesPending(year) {
  const all = loadAll()
  delete all[String(year)]
  delete all[`${String(year)}_meta`]
  saveAll(all)
  version.value += 1
}
