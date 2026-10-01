/**
 * Nommage standard des pièces comptables (aligné RELEVES/outils/completer_factures_upload.py).
 *
 * Format : YYYY-MM-DD_AKUU-FAC-YYYY-NNNN_{montant}{devise}_{slug}.pdf
 * Exemple : 2026-09-29_AKUU-FAC-2026-0140_23PEN_rouleau-charles.pdf
 */

export function slugify(text, maxLen = 48) {
  let s = String(text ?? 'piece').trim().toLowerCase()
  s = s.normalize('NFD').replace(/\p{M}/gu, '')
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return (s || 'piece').slice(0, maxLen).replace(/-+$/g, '')
}

export function formatAmountForFilename({ currency = 'EUR', amount_pen, amount_eur }) {
  const cur = String(currency || 'EUR').toUpperCase()
  let val
  if (cur === 'PEN') {
    val = amount_pen ?? amount_eur
    if (amount_pen == null && amount_eur != null) {
      return formatAmountForFilename({ currency: 'EUR', amount_eur })
    }
  } else {
    val = amount_eur ?? amount_pen
  }
  if (val == null || val === '') return { amount: '0', currency: cur }
  const n = Number(val)
  if (!Number.isFinite(n)) return { amount: '0', currency: cur }
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return { amount: String(Math.round(n)), currency: cur }
  }
  return { amount: n.toFixed(2).replace('.', '_'), currency: cur }
}

/**
 * @param {object} opts
 * @param {string} opts.expense_date — YYYY-MM-DD
 * @param {string} opts.reference — AKUU-FAC-YYYY-NNNN
 * @param {string} [opts.currency]
 * @param {number} [opts.amount_pen]
 * @param {number} [opts.amount_eur]
 * @param {string} [opts.vendor_name]
 * @param {string} [opts.label]
 * @param {string} [opts.ext] — .pdf
 */
export function buildStandardFilename(opts) {
  const datePart = String(opts.expense_date ?? '').slice(0, 10) || '0000-00-00'
  const ref = opts.reference || 'AKUU-FAC-0000-0000'
  const { amount, currency } = formatAmountForFilename(opts)
  const slug = slugify(opts.vendor_name || opts.label)
  const ext = (opts.ext ?? '.pdf').startsWith('.')
    ? opts.ext.toLowerCase()
    : `.${String(opts.ext).toLowerCase()}`
  return `${datePart}_${ref}_${amount}${currency}_${slug}${ext}`
}
