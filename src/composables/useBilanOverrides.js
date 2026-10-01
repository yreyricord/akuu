import { ref } from 'vue'

const STORAGE_KEY = 'akuu_bilan_overrides_v1'

/** Incrémenté à chaque override — réactivité cross-composants. */
export const overridesVersion = ref(0)

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getOverride(year, reference) {
  const y = String(year)
  return readAll()[y]?.[reference] ?? null
}

export function setOverride(year, reference, fields) {
  const data = readAll()
  const y = String(year)
  if (!data[y]) data[y] = {}
  if (!fields || !fields.action) {
    delete data[y][reference]
    if (!Object.keys(data[y]).length) delete data[y]
  } else {
    data[y][reference] = { ...fields, updated_at: new Date().toISOString() }
  }
  writeAll(data)
  overridesVersion.value += 1
}

export function listOverrides(year) {
  const y = String(year)
  return readAll()[y] ?? {}
}

export function exportOverridesCsv(years = []) {
  const data = readAll()
  const header = [
    'year', 'reference', 'action', 'piece_filename', 'drive_file_url', 'notes',
    'expense_date', 'label', 'amount_eur', 'amount_pen', 'category', 'project'
  ]
  const rows = [header]
  for (const year of years) {
    const y = String(year)
    const bucket = data[y] || {}
    for (const [reference, o] of Object.entries(bucket)) {
      rows.push([
        y,
        reference,
        o.action || '',
        o.piece_filename || '',
        o.drive_file_url || '',
        o.notes || '',
        o.expense_date || '',
        o.label || '',
        o.amount_eur ?? '',
        o.amount_pen ?? '',
        o.category || '',
        o.project || ''
      ])
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n')
}

/** Cellule CSV sûre : neutralise les formules (=, +, -, @, tabulation) à l'ouverture dans Excel. */
function csvCell(c) {
  let v = String(c ?? '')
  if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+([.,]\d+)?$/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

export function resolvedStatus(line, override) {
  if (line.has_piece) return 'ok'
  if (override?.action === 'link' && override.drive_file_url) return 'ok'
  if (override?.action === 'releve_suffit') return 'ok'
  // Frais bancaires, WU, DAB… : relevé suffit sans clic supplémentaire
  if (!line.expects_invoice) return 'ok'
  return 'pending'
}
