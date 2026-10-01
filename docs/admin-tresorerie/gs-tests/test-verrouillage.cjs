// Étape B — exercices clos : refus des modifications, pièces jointes autorisées, protection Sheets.
const h = require('./harnais.cjs')
const { ctx, api, journal, props } = h
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const SSclass = journal.constructor
const pdf = Buffer.from('%PDF-1.4').toString('base64')

function setupJournal(year, statut) {
  const id = 'J' + year
  const ss = new SSclass(id)
  const jh = ss.insertSheet('Journal'); jh.appendRow(ctx.JOURNAL_COLUMNS)
  jh.appendRow(['AKUU-IMP-' + year + '-0001', year + '-03-02', 'CB TEST', '', 'MUSEE', 'Dépenses par carte', 10, '', 'EUR', 'releve', 'depense', '', '', '', '', '', ''])
  const cl = ss.insertSheet('Cloture'); cl.appendRow(['cle', 'valeur'])
  cl.appendRow(['statut', statut])
  cl.appendRow(['version', 1])
  props['JOURNAL_SHEET_' + year] = id
  return ss
}

const cache = {}
const open = ctx.SpreadsheetApp.openById
ctx.SpreadsheetApp.openById = (id) => {
  if (cache[id]) return cache[id]
  if (id === 'J2018') { cache[id] = setupJournal(2018, 'clos'); return cache[id] }
  if (id === 'J2019') { cache[id] = setupJournal(2019, 'rouvert'); return cache[id] }
  return open(id)
}
cache.J2018 = setupJournal(2018, 'clos')
cache.J2019 = setupJournal(2019, 'rouvert')

let r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token

r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2018-0001', year: 2018, reason: 'test clos' })
t('suppression 2018 clos refusée', !r.ok && r.error?.message?.indexOf('réouverture') >= 0, r.error?.message || '')

r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2019-0001', year: 2019, reason: 'exercice rouvert' })
t('suppression 2019 rouvert acceptée', r.ok, r.error?.message || '')

r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2026-0002', year: 2026, reason: 'doublon ouvert' })
t('suppression 2026 ouvert acceptée', r.ok, r.error?.message || '')

r = api('releves/import', { _token: T, date_fin: '31/12/2018', solde_fin: 7413.25, solde_debut: 0, operations: [{ date: '2018-12-01', amount: -5, label: 'TEST', category: 'x', project: 'FONCTIONNEMENT' }] })
t('import relevé 2018 clos refusé', !r.ok && r.error?.message?.indexOf('réouverture') >= 0, r.error?.message || '')

r = api('corrections/attach', { _token: T, reference: 'AKUU-IMP-2018-0001', year: 2018, expense_date: '2018-03-02', amount_eur: 10, currency: 'EUR', vendor_name: 'Test', label: 'CB TEST', _attachments: { receipt: { name: 'f.pdf', base64: pdf } } })
t('pièce jointe 2018 clos acceptée', r.ok, r.error?.message || '')

r = ctx.protectYearJournal_(2018)
t('protection Sheets 2018', r.protected && r.sheets >= 2)
t('onglet Journal protégé', cache.J2018.getSheetByName('Journal').protections.some(p => p.desc.indexOf('2018') >= 0))

r = ctx.unprotectYearJournal_(2018)
t('déprotection 2018', r.unprotected)
t('protections retirées', cache.J2018.getSheetByName('Journal').protections.length === 0)

console.log(R.join('\n')); const ko = R.filter(x => x.startsWith('❌')).length
console.log(`\n${R.length - ko}/${R.length} OK`); process.exit(ko ? 1 : 0)
