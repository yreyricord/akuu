// Bascule d'un exercice clos vers Google Sheets : contrôles d'entrée, version AG conservée, totaux recalculés.
const h = require('./harnais.cjs')
const { ctx, api, files, props } = h
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const SSclass = h.journal.constructor
const created = {}
ctx.MimeType.GOOGLE_SHEETS = 'gsheet'
ctx.Drive = { Files: { create: (meta) => { const id = 'NEW' + Object.keys(created).length; const ss = new SSclass(id)
  const j = ss.insertSheet('Journal'); j.appendRow(ctx.JOURNAL_COLUMNS)
  j.appendRow(['AKUU-IMP-2018-0001', '2018-01-24', 'Subvention', '', 'FONCTIONNEMENT', 'Subventions et prix', 600, '', 'EUR', 'import', 'recette', '', '', '', '', 'non', ''])
  j.appendRow(['AKUU-IMP-2018-0002', '2018-01-04', 'Weglot', '', 'FONCTIONNEMENT', 'Abonnements et numérique', 228, '', 'EUR', 'import', 'depense', '', '', '', '', 'non', ''])
  created[id] = ss; return { id } } } }
const open = ctx.SpreadsheetApp.openById
ctx.SpreadsheetApp.openById = (id) => created[id] || open(id)
const pk = Buffer.from('PK\x03\x04 xlsx').toString('base64')
const pdf = Buffer.from('%PDF-1.4').toString('base64')
let r = api('auth/login', { email: 'admin@akuu', password: 'AKUU-Init-2026!' }); const A = r.data?.token
r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token
r = api('auth/login', { email: 'benevole@akuu', password: 'AKUU-Init-2026!' }); const B = r.data?.token
const body = (extra = {}) => ({ _token: A, year: 2018, journal: { name: 'Journal_AKUU_2018.xlsx', base64: pk },
  files: [{ name: '06_Synthese_AG.pdf', base64: pdf }, { name: 'Registre_Depenses_2018.xlsx', base64: pk }],
  releves: [{ mois: '2018-12', date_fin: '2018-12-31', solde_debut: 6824.55, solde_fin: 7413.25, fichier: '2018_12_RELEVE_PRO_AKUU.pdf' }], ...extra })
t('trésorier refusé', !api('bascule', { ...body(), _token: T }).ok)
t('bénévole refusé', !api('bascule', { ...body(), _token: B }).ok)
t('année en cours refusée', api('bascule', body({ year: new Date().getFullYear(), journal: { name: `Journal_AKUU_${new Date().getFullYear()}.xlsx`, base64: pk } })).error?.code === 'VALIDATION_FAILED')
t('fichier non prévu refusé', api('bascule', body({ files: [{ name: '../../evil.gs', base64: pdf }] })).error?.code === 'INVALID_FILE')
t('PDF déguisé refusé', api('bascule', body({ files: [{ name: '06_Synthese_AG.pdf', base64: pk }] })).error?.code === 'INVALID_FILE_TYPE')
t('rien écrit après un refus', files.length === 0, `${files.length} fichier(s)`)
files.push({ path: 'ROOT/2018', name: 'Journal_AKUU_2018.xlsx', id: 'OLD' })
r = api('bascule', body())
t('bascule 2018 acceptée', r.ok, r.error?.message || '')
t('totaux recalculés depuis le Sheet', r.data?.produits_eur === 600 && r.data?.charges_eur === 228, JSON.stringify([r.data?.produits_eur, r.data?.charges_eur]))
t('version AG conservée (renommée, pas supprimée)', files.some(f => f.name === 'Journal_AKUU_2018_version_AG_v1.xlsx' && !f.t))
t('journal corrigé rangé', files.some(f => f.name === 'Journal_AKUU_2018.xlsx' && !f.t && f.path === 'ROOT/2018'))
t('registre à la racine de l\'année, synthèse dans Cloture', files.some(f => f.name === 'Registre_Depenses_2018.xlsx' && f.path === 'ROOT/2018') && files.some(f => f.name === '06_Synthese_AG.pdf' && f.path === 'ROOT/2018/Cloture'))
t('propriété JOURNAL_SHEET_2018 posée', props.JOURNAL_SHEET_2018 === 'NEW0')
const ss = created.NEW0
t('onglet Cloture : clos, version 1', ss.getSheetByName('Cloture')?.rows.some(x => x[0] === 'statut' && x[1] === 'clos'))
t('onglet Releves rempli', ss.getSheetByName('Releves')?.rows.length === 2)
r = api('bascule', body()); const second = props.JOURNAL_SHEET_2018
t('relancer remplace le Sheet', r.ok && second === 'NEW1')
t('la version AG n\'est pas écrasée au 2e passage', files.filter(f => f.name === 'Journal_AKUU_2018_version_AG_v1.xlsx' && !f.t).length === 1)
console.log(R.join('\n')); const ko = R.filter(x => x.startsWith('❌')).length
console.log(`\n${R.length - ko}/${R.length} OK`); process.exit(ko ? 1 : 0)
