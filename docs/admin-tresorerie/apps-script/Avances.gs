/**
 * Suivi des avances à rembourser (étape F).
 * Sources : liste de référence trésorier, journal (prêts/avances), factures avance_benevole.
 */

/** Avances connues hors flux facture (ex. engagement sept. 2026). */
var AVANCES_SUIVI_REF_ = [
  {
    id: 'avance-francois-ludovie-2026',
    year: 2026,
    beneficiary: 'François et Ludovie',
    amount_eur: 508.13,
    project: 'Musée Shapishiko',
    label: 'Remboursement d\'avances AKUU',
    echeance: '2026-12-31',
    source: 'engagement_tresorier',
    notes: 'Classé provisoirement en dépense Musée — à rembourser avant le 31/12/2026.'
  }
];

function normAvanceCat_(cat) {
  return String(cat || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function avanceRembourseeDansJournal_(year, avance) {
  var ss = openYearJournal_(year);
  if (!ss) return false;
  var sh = ss.getSheetByName('Journal');
  if (!sh) return false;
  var target = r2_(avance.amount_eur);
  var needle = String(avance.beneficiary || '').toLowerCase();
  return tabRows_(sh).rows.some(function (r) {
    if (normTxt_(r.entry_type) !== 'depense') return false;
    var eur = num_(r.amount_eur) || 0;
    if (Math.abs(eur - target) >= 0.01) return false;
    var cat = normAvanceCat_(r.category);
    var txt = (String(r.label || '') + ' ' + String(r.vendor_name || '') + ' ' + String(r.notes || '')).toLowerCase();
    if (cat.indexOf('remboursement') >= 0 || cat.indexOf('avance') >= 0) return true;
    return needle && txt.indexOf(needle.split(' ')[0]) >= 0;
  });
}

function avancesFromJournal_(year) {
  var ss = openYearJournal_(year);
  if (!ss) return [];
  var sh = ss.getSheetByName('Journal');
  if (!sh) return [];
  var out = [];
  tabRows_(sh).rows.forEach(function (r) {
    var cat = normAvanceCat_(r.category);
    if (cat.indexOf('pret') < 0 && cat.indexOf('avance') < 0) return;
    if (normTxt_(r.entry_type) !== 'depense') return;
    var eur = num_(r.amount_eur) || 0;
    if (!eur) return;
    out.push({
      id: 'journal-' + String(r.reference),
      year: year,
      beneficiary: String(r.vendor_name || r.label || '—'),
      amount_eur: r2_(eur),
      project: String(r.project || ''),
      label: String(r.label || ''),
      reference: String(r.reference),
      source: 'journal',
      statut: 'a_rembourser',
      echeance: year + '-12-31'
    });
  });
  return out;
}

function avancesFromFactures_(year) {
  return readAll_('Factures').filter(function (f) {
    if (Number(String(f.expense_date || '').substring(0, 4)) !== year) return false;
    if (f.payment_type !== 'avance_benevole' || f.status !== 'validated') return false;
    var s = String(f.reimbursement_status || '').toLowerCase();
    return !s || s === 'to_pay' || s === 'awaiting_validation';
  }).map(function (f) {
    return {
      id: 'facture-' + f.reference,
      year: year,
      beneficiary: String(f.submitter_email || f.paid_by || '—'),
      amount_eur: r2_(num_(f.amount_eur) || 0),
      amount_pen: num_(f.amount_pen) || null,
      project: String(f.project || ''),
      label: String(f.label || ''),
      reference: String(f.reference),
      source: 'facture',
      statut: 'a_rembourser',
      echeance: year + '-12-31'
    };
  });
}

/** Liste consolidée des avances pour une année. */
function getAvancesAnnee_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  var items = [];
  var seen = {};

  AVANCES_SUIVI_REF_.forEach(function (a) {
    if (Number(a.year) !== year) return;
    var remb = avanceRembourseeDansJournal_(year, a);
    items.push({
      id: a.id,
      year: year,
      beneficiary: a.beneficiary,
      amount_eur: r2_(a.amount_eur),
      project: a.project || '',
      label: a.label || '',
      reference: '',
      source: a.source || 'reference',
      statut: remb ? 'rembourse' : 'a_rembourser',
      echeance: a.echeance || year + '-12-31',
      notes: a.notes || ''
    });
    seen[a.id] = true;
  });

  avancesFromJournal_(year).forEach(function (a) {
    if (seen[a.id]) return;
    seen[a.id] = true;
    items.push(a);
  });

  avancesFromFactures_(year).forEach(function (a) {
    if (seen[a.id]) return;
    seen[a.id] = true;
    items.push(a);
  });

  var pending = items.filter(function (i) { return i.statut === 'a_rembourser'; });
  var total = pending.reduce(function (s, i) { return s + (i.amount_eur || 0); }, 0);
  return {
    year: year,
    items: items,
    pending_count: pending.length,
    total_a_rembourser_eur: r2_(total),
    generated_at: new Date().toISOString()
  };
}
