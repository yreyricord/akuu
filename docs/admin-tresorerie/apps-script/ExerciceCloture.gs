/**
 * Réouverture et reclôture d'exercices (admin uniquement).
 */

var HISTORIQUE_HEADERS_ = ['date', 'auteur', 'action', 'reference', 'avant', 'apres', 'motif'];

function appendHistoriqueJournal_(ss, actor, action, reference, avant, apres, motif) {
  var sh = ss.getSheetByName('Historique') || ss.insertSheet('Historique');
  if (sh.getLastRow() === 0) sh.appendRow(HISTORIQUE_HEADERS_);
  sh.appendRow([
    new Date().toISOString(), actor, action, reference,
    typeof avant === 'string' ? avant : JSON.stringify(avant || {}),
    typeof apres === 'string' ? apres : JSON.stringify(apres || {}),
    motif || ''
  ]);
}

function listHistoriqueExercice_(session, year) {
  requireTreasurer_(session);
  year = Number(year);
  var ss = openYearJournal_(year);
  if (!ss) return [];
  var sh = ss.getSheetByName('Historique');
  if (!sh || sh.getLastRow() < 2) return [];
  return tabRowsAny_(sh).map(function (r) {
    return {
      date: String(r.date || ''), auteur: String(r.auteur || ''), action: String(r.action || ''),
      reference: String(r.reference || ''), avant: String(r.avant || ''), apres: String(r.apres || ''), motif: String(r.motif || '')
    };
  }).reverse();
}

function collectReclotureProblems_(year, ss) {
  var problems = [];
  var map = clotureMap_(ss);
  var statut = exerciceStatut_(map, year);
  if (statut !== 'rouvert' && statut !== 'ouvert') {
    problems.push('L\'exercice n\'est ni ouvert ni rouvert (statut : ' + statut + ').');
    return problems;
  }
  var ex = buildExercicePayload_(year, ss);
  var ecart = ex.tresorerie.ecart_rapprochement_eur || 0;
  if (Math.abs(ecart) >= 0.01 && !clotureStr_(map, 'ecart_explication')) {
    problems.push('Écart de rapprochement de ' + r2_(ecart) + ' € : saisissez une explication (Cloture · ecart_explication) ou corrigez le journal.');
  }
  if (year > EXERCICES_FIRST_YEAR_) {
    var prevEx = readExercice_(year - 1);
    var expectedOpen = prevEx.live
      ? (prevEx.tresorerie.solde_releve_eur != null ? prevEx.tresorerie.solde_releve_eur : prevEx.tresorerie.solde_calcule_eur)
      : (CONTROLE_EXERCICES_[year - 1] || {}).solde_cloture;
    var ouv = ex.tresorerie.solde_ouverture_eur;
    if (expectedOpen != null && Math.abs(ouv - expectedOpen) >= 0.01) {
      problems.push('Solde d\'ouverture ' + r2_(ouv) + ' € ≠ clôture ' + (year - 1) + ' (' + r2_(expectedOpen) + ' €).');
    }
  }
  JOURNAL_TABS.forEach(function (tab) {
    var sh = journalTabSheet_(ss, tab);
    if (!sh) return;
    tabRows_(sh).rows.forEach(function (r) {
      var type = String(r.entry_type || '').toLowerCase();
      if (type !== 'recette' && type !== 'depense') return;
      if (String(r.category) === 'Facture cataloguée') return;
      if (!String(r.project || '').trim() || !String(r.category || '').trim()) {
        problems.push('Écriture ' + r.reference + ' : projet ou catégorie manquant.');
      }
    });
  });
  return problems;
}

/** Archive le dossier Drive Cloture/ vers Cloture_v<N>/ (jamais supprimé). */
function archiveClotureFolder_(year, version) {
  var yearFolder = getYearFolder_(year);
  var it = yearFolder.getFoldersByName('Cloture');
  if (!it.hasNext()) return { archived: false, reason: 'no_folder' };
  var folder = it.next();
  var archiveName = 'Cloture_v' + version;
  var existing = yearFolder.getFoldersByName(archiveName);
  if (existing.hasNext()) archiveName = archiveName + '_' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyyMMdd_HHmm');
  folder.setName(archiveName);
  getOrCreateChild_(yearFolder, 'Cloture');
  return { archived: true, name: archiveName };
}

function rouvrirExercice_(session, body) {
  requireAdmin_(session);
  var year = Number(body.year);
  var motif = String(body.motif || '').trim();
  if (!year || year < EXERCICES_FIRST_YEAR_ || year > new Date().getFullYear()) {
    throw apiError_('VALIDATION_FAILED', 'Année invalide');
  }
  if (motif.length < 10) throw apiError_('VALIDATION_FAILED', 'Motif obligatoire (10 caractères minimum)');
  var ss = openYearJournal_(year);
  if (!ss) throw apiError_('NOT_FOUND', 'Pas de journal Google pour ' + year, 404);
  var map = clotureMap_(ss);
  if (exerciceStatut_(map, year) !== 'clos') {
    throw apiError_('VALIDATION_FAILED', 'Seul un exercice clos peut être rouvert.');
  }
  var version = Number(clotureStr_(map, 'version') || 1) + 1;
  unprotectYearJournal_(year);
  setClotureKeyForce_(ss, 'statut', 'rouvert');
  setClotureKeyForce_(ss, 'version', version);
  setClotureKeyForce_(ss, 'rouvert_le', new Date().toISOString());
  setClotureKeyForce_(ss, 'rouvert_par', session.email);
  setClotureKeyForce_(ss, 'rouvert_motif', motif);
  correctionsSheet_();
  appendRow_('Corrections', {
    id: uuid_(), created_at: new Date().toISOString(), actor_email: session.email, type: 'rouvert',
    reference: '', year: year, reason: motif, drive_file_id: '', drive_file_url: '', file_name: '',
    status: 'applied', applied_at: new Date().toISOString()
  });
  appendHistoriqueJournal_(ss, session.email, 'rouverture', '', {}, { version: version, motif: motif }, motif);
  appendAudit_(session.email, 'exercice_rouvert', 'journal', String(year), { version: version, motif: motif });
  // Purge ciblée : sans elle, le snapshot persistant et le cache journal (7 j pour un exercice clos)
  // continueraient de servir l'exercice comme « clos » après la réouverture.
  invalidateExercicesCache_(year);
  if (typeof invalidateJournalCaches_ === 'function') invalidateJournalCaches_(ss);
  return readExercice_(year);
}

function recloturerExercice_(session, body) {
  requireAdmin_(session);
  body = body || {};
  var year = Number(body.year);
  if (!year || year < EXERCICES_FIRST_YEAR_ || year > new Date().getFullYear()) {
    throw apiError_('VALIDATION_FAILED', 'Année invalide');
  }
  var ss = openYearJournal_(year);
  if (!ss) throw apiError_('NOT_FOUND', 'Pas de journal Google pour ' + year, 404);
  var problems = collectReclotureProblems_(year, ss);
  if (problems.length) {
    return { ok: false, year: year, problems: problems };
  }
  var map = clotureMap_(ss);
  var version = Number(clotureStr_(map, 'version') || 1);
  var archiveVersion = Math.max(1, version - 1);
  var archived = archiveClotureFolder_(year, archiveVersion);
  var ex = buildExercicePayload_(year, ss);
  var soldeFin = ex.tresorerie.solde_releve_eur != null ? ex.tresorerie.solde_releve_eur : ex.tresorerie.solde_calcule_eur;
  setClotureKeyForce_(ss, 'solde_cloture', r2_(soldeFin));
  setClotureKeyForce_(ss, 'statut', 'clos');
  if (year < new Date().getFullYear()) {
    setClotureKeyForce_(ss, 'approuve_en_ag', 'oui');
  }
  var openingNextChanged = false;
  var nextReport = null;
  var nextYear = year + 1;
  var ssNext = openYearJournal_(nextYear);
  if (ssNext) {
    var nextMap = clotureMap_(ssNext);
    var currentOpen = clotureNum_(nextMap, 'solde_ouverture');
    if (currentOpen != null && Math.abs(currentOpen - soldeFin) >= 0.01) {
      openingNextChanged = true;
      if (body.report_opening_next) {
        setClotureKeyForce_(ssNext, 'solde_ouverture', r2_(soldeFin));
        nextReport = { year: nextYear, solde_ouverture_eur: r2_(soldeFin) };
      }
    }
  }
  protectYearJournal_(year);
  appendHistoriqueJournal_(ss, session.email, 'recloture', '', {}, { version: version, solde_cloture: r2_(soldeFin) }, '');
  appendAudit_(session.email, 'exercice_recloture', 'journal', String(year),
    { version: version, solde_cloture: r2_(soldeFin), archive: archived.name || null });
  var regeneration = { ok: false, pending: true };
  try {
    regeneration = genererClotureAnnee_(session, { year: year, force: true, from_recloture: true });
  } catch (regErr) {
    regeneration = { ok: false, error: regErr.message || String(regErr), pending: true };
  }
  invalidateExercicesCache_(year);
  if (typeof invalidateJournalCaches_ === 'function') invalidateJournalCaches_(ss);
  return {
    ok: true, year: year, version: version,
    produits_eur: ex.produits_eur, charges_eur: ex.charges_eur, resultat_eur: ex.resultat_eur,
    solde_cloture: r2_(soldeFin), archive: archived,
    opening_next_changed: openingNextChanged,
    opening_next_report: nextReport,
    regeneration: regeneration
  };
}
