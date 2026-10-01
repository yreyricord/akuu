import { penToEur } from '@/api/tresorerie/exchangeRate.js'
import { formatEur, formatPen, AMOUNT_TOLERANCE_PERCENT } from '@/data/tresorerie-config.js'

export const CURRENCY_PEN = 'PEN'
export const CURRENCY_EUR = 'EUR'
export const DEFAULT_CURRENCY = CURRENCY_PEN

export const CURRENCY_OPTIONS = [
  { code: CURRENCY_PEN, label: 'S/. soles', short: 'S/.' },
  { code: CURRENCY_EUR, label: 'Euros', short: '€' }
]

export function normalizeCurrency(currency) {
  return String(currency || DEFAULT_CURRENCY).toUpperCase() === CURRENCY_EUR ? CURRENCY_EUR : CURRENCY_PEN
}

export function eurToPen(amountEur, rate) {
  const r = Number(rate)
  const eur = Number(amountEur)
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(eur)) return 0
  return Math.round((eur / r) * 100) / 100
}

export function normalizeAmountPair({ currency, amount, rate, amount_pen, amount_eur }) {
  const cur = normalizeCurrency(currency)
  const r = Number(rate) || 0.24
  let pen
  let eur

  if (amount != null && Number.isFinite(Number(amount))) {
    if (cur === CURRENCY_EUR) {
      eur = Number(amount)
      pen = eurToPen(eur, r)
    } else {
      pen = Number(amount)
      eur = penToEur(pen, r)
    }
  } else if (amount_pen != null) {
    pen = Number(amount_pen)
    eur = amount_eur != null ? Number(amount_eur) : penToEur(pen, r)
  } else {
    pen = 0
    eur = 0
  }

  return { currency: cur, amount_pen: pen, amount_eur: eur }
}

export function nativeEstimated(demande) {
  const c = normalizeCurrency(demande?.currency)
  return c === CURRENCY_EUR
    ? Number(demande?.amount_eur_estimated)
    : Number(demande?.amount_pen_estimated)
}

export function nativeActual(row) {
  const c = normalizeCurrency(row?.currency)
  return c === CURRENCY_EUR ? Number(row?.amount_eur) : Number(row?.amount_pen)
}

export function amountMaxWithTolerance(base) {
  return Math.round(Number(base) * (1 + AMOUNT_TOLERANCE_PERCENT / 100) * 100) / 100
}

export function amountBoundsNative(estimatedNative) {
  const base = Number(estimatedNative)
  return { base, max: amountMaxWithTolerance(base) }
}

export function isAmountWithinToleranceNative(actual, estimated) {
  const a = Number(actual)
  if (!Number.isFinite(a) || a <= 0) return false
  return a <= amountMaxWithTolerance(estimated)
}

export function formatNativeAmount(amount, currency) {
  return normalizeCurrency(currency) === CURRENCY_EUR ? formatEur(amount) : formatPen(amount)
}

export function formatAmountWithConversion(row) {
  const c = normalizeCurrency(row?.currency)
  const pen = row?.amount_pen ?? row?.amount_pen_estimated
  const eur = row?.amount_eur ?? row?.amount_eur_estimated
  const primary = formatNativeAmount(c === CURRENCY_EUR ? eur : pen, c)
  const secondary = c === CURRENCY_EUR ? formatPen(pen) : formatEur(eur)
  return `${primary} (≈ ${secondary})`
}

export function currencyAmountLabel(currency) {
  return normalizeCurrency(currency) === CURRENCY_EUR ? 'Montant (€) *' : 'Montant (S/.) *'
}
