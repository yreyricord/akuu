// Route /exercices : lecture live depuis Google Sheets, cache, contrôle des totaux.
const h = require('./harnais.cjs')
const { ctx, api, journal, props } = h
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const SSclass = journal.constructor

const j2018 = new SSclass('J2018')
const jh = j2018.insertSheet('Journal'); jh.appendRow(ctx.JOURNAL_COLUMNS)
jh.appendRow(['AKUU-IMP-2018-0001', '2018-01-24', 'Subvention', '', 'FONCTIONNEMENT', 'Subventions et prix', 14681.30, '', 'EUR', 'import', 'recette', '', '', '', '', 'non', ''])
jh.appendRow(['AKUU-IMP-2018-0002', '2018-01-04', 'Weglot', '', 'FONCTIONNEMENT', 'Abonnements et numérique', 9534.83, '', 'EUR', 'import', 'depense', '', '', '', '', 'non', ''])
const cl = j2018.insertSheet('Cloture'); cl.appendRow(['cle', 'valeur'])
cl.appendRow(['statut', 'clos'])
cl.appendRow(['solde_ouverture', 2266.78])
cl.appendRow(['solde_cloture', 7413.25])
const rel = j2018.insertSheet('Releves'); rel.appendRow(['mois', 'date_fin', 'solde_debut', 'solde_fin', 'fichier', 'url'])
rel.appendRow(['2018-12', '2018-12-31', 6824.55, 7413.25, '2018_12_RELEVE_PRO_AKUU.pdf', 'https://drive/r'])

props.JOURNAL_SHEET_2018 = 'J2018'
const open = ctx.SpreadsheetApp.openById
ctx.SpreadsheetApp.openById = (id) => (id === 'J2018' ? j2018 : open(id))

let r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token
r = api('auth/login', { email: 'benevole@akuu', password: 'AKUU-Init-2026!' }); const B = r.data?.token

t('bénévole refusé sur /exercices', !api('exercices', { _token: B }, 'GET').ok)

r = api('exercices', { _token: T }, 'GET')
t('trésorier : /exercices OK', r.ok, r.error?.message || '')
const y2018 = (r.data?.years || []).find((x) => x.year === 2018)
t('2018 présent', Boolean(y2018))
t('totaux 2018 = contrôle', y2018?.produits_eur === 14681.30 && y2018?.charges_eur === 9534.83 && y2018?.resultat_eur === 5146.47,
  JSON.stringify([y2018?.produits_eur, y2018?.charges_eur, y2018?.resultat_eur]))
t('banque 31/12 2018', y2018?.tresorerie?.solde_releve_eur === 7413.25)
t('écart rapprochement nul', y2018?.tresorerie?.ecart_rapprochement_eur === 0)
t('statut clos', y2018?.statut === 'clos')
t('releves_status calculé', y2018?.releves_status?.year === 2018)

r = api('exercices/2018', { _token: T }, 'GET')
t('/exercices/2018 détail', r.ok && r.data?.year === 2018 && r.data?.produits_eur === 14681.30)

r = api('exercices/2018/controle', { _token: B }, 'GET')
t('controle réservé admin', !r.ok)

r = api('auth/login', { email: 'admin@akuu', password: 'AKUU-Init-2026!' }); const A = r.data?.token
r = api('exercices/2018/controle', { _token: A }, 'GET')
t('controle admin : 2018 OK dans le jeu de test', r.data?.rows?.some((x) => x.year === 2018 && x.ok))

ctx.invalidateExercicesCache_()
r = api('exercices', { _token: T }, 'GET')
t('cache invalidé puis recalcul', r.ok && r.data?.years?.some((x) => x.year === 2018))

console.log(R.join('\n')); const ko = R.filter((x) => x.startsWith('❌')).length
console.log(`\n${R.length - ko}/${R.length} OK`); process.exit(ko ? 1 : 0)
