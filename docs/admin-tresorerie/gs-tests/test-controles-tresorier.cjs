/** Étape F — contrôles trésorier : auto-validation, avances, caisse Pérou */
const { ctx, api, journal } = require('./harnais.cjs')
const R = []
const t = (id, ok, info = '') => R.push(`${ok ? '✅' : '❌'} ${id} ${info}`)
const pdf = Buffer.from('%PDF-1.4 test').toString('base64')
const devis2 = {
  devis: [
    { name: 'devis-a.pdf', type: 'application/pdf', base64: pdf },
    { name: 'devis-b.pdf', type: 'application/pdf', base64: pdf }
  ]
}

let r = api('auth/login', { email: 'treso@akuu', password: 'AKUU-Init-2026!' })
const T = r.data?.token
r = api('auth/login', { email: 'admin@akuu', password: 'AKUU-Init-2026!' })
const A = r.data?.token

// Demande trésorier avec devis (> 300 PEN)
const dem = {
  project: 'musee',
  category: 'materiel',
  amount_pen_estimated: 500,
  currency: 'PEN',
  payment_type: 'avance_benevole',
  description: 'Matériel musée',
  justification: 'Devis fournisseurs',
  _attachments: devis2
}
r = api('demandes', { _token: T, ...dem })
t('CTRL-F1 demande trésorier avec devis créée', r.ok, r.error?.message)
const DT = r.data

r = api(`demandes/${DT.reference}/validate-devis`, { _token: T })
t('CTRL-F1 trésorier ne valide pas ses propres devis', !r.ok && r.error?.code === 'FORBIDDEN', r.error?.message)

r = api(`demandes/${DT.reference}/validate-devis`, { _token: A })
t('CTRL-F1 admin valide les devis du trésorier', r.ok, r.error?.message)

r = api(`demandes/${DT.reference}/approve`, { _token: T })
t('CTRL-F1 trésorier ne s\'auto-approuve pas', !r.ok && r.error?.code === 'FORBIDDEN', r.error?.message)

r = api(`demandes/${DT.reference}/approve`, { _token: A })
t('CTRL-F1 admin approuve la demande trésorier', r.ok, r.error?.message)

const fac = {
  demand_reference: DT.reference,
  project: 'musee',
  category: 'materiel',
  payment_type: 'avance_benevole',
  label: 'Matériel musée',
  currency: 'PEN',
  amount_pen: 500,
  expense_date: '2026-10-01',
  vendor_name: 'Ferreteria',
  paid_by: 'treso@akuu',
  _attachments: { receipt: { name: 'f.pdf', type: 'application/pdf', base64: pdf } }
}
r = api('factures', { _token: T, ...fac })
t('CTRL-F1 facture trésorier sur sa demande', r.ok, r.error?.message)
const FT = r.data

r = api(`factures/${FT.reference}/validate`, { _token: T })
t('CTRL-F1 trésorier ne valide pas sa propre facture', !r.ok && r.error?.code === 'FORBIDDEN', r.error?.message)

r = api(`factures/${FT.reference}/validate`, { _token: A })
t('CTRL-F1 admin valide la facture trésorier (audit)', r.ok, r.error?.message)
const auditSelf = ctx.readAll_('Audit').some((a) => a.action === 'self_decision_admin' || a.action === 'facture_validated')
t('CTRL-F1 trace audit validation admin', auditSelf)

// Admin auto-valide sa propre demande (phase test)
const demAdmin = {
  project: 'divers',
  category: 'materiel',
  amount_pen_estimated: 100,
  currency: 'PEN',
  payment_type: 'avance_benevole',
  description: 'Test admin self',
  justification: 'Phase test'
}
r = api('demandes', { _token: A, ...demAdmin })
t('CTRL-F1 admin crée sa demande', r.ok, r.error?.message)
const DA = r.data
r = api(`demandes/${DA.reference}/approve`, { _token: A })
t('CTRL-F1 admin s\'auto-approuve (phase test)', r.ok, r.error?.message)
const auditAdminSelf = ctx.readAll_('Audit').some((a) => a.action === 'self_decision_admin' && String(a.payload_json || '').indexOf('approuver') >= 0)
t('CTRL-F1 audit self_decision_admin sur auto-approbation', auditAdminSelf)

// Avances API
r = api('avances', { _token: T, year: 2026 }, 'GET')
t('CTRL-F2 GET /avances 2026', r.ok && r.data.year === 2026, r.error?.message)
const fl = (r.data?.items || []).find((i) => i.id === 'avance-francois-ludovie-2026')
t('CTRL-F2 avance François/Ludovie 508,13 €', fl && fl.amount_eur === 508.13 && fl.statut === 'a_rembourser', fl ? `${fl.amount_eur} ${fl.statut}` : 'absent')
t('CTRL-F2 total à rembourser inclut 508,13', r.data?.total_a_rembourser_eur >= 508.13)

r = api('auth/login', { email: 'benevole@akuu', password: 'AKUU-Init-2026!' })
const B = r.data?.token
t('CTRL-F2 bénévole /avances → 403', !api('avances', { _token: B, year: 2026 }, 'GET').ok)

// Caisse Pérou — données journal
journal.getSheetByName('Journal').appendRow([
  'AKUU-IMP-2026-WU1', '2026-06-15', 'Western Union retrait', '', 'FONCTIONNEMENT', 'Transferts et retraits terrain',
  200, '', 'EUR', 'releve', 'depense', '', '', '', '', '', ''
])
const PM_CASH = 'PM-TEST-CASH-2026'
const PM_CAT = 'PM-TEST-CAT-2026'
journal.getSheetByName('Detail_PM').appendRow([
  PM_CASH, '2026-06-20', 'Transport Chazuta', '', 'MUSEE', 'Dépenses terrain PM', '', 150, 'PEN', 'import', 'depense',
  '', '', '', '', '', 'Import Detail PM · mode terrain espèces/WU · hors total journal banque.', 'especes'
])
journal.getSheetByName('Detail_PM').appendRow([
  PM_CAT, '2026-06-21', 'Achat carte test', '', 'MUSEE', 'Dépenses terrain PM', 108.52, 450, 'PEN', 'import', 'depense',
  '', '', '', '', '', 'Import catalogue factures · saisie manuelle validée.', 'cb'
])
const PM_UNCLASS = 'PM-TEST-UNCLASS-2026'
journal.getSheetByName('Detail_PM').appendRow([
  PM_UNCLASS, '2026-06-22', 'Ligne sans mode paiement', '', 'MUSEE', 'Dépenses terrain PM', '', 999, 'PEN', 'import', 'depense',
  '', '', '', '', '', 'Import Detail PM sans colonne payment_method.', ''
])

r = api('caisse-perou', { _token: T, year: 2026 }, 'GET')
t('CTRL-F3 GET /caisse-perou 2026', r.ok && r.data.live, r.error?.message)
t('CTRL-F3 retraits EUR agrégés', r.data?.retraits_eur >= 200, String(r.data?.retraits_eur))
t('CTRL-F3 paiements espèces inclut ligne cash test', (r.data?.especes || []).some((x) => x.reference === PM_CASH), (r.data?.especes || []).map((x) => x.reference).join(','))
t('CTRL-F3 exclut catalogue hors caisse', !(r.data?.especes || []).some((x) => x.reference === PM_CAT), String(r.data?.especes_count))
t('CTRL-F3 exclut lignes sans mode paiement', !(r.data?.especes || []).some((x) => x.reference === PM_UNCLASS))
t('CTRL-F3 compte non classées', (r.data?.non_classes_count ?? 0) >= 1)
t('CTRL-F3 liste depenses terrain', (r.data?.depenses_terrain_count ?? 0) >= 2)
t('CTRL-F3 solde caisse PEN calculé', r.data?.caisse_pen_solde != null, String(r.data?.caisse_pen_solde))
t('CTRL-F3 listes retraits + espèces', Array.isArray(r.data?.retraits) && Array.isArray(r.data?.especes))
t('CTRL-F3 conversion retraits EUR→PEN', r.data?.caisse_pen_entrees > 0, String(r.data?.caisse_pen_entrees))

// Modification mode de paiement → hors caisse
r = api('corrections/update', { _token: T, reference: PM_CASH, year: 2026, payment_method: 'cb' })
t('CTRL-F4 update paiement cb', r.ok, r.error?.message)
r = api('caisse-perou', { _token: T, year: 2026 }, 'GET')
t('CTRL-F4 espèces après reclass cb', !(r.data?.especes || []).some((x) => x.reference === PM_CASH), String(r.data?.especes_count))
r = api('corrections/update', { _token: T, reference: PM_CASH, year: 2026, payment_method: 'especes' })
t('CTRL-F4 update paiement especes', r.ok, r.error?.message)
r = api('caisse-perou', { _token: T, year: 2026 }, 'GET')
t('CTRL-F4 espèces après reclass especes', (r.data?.especes || []).some((x) => x.reference === PM_CASH), String(r.data?.especes_count))

console.log(R.join('\n'))
console.log(`\n${R.filter((x) => x.startsWith('✅')).length}/${R.length} OK`)
