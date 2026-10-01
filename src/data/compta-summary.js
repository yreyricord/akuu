/** Agrégats comptables · journal trésorerie */

export function buildComptaSummary(journal, refDate = new Date()) {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()
  let totalPenYtd = 0
  let totalEurYtd = 0
  let totalPenMonth = 0
  let totalEurMonth = 0
  const byProject = {}

  for (const row of journal) {
    const pen = Number(row.amount_pen) || 0
    const eur = Number(row.amount_eur) || 0
    const raw = row.expense_date || row.journal_at
    const d = raw ? new Date(raw) : null

    if (d && !Number.isNaN(d.getTime())) {
      if (d.getFullYear() === year) {
        totalPenYtd += pen
        totalEurYtd += eur
        if (d.getMonth() === month) {
          totalPenMonth += pen
          totalEurMonth += eur
        }
      }
    } else {
      totalPenYtd += pen
      totalEurYtd += eur
    }

    const project = row.project || 'divers'
    if (!byProject[project]) {
      byProject[project] = { project, amount_pen: 0, amount_eur: 0, count: 0 }
    }
    byProject[project].amount_pen += pen
    byProject[project].amount_eur += eur
    byProject[project].count += 1
  }

  const round2 = (n) => Math.round(n * 100) / 100

  return {
    year,
    month: month + 1,
    total_pen_ytd: round2(totalPenYtd),
    total_eur_ytd: round2(totalEurYtd),
    total_pen_month: round2(totalPenMonth),
    total_eur_month: round2(totalEurMonth),
    entry_count: journal.length,
    by_project: Object.values(byProject).sort((a, b) => b.amount_pen - a.amount_pen)
  }
}

export function filterJournal(journal, { project = '', month = '', year = '' } = {}) {
  return journal.filter((row) => {
    if (project && row.project !== project) return false
    const raw = row.expense_date || row.journal_at
    if (!raw) return !month && !year
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return !month && !year
    if (year && String(d.getFullYear()) !== String(year)) return false
    if (month && String(d.getMonth() + 1) !== String(month)) return false
    return true
  })
}
