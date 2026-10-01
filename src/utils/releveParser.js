/**
 * Lecture d'un relevé Crédit Coopératif (PDF) à partir des morceaux de texte positionnés (pdf.js).
 * Renvoie { solde_debut, solde_fin, date_fin, operations: [{ date, label, amount }] }.
 * amount > 0 = crédit (recette), < 0 = débit (dépense).
 */

const AMOUNT_RE = /^([+-])\s?(\d{1,3}(?:[  .]\d{3})*,\d{2})$/
const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/

function toNumber(sign, txt) {
  const n = Number(txt.replace(/[  .]/g, '').replace(',', '.'))
  return sign === '-' ? -n : n
}

/** Regroupe les morceaux en lignes (même y à 2 px près), triées de haut en bas puis de gauche à droite. */
export function toLines(items) {
  const rows = []
  const sorted = [...items].filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x)
  for (const it of sorted) {
    let row = rows.find((r) => Math.abs(r.y - it.y) < 2.5)
    if (!row) { row = { y: it.y, items: [] }; rows.push(row) }
    row.items.push(it)
  }
  return rows.map((r) => {
    r.items.sort((a, b) => a.x - b.x)
    // fusionne les morceaux proches (« + » et « 110,00 », « 1 » et « 341,17 »)
    const cells = []
    for (const it of r.items) {
      const last = cells[cells.length - 1]
      if (last && it.x - last.xEnd < 4) { last.str += (it.x - last.xEnd > 0.8 ? ' ' : '') + it.str; last.xEnd = it.x + it.w }
      else cells.push({ str: it.str, x: it.x, xEnd: it.x + (it.w || 0) })
    }
    return cells.map((c) => ({ ...c, str: c.str.trim() }))
  })
}

export function parseReleve(pages) {
  const out = { solde_debut: null, solde_fin: null, date_debut: null, date_fin: null, operations: [] }
  let current = null
  let inDetail = false
  for (const items of pages) {
    for (const cells of toLines(items)) {
      const text = cells.map((c) => c.str).join(' ')
      const last = cells[cells.length - 1]?.str ?? ''
      const amt = last.match(AMOUNT_RE)
      const solde = text.match(/SOLDE (?:CREDITEUR|DEBITEUR) AU (\d{2}\/\d{2}\/\d{4})/)
      if (solde && amt) {
        const v = toNumber(text.includes('DEBITEUR') ? '-' : amt[1], amt[2])
        if (out.solde_debut === null) { out.solde_debut = v; out.date_debut = solde[1] }
        else { out.solde_fin = v; out.date_fin = solde[1] }
        inDetail = out.solde_fin === null
        current = null
        continue
      }
      if (!inDetail) continue
      const d = cells[0]?.str.match(DATE_RE)
      if (d && amt && cells.length >= 3) {
        // date opération, date valeur, libellé…, montant
        const labelCells = cells.slice(1, -1).filter((c) => !DATE_RE.test(c.str))
        current = {
          date: `${d[3]}-${d[2]}-${d[1]}`,
          label: labelCells.map((c) => c.str).join(' ').replace(/\s+/g, ' ').trim(),
          amount: toNumber(amt[1], amt[2]),
          details: []
        }
        out.operations.push(current)
      } else if (current && !amt && !/^(DATE|D'OPERATION|VALEUR|DETAIL|MONTANT|EN EUR|AKUU|COMPTE COURANT)/.test(text)) {
        if (/Conditions d'arrêté|Page \d|Relevé N°/.test(text)) { current = null; continue }
        current.details.push(text.replace(/\s+/g, ' ').trim())
      }
    }
  }
  out.operations = out.operations.map((o) => ({
    date: o.date,
    amount: Math.round(o.amount * 100) / 100,
    label: [o.label, ...o.details].join(' | ')
  }))
  return out
}

/** Contrôle : solde début + opérations = solde fin (à 1 centime près). */
export function checkReleve(r) {
  if (r.solde_debut === null || r.solde_fin === null) return { ok: false, ecart: null }
  const total = r.operations.reduce((a, o) => a + o.amount, 0)
  const ecart = Math.round((r.solde_debut + total - r.solde_fin) * 100) / 100
  return { ok: Math.abs(ecart) < 0.01, ecart }
}
