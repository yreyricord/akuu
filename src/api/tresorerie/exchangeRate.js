const CACHE_KEY = 'akuu_pen_eur_rate'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const DATE_CACHE_PREFIX = 'akuu_pen_eur_rate_'
const DATE_WALKBACK_DAYS = 14

const FALLBACK_RATE = 0.24

/** @type {Map<string, { rate: number, source: string, date: string, requestedDate?: string, approximate?: boolean }>} */
const memoryDateCache = new Map()

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

function readDateCache(isoDate) {
  try {
    const raw = localStorage.getItem(DATE_CACHE_PREFIX + isoDate)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeDateCache(isoDate, payload) {
  try {
    localStorage.setItem(DATE_CACHE_PREFIX + isoDate, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

function normalizeIsoDate(value) {
  const iso = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : ''
}

function shiftIsoDate(isoDate, deltaDays) {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + deltaDays)
  return d.toISOString().slice(0, 10)
}

async function fetchFromCurrencyApi(isoDate) {
  const urls = [
    `https://${isoDate}.currency-api.pages.dev/v1/currencies/pen.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${isoDate}/v1/currencies/pen.json`
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const rate = data?.pen?.eur
      if (!rate) continue
      return {
        rate: Number(rate),
        source: 'Currency API',
        date: data.date || isoDate
      }
    } catch {
      /* try next */
    }
  }
  return null
}

async function fetchLatestPenEurRateUncached() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/PEN')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rate = data.rates?.EUR
    if (!rate) throw new Error('Rate missing')
    const payload = {
      rate: Number(rate),
      source: 'Exchange Rate API',
      date: data.time_last_update_utc?.slice(0, 10) || new Date().toISOString().slice(0, 10)
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

/**
 * Taux PEN → EUR (1 PEN = X EUR) — dernier taux disponible.
 */
export async function fetchPenEurRate() {
  const cached = readCache()
  if (cached) return cached
  return fetchLatestPenEurRateUncached()
}

/**
 * Taux PEN → EUR à la date de l'écriture (recherche jusqu'à 14 jours en arrière si week-end).
 * @param {string} onDate ISO YYYY-MM-DD
 */
export async function fetchPenEurRateForDate(onDate) {
  const requested = normalizeIsoDate(onDate)
  if (!requested) return fetchPenEurRate()

  if (memoryDateCache.has(requested)) return memoryDateCache.get(requested)

  const stored = readDateCache(requested)
  if (stored) {
    memoryDateCache.set(requested, stored)
    return stored
  }

  for (let i = 0; i <= DATE_WALKBACK_DAYS; i += 1) {
    const probe = shiftIsoDate(requested, -i)
    const hit = await fetchFromCurrencyApi(probe)
    if (!hit) continue
    const payload = {
      ...hit,
      requestedDate: requested,
      approximate: probe !== requested
    }
    if (probe !== requested) {
      payload.source = `${hit.source} · ${probe}`
    }
    memoryDateCache.set(requested, payload)
    writeDateCache(requested, payload)
    return payload
  }

  const latest = await fetchPenEurRate()
  const fallback = {
    ...latest,
    requestedDate: requested,
    approximate: true,
    source: `${latest.source} (taux du ${latest.date}, date ${requested} indisponible)`
  }
  memoryDateCache.set(requested, fallback)
  return fallback
}

/** Précharge les taux pour plusieurs dates (dédupliquées). */
export async function prefetchPenEurRatesForDates(dates) {
  const unique = [...new Set(dates.map(normalizeIsoDate).filter(Boolean))]
  const out = {}
  await Promise.all(
    unique.map(async (d) => {
      out[d] = await fetchPenEurRateForDate(d)
    })
  )
  return out
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
