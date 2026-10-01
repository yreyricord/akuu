// Étape C — réouverture / reclôture admin.
const h = require('./harnais.cjs')
const { ctx, api, props } = h
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const SSclass = h.journal.constructor

function mkYear(year, statut) {
  const id = 'J' + year
  const ss = new SSclass(id)
  const jh = ss.insertSheet('Journal'); jh.appendRow(ctx.JOURNAL_COLUMNS)
  jh.appendRow(['AKUU-IMP-' + year + '-0001', year + '-01-04', 'Test', '', 'MUSEE', 'Dépenses par carte', 10, '', 'EUR', 'releve', 'depense', '', '', '', '', '', ''])
  const cl = ss.insertSheet('Cloture'); cl.appendRow(['cle', 'valeur'])
  cl.appendRow(['statut', statut])
  cl.appendRow(['version', 1])
  cl.appendRow(['solde_ouverture', 2266.78])
  cl.appendRow(['solde_cloture', 2256.78]) // cohérent avec la dépense de 10 €
  const rel = ss.insertSheet('Releves'); rel.appendRow(['mois', 'date_fin', 'solde_debut', 'solde_fin', 'fichier', 'url'])
  rel.appendRow([year + '-12', year + '-12-31', 2266.78, 2256.78, year + '_12_RELEVE_PRO_AKUU.pdf', ''])
  props['JOURNAL_SHEET_' + year] = id
  ctx.getYearFolder_(year).createFolder('Cloture')
  return ss
}

const cache = {}
const open = ctx.SpreadsheetApp.openById
ctx.SpreadsheetApp.openById = (id) => cache[id] || open(id)

let r = api('auth/login', { email: 'admin@akuu', password: 'AKUU-Init-2026!' }); const A = r.data?.token
r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token

cache.J2018 = mkYear(2018, 'clos')
ctx.invalidateExercicesCache_()

t('trésorier refusé rouvrir', !api('exercice/rouvrir', { _token: T, year: 2018, motif: 'motif trop court' }).ok)
t('motif court refusé', !api('exercice/rouvrir', { _token: A, year: 2018, motif: 'court' }).ok)

r = api('exercice/rouvrir', { _token: A, year: 2018, motif: 'Correction écriture oubliée avant AG' })
t('admin rouvre 2018', r.ok && r.data?.statut === 'rouvert' && r.data?.version === 2, JSON.stringify(r.data?.statut))

t('double réouverture refusée', !api('exercice/rouvrir', { _token: A, year: 2018, motif: 'deuxième tentative interdite' }).ok)

// Reclôture sans suppression (sinon écart de rapprochement)
r = api('exercice/recloturer', { _token: A, year: 2018 })
t('reclôture 2018 OK', r.ok && r.data?.ok, JSON.stringify(r.data?.problems || r.data))
ctx.invalidateExercicesCache_()
t('statut clos après reclôture', api('exercices/2018', { _token: T }, 'GET').data?.statut === 'clos')

// Suppression sur exercice rouvert (2019)
cache.J2019 = mkYear(2019, 'clos')
ctx.invalidateExercicesCache_()
api('exercice/rouvrir', { _token: A, year: 2019, motif: 'Test suppression sur exercice rouvert' })
r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2019-0001', year: 2019, reason: 'doublon test' })
t('suppression autorisée après réouverture', r.ok, r.error?.message || '')

r = api('exercices/2019/historique', { _token: T }, 'GET')
t('historique non vide', Array.isArray(r.data) && r.data.length >= 1)

console.log(R.join('\n')); const ko = R.filter(x => x.startsWith('❌')).length
console.log(`\n${R.length - ko}/${R.length} OK`); process.exit(ko ? 1 : 0)
