const { ctx, api, app, journal, files, mails, cache } = require('./harnais.cjs')
const R = []; const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const pdf = Buffer.from('%PDF-1.4 test').toString('base64')
const exe = Buffer.from('MZ\x90\x00this is exe').toString('base64')
const html = Buffer.from('<html><script>alert(1)</script>').toString('base64')
// A2 Google désactivé
let r = api('auth/google', { email: 'treso@akuu' })
t('SEC-A2 connexion Google désactivée', !r.ok && r.error?.code === 'DISABLED', r.error?.message)
// login
r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }); const T = r.data?.token
t('login trésorier (mot de passe commun encore valide avant remplacement)', r.ok)
const hash = app.getSheetByName('Users').rows.find(x => x[0] === 'treso@akuu')[1]
t('migration hachage v2 à la connexion', String(hash).startsWith('v2$'), String(hash).slice(0, 12))
r = api('auth/login', { email: 'benevole@akuu', password: 'AKUU-Init-2026!' }); const B = r.data?.token
r = api('auth/login', { email: 'b2@akuu', password: 'AKUU-Init-2026!' }); const B2 = r.data?.token
// E2 énumération
const r1 = api('auth/login', { email: 'inconnu@x.fr', password: 'x' }), r2 = api('auth/login', { email: 'treso@akuu', password: 'mauvais' })
t('SEC-E2 messages identiques', r1.error.message === r2.error.message && r1.error.code === r2.error.code, r1.error.message)
// A4 rate limit
for (let i = 0; i < 6; i++) r = api('auth/login', { email: 'admin@akuu', password: 'faux' + i })
r = api('auth/login', { email: 'admin@akuu', password: 'AKUU-Init-2026!' })
t('SEC-A4 blocage après 5 échecs (même avec le bon mot de passe)', !r.ok && r.error.code === 'TOO_MANY_ATTEMPTS', r.error?.message)
// A1 token dans l'URL ignoré
let out = JSON.parse(ctx.handleRequest('GET', { parameter: { path: 'auth/me', token: T } }).t)
t('SEC-A1 jeton dans l\'URL refusé', !out.ok && out.error.code === 'UNAUTHORIZED')
r = api('auth/me', { _token: T }, 'GET'); t('SEC-A1 jeton dans le corps accepté', r.ok && r.data.email === 'treso@akuu')
// B3/B7 bénévole
t('SEC-B3 bénévole /demandes/pending → 403', !api('demandes/pending', { _token: B }, 'GET').ok)
t('SEC-B7 bénévole /compta → 403', !api('compta', { _token: B }, 'GET').ok)
t('bénévole /journal-annee → 403', !api('journal-annee', { _token: B, year: 2026 }, 'GET').ok)
t('bénévole /archive-file → 403', !api('archive-file', { _token: B, path: '2025/Journal_AKUU_2025.xlsx' }, 'GET').ok)
t('bénévole /corrections/delete → 403', !api('corrections/delete', { _token: B, reference: 'X', year: 2026, reason: 'test' }).ok)
t('bénévole /releves/import → 403', !api('releves/import', { _token: B, date_fin: '31/08/2026', solde_fin: 1 }).ok)
t('SEC-B9 bénévole /access-requests/pending → 403', !api('access-requests/pending', { _token: B }, 'GET').ok)
// demandes
const dem = { project: 'musee', category: 'materiel', amount_pen_estimated: 100, currency: 'PEN', payment_type: 'avance_benevole', description: 'Pinceaux', justification: 'mural' }
r = api('demandes', { _token: B, ...dem, resubmission_of: 'autre-id', version: 9 })
t('création demande bénévole', r.ok, r.error?.message)
const D = r.data
t('SEC-B5 resubmission_of forgé ignoré', D && D.resubmission_of === '' && D.version === 1)
t('projet inconnu refusé', !api('demandes', { _token: B, ...dem, project: '<script>' }).ok)
t('SEC-B4 bénévole approuve sa demande → 403', !api(`demandes/${D.reference}/approve`, { _token: B }).ok)
r = api('demandes', { _token: T, ...dem }); const DT = r.data
t('SEC trésorier ne s\'auto-approuve pas', !api(`demandes/${DT.reference}/approve`, { _token: T }).ok, api(`demandes/${DT.reference}/approve`, { _token: T }).error?.message)
t('SEC-B5 resubmit demande d\'un autre → refus', !api(`demandes/${D.id}/resubmit`, { _token: B2, ...dem }).ok)
r = api(`demandes/${D.reference}/approve`, { _token: T }); t('trésorier approuve la demande du bénévole', r.ok, r.error?.message)
t('refus après approbation → refusé', !api(`demandes/${D.reference}/reject`, { _token: T, reject_reason: 'x' }).ok)
// factures
const fac = { demand_reference: D.reference, project: 'musee', category: 'materiel', payment_type: 'avance_benevole', label: 'Pinceaux', currency: 'PEN', amount_pen: 100, expense_date: '2026-09-30', vendor_name: 'Ferreteria', paid_by: 'benevole@akuu' }
t('SEC-B1 B2 facture sur demande de B → 403', !api('factures', { _token: B2, ...fac }).ok)
t('SEC-C2 exe renommé .pdf refusé', !api('factures', { _token: B, ...fac, _attachments: { receipt: { name: 'f.pdf', type: 'application/pdf', base64: exe } } }).ok)
t('SEC-C2 html refusé', !api('factures', { _token: B, ...fac, _attachments: { receipt: { name: 'f.pdf', base64: html } } }).ok)
const big = Buffer.alloc(11 * 1024 * 1024, 1); big.write('%PDF'); 
r = api('factures', { _token: B, ...fac, _attachments: { receipt: { name: 'big.pdf', base64: big.toString('base64') } } })
t('SEC-C3 > 10 Mo refusé', !r.ok && r.error.code === 'FILE_TOO_LARGE')
r = api('factures', { _token: B, ...fac, _attachments: { receipt: { name: '../../hack.pdf', type: 'application/pdf', base64: pdf } } })
t('facture PDF valide acceptée', r.ok, r.error?.message); const F = r.data
t('SEC-C4 nom de fichier normalisé', F && !/\.\.|\//.test(F.file_name) && /^2026-09-30_AKUU-FAC-2026-0001_100PEN_ferreteria\.pdf$/.test(F.file_name), F?.file_name)
t('SEC-C7 fichier bien sur le Drive', F && F.drive_file_url && files.some(f => f.name === F.file_name && f.path.includes('/2026/Factures')))
t('2e facture même demande → 409', !api('factures', { _token: B, ...fac }).ok)
t('SEC-B2 bénévole valide sa facture → 403', !api(`factures/${F.reference}/validate`, { _token: B }).ok)
r = api(`factures/${F.reference}/validate`, { _token: T }); t('trésorier valide', r.ok, r.error?.message)
const nJ = app.getSheetByName('Journal').rows.length
r = api(`factures/${F.reference}/validate`, { _token: T })
t('SEC-E3 double validation → 409, journal inchangé', !r.ok && app.getSheetByName('Journal').rows.length === nJ, r.error?.message)
t('refus après validation → refusé', !api(`factures/${F.reference}/reject`, { _token: T, reject_reason: 'x' }).ok)
// Corrections : suppression / facture ajoutée
r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2026-0002', year: 2025, reason: 'doublon' })
t('suppression année clôturée refusée', !r.ok, r.error?.message)
r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2026-0002', year: 2026, reason: '' })
t('suppression sans motif refusée', !r.ok)
r = api('corrections/delete', { _token: T, reference: 'AKUU-IMP-2026-0002', year: 2026, reason: 'doublon du 05/03' })
t('suppression 2026 : ligne retirée du journal + trace', r.ok && r.data.status === 'applied' && !journal.getSheetByName('Journal').rows.some(x => x[0] === 'AKUU-IMP-2026-0002')
  && app.getSheetByName('Audit').rows.some(a => a[3] === 'journal_line_deleted_row' && /CB DOUBLON/.test(a[6])))
r = api('corrections/attach', { _token: T, reference: 'AKUU-IMP-2026-0001', year: 2026, expense_date: '2026-03-02', amount_eur: 26.94, currency: 'EUR', vendor_name: 'Amazon', label: 'CB AMAZON', _attachments: { receipt: { name: 'a.pdf', base64: pdf } } })
const row = journal.getSheetByName('Journal').rows.find(x => x[0] === 'AKUU-IMP-2026-0001')
t('facture ajoutée 2026 : nom standard + lien dans le journal', r.ok && row[11] === '2026-03-02_AKUU-IMP-2026-0001_26_94EUR_amazon.pdf' && /drive/.test(row[12]), row && row[11])
r = api('corrections/attach', { _token: T, reference: 'AKUU-IMP-2025-0010', year: 2025, expense_date: '2025-05-02', amount_eur: 12, currency: 'EUR', vendor_name: 'Wix', label: 'CB WIX', _attachments: { receipt: { name: 'w.pdf', base64: pdf } } })
t('facture ajoutée 2025 : rangée dans 2025/Factures, « à reporter » (Excel inchangé)', r.ok && r.data.status === 'pending' && files.some(f => f.path.endsWith('/2025/Factures') && /AKUU-IMP-2025-0010/.test(f.name)))
t('facture ajoutée : exe refusé', !api('corrections/attach', { _token: T, reference: 'AKUU-IMP-2026-0001', year: 2026, _attachments: { receipt: { name: 'x.pdf', base64: exe } } }).ok)
// B6 history
r = api('history', { _token: B2 }, 'GET'); t('SEC-B6 historique filtré', r.ok && r.data.demandes.every(d => d.submitter_email === 'b2@akuu'))
// A3 logout
api('auth/logout', { _token: B2 }); t('SEC-A3 logout invalide la session', !api('auth/me', { _token: B2 }, 'GET').ok)
// révocation
ctx.PropertiesService.getScriptProperties().setProperty('WHITELIST_JSON', JSON.stringify([]))
t('révocation : bénévole retiré de la liste → 401 immédiat', !api('auth/me', { _token: B }, 'GET').ok)
// B10
t('SEC-B10 demande rôle admin refusée', !api('access-requests', { email: 'x@y.fr', first_name: 'A', last_name: 'B', requested_role: 'admin' }).ok)
// E5 erreurs internes masquées
ctx.getDemandesMine_ = () => { throw new TypeError('Cannot read properties of undefined (reading secret path /Users/x)') }
r = api('demandes/mine', { _token: T }, 'GET'); t('SEC-E5 erreur interne masquée', !r.ok && r.error.code === 'INTERNAL_ERROR' && !/Users/.test(r.error.message))
// D3
r = JSON.parse(ctx.handleRequest('POST', { parameter: { path: 'auth/login' }, postData: { type: 'application/json', contents: '{"__proto__":{"polluted":1},"email":"a","password":"b"}' } }).t)
t('SEC-D3 __proto__ ignoré', ({}).polluted === undefined)
// archive path
t('archive-file chemin hors liste → 403', !api('archive-file', { _token: T, path: '../../Users/secret.txt' }, 'GET').ok)
// mot de passe
r = api('auth/password', { _token: T, current_password: 'AKUU-Init-2026!', new_password: 'court' }); t('mot de passe trop court refusé', !r.ok)
r = api('auth/password', { _token: T, current_password: 'AKUU-Init-2026!', new_password: 'UnVraiMotDePasse-2026' }); t('changement de mot de passe', r.ok, r.error?.message)
t('ancien mot de passe refusé ensuite', !api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' }).ok)
t('nouveau mot de passe accepté', api('auth/login', { email: 'treso@akuu', password: 'UnVraiMotDePasse-2026' }).ok)
// remplacement mots de passe communs
ctx.PropertiesService.getScriptProperties().setProperty('WHITELIST_JSON', JSON.stringify([{ email: 'benevole@akuu', role: 'benevole' }, { email: 'b2@akuu', role: 'benevole' }]))
mails.length = 0; ctx.remplacerMotsDePasseCommuns()
t('remplacerMotsDePasseCommuns : comptes à mot de passe commun réinitialisés + email', mails.length >= 2 && !api('auth/login', { email: 'b2@akuu', password: 'AKUU-Init-2026!' }).ok, mails.map(m => m.to).join(','))
t('le compte au mot de passe changé n\'est pas touché', !mails.some(m => m.to === 'treso@akuu'))
mails.length = 0; ctx.rotationSecretEtMotsDePasse()
t('rotation du secret : nouveau mot de passe pour chaque compte', mails.length >= 3 && !api('auth/login', { email: 'treso@akuu', password: 'UnVraiMotDePasse-2026' }).ok, mails.length + ' emails')
const pw = (mails.find(m => m.to === 'treso@akuu')?.b.match(/AKUU : (\S+)/) || [])[1]
t('connexion avec le mot de passe provisoire reçu', !!pw && api('auth/login', { email: 'treso@akuu', password: pw }).ok)
console.log(R.join('\n')); console.log(`\n${R.filter(x => x.startsWith('✅')).length}/${R.length} OK`)
