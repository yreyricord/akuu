// Étape D — génération dossier Cloture depuis le journal Google.
const h = require('./harnais.cjs')
const { ctx, api, props, files } = h
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const SSclass = h.journal.constructor

function mk2017() {
  const ss = new SSclass('J2017')
  const jh = ss.insertSheet('Journal'); jh.appendRow(ctx.JOURNAL_COLUMNS)
  jh.appendRow(['AKUU-IMP-2017-0001', '2017-06-01', 'Subvention', '', 'FONCTIONNEMENT', 'Subventions et prix', 8722.46, '', 'EUR', 'import', 'recette', '', '', '', '', 'non', ''])
  jh.appendRow(['AKUU-IMP-2017-0002', '2017-06-02', 'Dépense', '', 'MUSEE', 'Dépenses par carte', 6455.68, '', 'EUR', 'import', 'depense', '', '', '', '', 'non', ''])
  const cl = ss.insertSheet('Cloture'); cl.appendRow(['cle', 'valeur'])
  cl.appendRow(['statut', 'clos'])
  cl.appendRow(['version', 1])
  cl.appendRow(['solde_ouverture', 0])
  cl.appendRow(['solde_cloture', 2266.78])
  const rel = ss.insertSheet('Releves'); rel.appendRow(['mois', 'date_fin', 'solde_debut', 'solde_fin', 'fichier', 'url'])
  rel.appendRow(['2017-12', '2017-12-29', 0, 2266.78, '2017_12_RELEVE_PRO_AKUU.pdf', 'https://drive/r'])
  props.JOURNAL_SHEET_2017 = 'J2017'
  ctx.getYearFolder_(2017).createFolder('Cloture')
  return ss
}

const cache = {}
const open = ctx.SpreadsheetApp.openById
ctx.SpreadsheetApp.openById = (id) => cache[id] || open(id)
cache.J2017 = mk2017()
ctx.invalidateExercicesCache_()

let r = api('finances-publiques', {}, 'GET')
t('finances-publiques sans auth', r.ok && Array.isArray(r.data?.years), String(r.data?.years?.length))

r = api('auth/login', { email: 'benevole@akuu', password: 'AKUU-Init-2026!' }); const B = r.data?.token
t('bénévole refusé regenerer', !api('exercice/regenerer', { _token: B, year: 2017 }).ok)

r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token

const norm = ctx.normalizeSheetRows_([['titre seul'], ['col1', 'col2']])
t('normalizeSheetRows largeur homogène', norm[0].length === 2 && norm[0][1] === '' && norm[1].length === 2)

const ex = ctx.buildExercicePayload_(2017, cache.J2017)
const verif = ctx.verifierGenerationCloture_(2017, ex)
t('contrôle 2017 OK (totaux référence)', verif.ok, JSON.stringify(verif.problems))

const bad = Object.assign({}, ex, { produits_eur: 1 })
t('contrôle détecte écart produits', !ctx.verifierGenerationCloture_(2017, bad).ok)

r = api('exercice/regenerer', { _token: T, year: 2017, force: true })
t('génération 2017 OK', r.ok && r.data?.ok, r.error?.message || '')
t('fichiers créés', (r.data?.files || []).length >= 8, JSON.stringify(r.data?.files))
t('summary produits = contrôle', r.data?.summary?.compte_resultat?.produits_eur === 8722.46)
t('cloture JSON produit', files.some((f) => f.path === 'ROOT/2017/Cloture' && f.name === 'cloture_2017.json'))
t('pack ZIP produit', files.some((f) => f.name === 'Pack_Cloture_2017.zip'))

console.log(R.join('\n')); const ko = R.filter((x) => x.startsWith('❌')).length
console.log(`\n${R.length - ko}/${R.length} OK`); process.exit(ko ? 1 : 0)
