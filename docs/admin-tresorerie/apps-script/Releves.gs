/**
 * Import mensuel du relevé bancaire (PDF lu dans le navigateur, opérations validées par le trésorier).
 * - Ajoute les opérations à l'onglet Journal du journal Google de l'année (références AKUU-IMP-AAAA-NNNN)
 * - Ignore les opérations déjà présentes (même date, même montant, même début de libellé)
 * - Range le PDF dans 3_Trésorerie/<année>/Documents/Releves_bancaires/AAAA_MM_RELEVE_PRO_AKUU.pdf
 * - Note le solde du relevé dans l'onglet « Releves » du journal (rapprochement bancaire)
 */

var RELEVES_HEADERS = ['mois', 'date_fin', 'solde_debut', 'solde_fin', 'operations_ajoutees', 'operations_ignorees',
  'fichier', 'url', 'importe_le', 'importe_par'];

function driveReleveViewUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + String(fileId) + '/view';
}

function standardReleveFileName_(year, month) {
  var mm = month < 10 ? '0' + month : String(month);
  return year + '_' + mm + '_RELEVE_PRO_AKUU.pdf';
}

function parseReleveMonthFromName_(name, year) {
  var n = String(name || '');
  if (n.toLowerCase().indexOf('paypal') >= 0) return null;
  var m = n.match(new RegExp('^' + year + '[_\\s-]*(\\d{2})[_\\s-]*RELEVE', 'i'));
  if (m) return Number(m[1]);
  m = n.match(new RegExp('RELEVE[^\\d]*(\\d{2})[^\\d]*' + year, 'i'));
  if (m) return Number(m[1]);
  m = n.match(new RegExp('^' + year + '-(\\d{2})', 'i'));
  if (m) return Number(m[1]);
  m = n.match(new RegExp('\\b' + year + '[_\\s.-](\\d{2})\\b'));
  if (m) return Number(m[1]);
  return null;
}

/** Mois → { file_name, url, drive_file_id } depuis 3_Trésorerie/<année>/Documents/Releves_bancaires. */
function listDriveReleveMonths_(year) {
  var months = {};
  try {
    var folder = getYearDocumentsSubfolder_(year, 'Releves_bancaires');
    for (var m = 1; m <= 12; m++) {
      var expected = standardReleveFileName_(year, m);
      var byName = folder.getFilesByName(expected);
      if (byName.hasNext()) {
        var f0 = byName.next();
        months[m] = { file_name: f0.getName(), url: driveReleveViewUrl_(f0.getId()), drive_file_id: f0.getId() };
      }
    }
    var it = folder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      var name = f.getName();
      var mo = parseReleveMonthFromName_(name, year);
      if (mo >= 1 && mo <= 12 && !months[mo]) {
        months[mo] = { file_name: name, url: driveReleveViewUrl_(f.getId()), drive_file_id: f.getId() };
      }
    }
  } catch (e) { /* dossier absent */ }
  return months;
}

/** Lien PDF d'un relevé (onglet Releves puis Drive). Route GET releves/link. */
function getRelevePdfLink_(session, year, month) {
  requireTreasurer_(session);
  year = Number(year);
  month = Number(month);
  if (!year || year < 2017 || !month || month < 1 || month > 12) {
    throw apiError_('VALIDATION_FAILED', 'Année ou mois invalide');
  }
  var moisStr = year + '-' + (month < 10 ? '0' : '') + month;
  var fileName = standardReleveFileName_(year, month);

  var ss = openYearJournal_(year);
  if (ss) {
    var rows = relevesOf_(ss);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].mois || '').substring(0, 7) !== moisStr) continue;
      var sheetUrl = String(rows[i].url || '').trim();
      if (sheetUrl) {
        return {
          year: year, month: month, mois: moisStr, url: sheetUrl, file_name: fileName,
          solde_fin: rows[i].solde_fin, source: 'sheet'
        };
      }
    }
  }

  var drive = listDriveReleveMonths_(year);
  if (drive[month] && drive[month].url) {
    return {
      year: year, month: month, mois: moisStr, url: drive[month].url,
      file_name: drive[month].file_name || fileName, solde_fin: null, source: 'drive'
    };
  }

  throw apiError_('NOT_FOUND', 'Relevé PDF introuvable pour ' + moisStr +
    '. Vérifiez le fichier ' + fileName + ' dans 3_Trésorerie/' + year + '/Documents/Releves_bancaires.', 404);
}

function releveKey_(date, amount, label) {
  return String(date).substring(0, 10) + '|' + Math.round(Math.abs(Number(amount)) * 100) + '|' +
    normTxt_(label).replace(/[^a-z0-9]/g, '').substring(0, 18);
}

/** true si une ligne Releves existe déjà pour ce mois. */
function monthHasReleve_(ss, year, month) {
  var rel = ss.getSheetByName('Releves');
  if (!rel || rel.getLastRow() < 2) return false;
  var key = year + '-' + month;
  var data = rel.getDataRange().getValues();
  for (var k = 1; k < data.length; k++) {
    if (String(data[k][0]) === key) return true;
  }
  return false;
}

/**
 * Avant re-dépôt d'un relevé : efface les écritures banque du mois issues d'un import précédent
 * (y compris saisies provisoires AKUU-IMP du même mois).
 */
function clearMonthReleveJournal_(ss, year, month, fileName, actor) {
  var prefix = year + '-' + month;
  var sh = ss.getSheetByName('Journal');
  if (!sh) return 0;
  if (typeof removeAkuuProtections_ === 'function') removeAkuuProtections_(sh);
  var tr = tabRows_(sh);
  var toRemove = [];
  tr.rows.forEach(function (r) {
    var d = isoDate_(r.expense_date);
    if (d.indexOf(prefix) !== 0) return;
    var ref = String(r.reference || '').trim();
    if (!ref) return;
    var sf = String(r.source_file || '').trim();
    var es = String(r.entry_source || '').trim().toLowerCase();
    var notes = String(r.notes || '');
    var impRef = ref.indexOf('AKUU-IMP-' + year + '-') === 0;
    if (sf === fileName || es === 'releve' || impRef || /Import[eé].*relev/i.test(notes)) {
      toRemove.push({ ref: ref, row: r._row });
    }
  });
  toRemove.sort(function (a, b) { return b.row - a.row; });
  var n = 0;
  toRemove.forEach(function (item) {
    if (typeof deleteFromYearJournal_ === 'function') {
      if (deleteFromYearJournal_(year, item.ref, actor, 'Remplacement relevé ' + month + '/' + year)) n++;
    }
  });
  if (n && typeof invalidateJournalCaches_ === 'function') invalidateJournalCaches_(ss);
  return n;
}

function importReleve_(session, body) {
  try {
    return importReleveImpl_(session, body);
  } catch (e) {
    if (e && e.code) throw e;
    Logger.log('importReleve_ : ' + (e && e.stack || e));
    throw apiError_('IMPORT_FAILED', 'Import relevé : ' + String(e && e.message || e).substring(0, 180));
  }
}

function importReleveImpl_(session, body) {
  requireTreasurer_(session);
  var ops = body.operations || [];
  var dateFin = String(body.date_fin || '');            // JJ/MM/AAAA
  var m = dateFin.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) throw apiError_('VALIDATION_FAILED', 'Date de fin du relevé illisible. Indiquez-la au format JJ/MM/AAAA.');
  var year = Number(m[3]), month = m[2];
  if (body.solde_fin === '' || body.solde_fin === null || body.solde_fin === undefined || isNaN(Number(body.solde_fin))) {
    throw apiError_('VALIDATION_FAILED', 'Solde de fin du relevé manquant. Recopiez-le depuis le PDF.');
  }
  var ss = openYearJournal_(year);
  if (!ss) {
    throw apiError_('FORBIDDEN', 'L\'exercice ' + year + ' est archivé : déposez seulement le PDF (bloc « Relevés manquants » de l\'année ' + year + ').', 403);
  }
  assertExerciceModifiable_(year);

  var fileName = year + '_' + month + '_RELEVE_PRO_AKUU.pdf';
  var replacing = body.replace === true || body.replace === 'true' || monthHasReleve_(ss, year, month);
  var cleared = 0;
  if (replacing) {
    cleared = clearMonthReleveJournal_(ss, year, month, fileName, session.email);
  }

  var sh = ss.getSheetByName('Journal');
  var tr = tabRows_(sh);
  var existing = {};
  var maxN = 0;
  tr.rows.forEach(function (r) {
    existing[releveKey_(isoDate_(r.expense_date), r.amount_eur, r.label)] = (existing[releveKey_(isoDate_(r.expense_date), r.amount_eur, r.label)] || 0) + 1;
    var mm = String(r.reference).match(/AKUU-IMP-\d{4}-(\d{4})/);
    if (mm) maxN = Math.max(maxN, Number(mm[1]));
  });

  // PDF
  var url = '';
  var receipt = body._attachments && body._attachments.receipt;
  var blob = blobFromAttachment_(receipt, fileName, ['pdf']);
  if (blob) {
    var folder = getYearDocumentsSubfolder_(year, 'Releves_bancaires');
    var old = folder.getFilesByName(fileName);
    while (old.hasNext()) old.next().setTrashed(true);
    url = driveReleveViewUrl_(folder.createFile(blob.setName(fileName)).getId());
  }

  var headers = tr.headers;
  var added = 0, skipped = 0;
  var seen = {};
  var newRows = [];
  ops.forEach(function (o) {
    var key = releveKey_(o.date, o.amount, o.label);
    seen[key] = (seen[key] || 0) + 1;
    if ((existing[key] || 0) >= seen[key]) { skipped++; return; }
    maxN += 1;
    var obj = {
      reference: 'AKUU-IMP-' + year + '-' + pad4_(maxN),
      expense_date: o.date,
      label: o.label,
      vendor_name: '',
      project: o.project || '',
      category: o.category || '',
      amount_eur: Math.abs(Number(o.amount)),
      amount_pen: '',
      currency: 'EUR',
      entry_source: 'releve',
      entry_type: Number(o.amount) > 0 ? 'recette' : 'depense',
      piece_filename: '',
      drive_file_url: '',
      source_file: fileName,
      needs_review: o.project ? '' : 'oui',
      notes: 'Importé du relevé ' + month + '/' + year + ' depuis le site (' + session.email + ')'
    };
    newRows.push(headers.map(function (h) { var v = obj[h]; return v === undefined || v === null ? '' : v; }));
    added++;
  });
  if (newRows.length) {
    var startRow = sh.getLastRow() + 1;
    if (typeof removeAkuuProtections_ === 'function') removeAkuuProtections_(sh);
    sh.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
    if (typeof invalidateJournalCaches_ === 'function') invalidateJournalCaches_(ss);
  }

  var rel = ss.getSheetByName('Releves') || ss.insertSheet('Releves');
  if (rel.getLastRow() === 0) rel.appendRow(RELEVES_HEADERS);
  var line = [year + '-' + month, year + '-' + month + '-' + m[1], body.solde_debut === undefined ? '' : body.solde_debut,
    Number(body.solde_fin), added, skipped, fileName, url, new Date().toISOString(), session.email];
  // Re-dépôt du même mois : on remplace la ligne (pas de doublon)
  var relData = rel.getDataRange().getValues();
  var replaced = false;
  for (var k = 1; k < relData.length; k++) {
    if (String(relData[k][0]) === year + '-' + month) {
      if (!url) line[7] = relData[k][7];
      rel.getRange(k + 1, 1, 1, line.length).setValues([line]);
      replaced = true;
      break;
    }
  }
  if (!replaced) rel.appendRow(line);
  if (typeof invalidateExercicesCache_ === 'function') invalidateExercicesCache_(year);
  appendAudit_(session.email, 'releve_imported', 'releve', year + '-' + month,
    { added: added, skipped: skipped, replaced: replacing, cleared: cleared });
  return {
    year: year, month: month, added: added, skipped: skipped, cleared: cleared, replaced: replacing,
    file_name: fileName, url: url || line[7], manual: !ops.length
  };
}

/** Relevés importés de l'année (du plus récent au plus ancien). */
function relevesOf_(ss) {
  var rel = ss.getSheetByName('Releves');
  if (!rel || rel.getLastRow() < 2) return [];
  return tabRowsAny_(rel).map(function (r) {
    return { mois: String(r.mois).substring(0, 7), date_fin: isoDate_(r.date_fin), solde_debut: num_(r.solde_debut),
      solde_fin: num_(r.solde_fin), url: String(r.url || ''), operations_ajoutees: num_(r.operations_ajoutees) };
  }).sort(function (a, b) { return b.date_fin.localeCompare(a.date_fin); });
}

/** Dernier relevé importé (pour le rapprochement affiché sur le site). */
function lastReleve_(ss) {
  return relevesOf_(ss)[0] || null;
}

// --------------------------------------------------------------------------- archives (2017 → année précédente)

var RELEVES_ARCHIVES_HEADERS = ['id', 'year', 'month', 'file_name', 'drive_file_id', 'url', 'uploaded_at', 'uploaded_by', 'status'];

function relevesArchivesSheet_() {
  var sheet = getSheet_('RelevesArchives');
  if (sheet) return sheet;
  sheet = getSpreadsheet_().insertSheet('RelevesArchives');
  sheet.appendRow(RELEVES_ARCHIVES_HEADERS);
  return sheet;
}

/** Dépôt d'un relevé PDF manquant pour une année archivée : rangé sur le Drive, journal Excel inchangé. */
function uploadReleveArchive_(session, body) {
  requireTreasurer_(session);
  var year = Number(body.year), month = Number(body.month);
  var current = new Date().getFullYear();
  if (!year || year < 2017 || year > current) throw apiError_('VALIDATION_FAILED', 'Année invalide');
  if (!month || month < 1 || month > 12) throw apiError_('VALIDATION_FAILED', 'Mois invalide');
  if (!body.base64) throw apiError_('VALIDATION_FAILED', 'Fichier PDF manquant. Choisissez le relevé puis réessayez.');
  var mm = (month < 10 ? '0' : '') + month;
  var fileName = year + '_' + mm + '_RELEVE_PRO_AKUU.pdf';
  var blob = checkedBlob_({ base64: body.base64, name: fileName }, fileName, ['pdf']);
  var folder = getYearDocumentsSubfolder_(year, 'Releves_bancaires');
  var old = folder.getFilesByName(fileName);
  while (old.hasNext()) old.next().setTrashed(true);
  var file = folder.createFile(blob);

  var sheet = relevesArchivesSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (Number(data[i][1]) === year && Number(data[i][2]) === month) sheet.deleteRow(i + 1);
  }
  var row = { id: uuid_(), year: year, month: month, file_name: fileName, drive_file_id: file.getId(), url: file.getUrl(),
    uploaded_at: new Date().toISOString(), uploaded_by: session.email, status: 'pending' };
  appendRow_('RelevesArchives', row, RELEVES_ARCHIVES_HEADERS);
  appendAudit_(session.email, 'releve_archive_uploaded', 'releve', year + '-' + mm, { file: fileName });
  // Le PDF ajouté change le statut des relevés de l'exercice : le snapshot (exercice clos) est périmé.
  if (typeof invalidateExercicesCache_ === 'function') invalidateExercicesCache_(year);
  return {
    filename: fileName, url: file.getUrl(), year: year, month: month,
    hint: 'Rangé dans 3_Trésorerie/' + year + '/Documents/Releves_bancaires. Le bilan ' + year +
      ' en tiendra compte à la prochaine mise à jour des archives.'
  };
}

function listRelevesArchives_(session) {
  requireTreasurer_(session);
  relevesArchivesSheet_();
  return readAll_('RelevesArchives');
}

/** Pour le script local (mise à jour des archives) : contenu du PDF en base64. */
function releveArchiveFile_(session, id) {
  requireTreasurer_(session);
  var r = readAll_('RelevesArchives').filter(function (x) { return x.id === id; })[0];
  if (!r) throw apiError_('NOT_FOUND', 'Relevé inconnu', 404);
  var blob = DriveApp.getFileById(r.drive_file_id).getBlob();
  return { file_name: r.file_name, year: r.year, base64: Utilities.base64Encode(blob.getBytes()) };
}

function markReleveArchiveSynced_(session, id) {
  requireTreasurer_(session);
  var sheet = relevesArchivesSheet_();
  var data = sheet.getDataRange().getValues();
  var st = data[0].indexOf('status');
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sheet.getRange(i + 1, st + 1).setValue('synced'); return { id: id, status: 'synced' }; }
  }
  throw apiError_('NOT_FOUND', 'Relevé inconnu', 404);
}

function tabRowsAny_(sheet) {
  var data = sheet.getDataRange().getValues();
  var h = data[0], out = [];
  for (var i = 1; i < data.length; i++) {
    var o = {};
    for (var j = 0; j < h.length; j++) o[h[j]] = data[i][j];
    out.push(o);
  }
  return out;
}

/**
 * À exécuter UNE FOIS (01/10/2026) : inscrit dans l'onglet « Releves » du journal 2026 les relevés de janvier à août,
 * déjà intégrés au journal avant la mise en place du dépôt par le site (soldes lus sur les PDF).
 */
function initRelevesDejaImportes2026() {
  var ss = openYearJournal_(2026);
  if (!ss) throw new Error('Journal 2026 absent : exécutez d\'abord initJournalAnneeEnCours');
  var rel = ss.getSheetByName('Releves') || ss.insertSheet('Releves');
  if (rel.getLastRow() === 0) rel.appendRow(RELEVES_HEADERS);
  var deja = {};
  tabRowsAny_(rel).forEach(function (r) { deja[String(r.mois).substring(0, 7)] = true; });
  var base = 'https://drive.google.com/file/d/';
  var data = [
    ['2026-01', '2026-01-31', 1313.86, 971.65, '1CqFp-59JXwEPgu2LPRvO0gVf1AoZ5XHE'],
    ['2026-02', '2026-02-28', 971.65, 1514.04, '1t1F6n6-0UhA0AVpzR5QClh7VdUPn4X5b'],
    ['2026-03', '2026-03-31', 1514.04, 1119.94, '1UJF26VkzT0FXzA4DWuWIU9HoRKo60D4d'],
    ['2026-04', '2026-04-30', 1119.94, 1766.16, '1FarwqCXnOxi7fn09yqRGQUGcG3A0bcPV'],
    ['2026-05', '2026-05-30', 1766.16, 1181.48, '1qlx862eucZGRI2UM5TzJMnHiKslpZqU-'],
    ['2026-06', '2026-06-30', 1181.48, 1458.53, '1XXPaY3-hL1YdXrtH9RQK3VYScpTsW50c'],
    ['2026-07', '2026-07-31', 1458.53, 1451.10, '1xwNZg0IJ6z3GmAcJ2lYUkrx5XQQ6eCll'],
    ['2026-08', '2026-08-31', 1451.10, 1341.17, '122gcEc1zNkjSphI6OEX8gEvKiZ6TkYB_']
  ];
  var n = 0;
  data.forEach(function (d) {
    if (deja[d[0]]) return;
    var mm = d[0].substring(5, 7);
    rel.appendRow([d[0], d[1], d[2], d[3], '', '', '2026_' + mm + '_RELEVE_PRO_AKUU.pdf', base + d[4] + '/view',
      new Date().toISOString(), 'reprise historique']);
    n++;
  });
  Logger.log(n + ' relevé(s) 2026 inscrit(s) dans l\'onglet Releves.');
}
