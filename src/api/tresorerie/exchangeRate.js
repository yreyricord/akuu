const CACHE_KEY = 'akuu_pen_eur_rate'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const FALLBACK_RATE = 0.24

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(payload) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, cachedAt: Date.now() }))
}

/**
 * Taux PEN → EUR (1 PEN = X EUR) via Frankfurter (ECB).
 */
export async function fetchPenEurRate() {
  const cached = readCache()
  if (cached) return cached

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=PEN&to=EUR')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rate = data.rates?.EUR
    if (!rate) throw new Error('Rate missing')
    const payload = {
      rate,
      source: 'Frankfurter/ECB',
      date: data.date
    }
    writeCache(payload)
    return payload
  } catch {
    return {
      rate: FALLBACK_RATE,
      source: 'fallback',
      date: new Date().toISOString().slice(0, 10)
    }
  }
}

export function penToEur(amountPen, rate) {
  return Math.round(Number(amountPen) * Number(rate) * 100) / 100
}

export function eurToPen(amountEur, rate) {
  const r = Number(rate)
  const eur = Number(amountEur)
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(eur)) return 0
  return Math.round((eur / r) * 100) / 100
}
