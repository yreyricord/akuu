/**
 * Journal de l'année en cours dans Google Sheets (source unique pour l'année ouverte).
 *
 * - Un Google Sheet par année : 3_Trésorerie/<année>/Journal_AKUU_<année> (onglets Journal + Detail_PM,
 *   mêmes colonnes que les journaux Excel des années clôturées).
 * - L'application y écrit directement : factures validées, saisies directes, suppressions, factures ajoutées.
 * - Le site le lit en direct (GET journal-annee?year=AAAA).
 * - Chaque année (ouverte ou clôturée) a son Google Sheet Journal_AKUU_AAAA sur le Drive.
 *
 * Mise en place (une fois) : Services (+) → « Drive API » ; puis exécuter initJournalAnneeEnCours.
 * Le 1er janvier, setupNewYear crée le Sheet de la nouvelle année (vide).
 */

var JOURNAL_COLUMNS = [
  'reference', 'expense_date', 'label', 'vendor_name', 'project', 'category', 'amount_eur', 'amount_pen',
  'currency', 'entry_source', 'entry_type', 'piece_filename', 'drive_file_url', 'source_file', 'source_line',
  'needs_review', 'notes', 'payment_method'
];
var PAYMENT_METHOD_CAISSE_ = { especes: true, yape_plin: true };
var PAYMENT_METHOD_HORS_CAISSE_ = { cb: true, virement: true, paypal: true, autre: true, avance: true };
var JOURNAL_TABS = ['Journal', 'Detail_PM'];

var PROJECT_CODES_ = {
  musee: 'MUSEE', maison: 'MAISON', akuuvision: 'AKUUVISION', anglais: 'ANGLAIS', hydrama: 'HYDRAMA',
  lowtech: 'LOW_TECH', dechets: 'GESTION_DECHETS', sensibilisation: 'SENSIBILISATION',
  fonctionnement: 'FONCTIONNEMENT', divers: 'DIVERS'
};
var PROJECT_LABELS_ = {
  MUSEE: 'Musée Shapishiko', MAISON: 'Maison communautaire', ANGLAIS: "Cours d'anglais", HYDRAMA: 'Hydrama',
  BAGAZAN: 'Bagazan', LOW_TECH: 'Low Tech', GESTION_DECHETS: 'Gestion des déchets', AKUUVISION: 'AKUUVision',
  SENSIBILISATION: 'Sensibilisation', FONCTIONNEMENT: 'Fonctionnement', DIVERS: 'Divers / non affecté'
};

function journalSheetId_(year) {
  return PropertiesService.getScriptProperties().getProperty('JOURNAL_SHEET_' + year) || '';
}

function findYearJournalOnDrive_(year) {
  var name = 'Journal_AKUU_' + year;
  try {
    var folder = getYearFolder_(year);
    var it = folder.getFilesByName(name);
    while (it.hasNext()) {
      var f = it.next();
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS) return f.getId();
    }
  } catch (e) { Logger.log('findYearJournalOnDrive_ ' + year + ': ' + e); }
  return '';
}

var _yearJournalCache_ = {};
var _tabRowsCache_ = {};
var _journalRowIndex_ = {};

var JOURNAL_API_CACHE_TTL_ = 180;
var JOURNAL_CLOSED_CACHE_TTL_ = 604800; // 7 j · exercices clos

function journalApiCacheKey_(year) {
  return 'journal_annee_v1_' + year;
}

function invalidateJournalApiCache_(year) {
  if (!year) return;
  try { CacheService.getScriptCache().remove(journalApiCacheKey_(year)); } catch (e) {}
}

function invalidateJournalCaches_(ss) {
  if (!ss) {
    _yearJournalCache_ = {};
    _tabRowsCache_ = {};
    _journalRowIndex_ = {};
    return;
  }
  var id = ss.getId();
  Object.keys(_tabRowsCache_).forEach(function (k) {
    if (k.indexOf(id + '::') === 0) delete _tabRowsCache_[k];
  });
  delete _journalRowIndex_[id];
  var m = String(ss.getName() || '').match(/Journal_AKUU_(\d{4})/);
  if (m) invalidateJournalApiCache_(Number(m[1]));
}

function openYearJournal_(year) {
  if (_yearJournalCache_[year]) return _yearJournalCache_[year];
  var id = journalSheetId_(year);
  if (id) {
    try {
      var cached = SpreadsheetApp.openById(id);
      _yearJournalCache_[year] = cached;
      return cached;
    } catch (e) { id = ''; }
  }
  if (!id) {
    id = findYearJournalOnDrive_(year);
    if (id) PropertiesService.getScriptProperties().setProperty('JOURNAL_SHEET_' + year, id);
  }
  if (!id) return null;
  try {
    var ss = SpreadsheetApp.openById(id);
    _yearJournalCache_[year] = ss;
    return ss;
  } catch (e) { return null; }
}

/** À lancer une fois depuis l'éditeur : convertit Journal_AKUU_<année>.xlsx du Drive en Google Sheet. */
function initJournalAnneeEnCours() {
  return initJournalAnnee_(new Date().getFullYear());
}

function initJournalAnnee_(year) {
  var existing = openYearJournal_(year);
  if (existing) {
    Logger.log('Déjà en place : ' + existing.getUrl());
    return existing.getUrl();
  }
  var yearFolder = getYearFolder_(year);
  var xlsx = yearFolder.getFilesByName('Journal_AKUU_' + year + '.xlsx');
  var ss;
  if (xlsx.hasNext()) {
    var src = xlsx.next();
    var copied;
    try {
      copied = Drive.Files.copy({ name: 'Journal_AKUU_' + year, mimeType: MimeType.GOOGLE_SHEETS, parents: [yearFolder.getId()] }, src.getId());
    } catch (e) {
      // Drive API v2
      copied = Drive.Files.copy({ title: 'Journal_AKUU_' + year, mimeType: MimeType.GOOGLE_SHEETS, parents: [{ id: yearFolder.getId() }] }, src.getId(), { convert: true });
    }
    ss = SpreadsheetApp.openById(copied.id);
  } else {
    ss = SpreadsheetApp.create('Journal_AKUU_' + year);
    DriveApp.getFileById(ss.getId()).moveTo(yearFolder);
    ss.getSheets()[0].setName('Journal');
    ss.insertSheet('Detail_PM');
  }
  JOURNAL_TABS.forEach(function (tab) {
    var sh = ss.getSheetByName(tab) || ss.insertSheet(tab);
    if (sh.getLastRow() === 0) sh.appendRow(JOURNAL_COLUMNS);
    sh.setFrozenRows(1);
  });
  PropertiesService.getScriptProperties().setProperty('JOURNAL_SHEET_' + year, ss.getId());
  ensureYearJournalStructure_(ss, year);
  appendAudit_('system@akuu.asso', 'journal_sheet_created', 'journal', String(year), { url: ss.getUrl() });
  Logger.log('Journal ' + year + ' : ' + ss.getUrl());
  return ss.getUrl();
}

/** Onglets Releves, Cloture (ouvert + ouverture N-1) et Historique pour une nouvelle année. */
function ensureYearJournalStructure_(ss, year) {
  var rel = ss.getSheetByName('Releves') || ss.insertSheet('Releves');
  if (typeof RELEVES_HEADERS !== 'undefined' && rel.getLastRow() === 0) rel.appendRow(RELEVES_HEADERS);
  var hist = ss.getSheetByName('Historique') || ss.insertSheet('Historique');
  var histHeaders = typeof HISTORIQUE_HEADERS_ !== 'undefined' ? HISTORIQUE_HEADERS_ : ['date', 'auteur', 'action', 'reference', 'avant', 'apres', 'motif'];
  if (hist.getLastRow() === 0) hist.appendRow(histHeaders);
  var cl = ss.getSheetByName('Cloture') || ss.insertSheet('Cloture');
  if (cl.getLastRow() === 0) cl.appendRow(['cle', 'valeur']);
  var map = clotureMap_(ss);
  if (!map.statut && year >= new Date().getFullYear()) {
    setClotureKeyForce_(ss, 'statut', 'ouvert');
    setClotureKeyForce_(ss, 'version', 1);
    setClotureKeyForce_(ss, 'approuve_en_ag', 'non');
    var ouv = null;
    if (year > EXERCICES_FIRST_YEAR_) {
      var prev = openYearJournal_(year - 1);
      if (prev) {
        var prevCl = clotureMap_(prev);
        ouv = clotureNum_(prevCl, 'solde_cloture');
        if (ouv === null) {
          var prevEx = buildExercicePayload_(year - 1, prev);
          ouv = prevEx.tresorerie.solde_releve_eur != null ? prevEx.tresorerie.solde_releve_eur : prevEx.tresorerie.solde_calcule_eur;
        }
      }
    }
    if (ouv === null && typeof CONTROLE_EXERCICES_ !== 'undefined' && CONTROLE_EXERCICES_[year]) {
      ouv = CONTROLE_EXERCICES_[year].solde_ouverture;
    }
    if (ouv != null) setClotureKeyForce_(ss, 'solde_ouverture', ouv);
  }
}

function tabRowsCacheKey_(sheet) {
  var ssId = 'local';
  if (typeof sheet.getParent === 'function') {
    try { ssId = sheet.getParent().getId(); } catch (e) { /* mock ou sheet isolé */ }
  }
  return ssId + '::' + sheet.getName();
}

function tabRows_(sheet) {
  var cacheKey = tabRowsCacheKey_(sheet);
  if (_tabRowsCache_[cacheKey]) return _tabRowsCache_[cacheKey];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    var empty = { headers: data[0] || JOURNAL_COLUMNS, rows: [] };
    _tabRowsCache_[cacheKey] = empty;
    return empty;
  }
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var o = { _row: i + 1 };
    for (var j = 0; j < headers.length; j++) o[headers[j]] = data[i][j];
    if (o.reference) rows.push(o);
  }
  var result = { headers: headers, rows: rows };
  _tabRowsCache_[cacheKey] = result;
  return result;
}

function isoDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Europe/Paris', 'yyyy-MM-dd');
  return String(v || '').substring(0, 10);
}

function num_(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

/** Colonne optionnelle sur les journaux existants (Detail_PM surtout). */
function ensurePaymentMethodColumn_(ss) {
  JOURNAL_TABS.forEach(function (tab) {
    var sh = ss.getSheetByName(tab);
    if (!sh || sh.getLastRow() === 0) return;
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (headers.indexOf('payment_method') >= 0) return;
    sh.getRange(1, headers.length + 1).setValue('payment_method');
  });
}

/** Mode de paiement explicite (colonne) ou déduit des notes — jamais « espèces » par défaut aveugle. */
function readPaymentMethod_(row) {
  var explicit = normTxt_(row.payment_method);
  if (explicit) return explicit;
  if (String(row.category) === 'Facture cataloguée') return 'cb';
  var pen = num_(row.amount_pen) || 0;
  var eur = num_(row.amount_eur) || 0;
  var notes = normTxt_(row.notes);
  // Detail_PM en soles = dépense terrain ; amount_eur peut être une conversion indicative (import catalogue).
  if (pen > 0 && String(row.category) === 'Dépenses terrain PM') {
    if (notes.indexOf('import detail pm') >= 0 && notes.indexOf('esp') >= 0) return 'especes';
    if (notes.indexOf('avance') >= 0) return 'avance';
    if (notes.indexOf('yape') >= 0 || notes.indexOf('plin') >= 0) return 'yape_plin';
    if (notes.indexOf('carte') >= 0 || notes.indexOf('cb ') >= 0) return 'cb';
    return 'especes';
  }
  if (eur > 0) return 'cb';
  if (notes.indexOf('import detail pm') >= 0 && notes.indexOf('esp') >= 0) return 'especes';
  if (notes.indexOf('western union') >= 0 || notes.indexOf('wu ') >= 0) return 'virement';
  if (notes.indexOf('avance') >= 0) return 'avance';
  if (notes.indexOf('yape') >= 0 || notes.indexOf('plin') >= 0) return 'yape_plin';
  if (notes.indexOf('carte') >= 0 || notes.indexOf('cb ') >= 0) return 'cb';
  if (notes.indexOf('paye par') >= 0) {
    if (notes.indexOf('carte') >= 0 || notes.indexOf('cb ') >= 0) return 'cb';
    if (notes.indexOf('virement') >= 0) return 'virement';
  }
  return '';
}

function isPaymentMethodCaisse_(method) {
  return !!PAYMENT_METHOD_CAISSE_[normTxt_(method)];
}

/** Montants saisis (EUR ou PEN) + contre-valeur au taux du jour de l'écriture. */
function resolveJournalAmountsFromBody_(body, expenseDate) {
  var pen = body.amount_pen != null && body.amount_pen !== '' ? r2_(Number(body.amount_pen)) : 0;
  var eur = body.amount_eur != null && body.amount_eur !== '' ? r2_(Math.abs(Number(body.amount_eur))) : 0;
  var amount = body.amount != null && body.amount !== '' ? Number(body.amount) : null;
  var currency = normTxt_(body.currency || '');
  if (amount != null && !isNaN(amount) && amount > 0) {
    if (currency === 'eur') eur = r2_(Math.abs(amount));
    else pen = r2_(amount);
  }
  var rateInfo = typeof getExchangeRateForDate_ === 'function'
    ? (getExchangeRateForDate_(expenseDate) || getExchangeRate_())
    : getExchangeRate_();
  var rate = rateInfo && rateInfo.rate ? Number(rateInfo.rate) : 0;
  if (eur > 0 && !pen && rate > 0) pen = r2_(eur / rate);
  if (pen > 0 && !eur && rate > 0) eur = r2_(pen * rate);
  return { pen: pen || 0, eur: eur || 0 };
}

function applyPaymentMethodPatch_(row, method) {
  method = normTxt_(method);
  var patch = { payment_method: method };
  var pen = num_(row.amount_pen) || 0;
  if (isPaymentMethodCaisse_(method) || method === 'avance') {
    patch.category = 'Dépenses terrain PM';
    patch.currency = 'PEN';
    patch.amount_eur = '';
  } else {
    patch.category = 'Facture cataloguée';
    patch.currency = 'EUR';
    if (!num_(row.amount_eur) && pen && typeof getExchangeRate_ === 'function') {
      var rateInfo = getExchangeRate_();
      if (rateInfo && rateInfo.rate) patch.amount_eur = r2_(pen * Number(rateInfo.rate));
    }
  }
  return patch;
}

function normalizeProjectCode_(project) {
  var raw = String(project || '').trim();
  if (!raw) return '';
  var maps = typeof buildProjectMaps_ === 'function' ? buildProjectMaps_() : { codes: PROJECT_CODES_, labels: PROJECT_LABELS_, aliases: {} };
  var low = normTxt_(raw);
  if (maps.aliases[low]) return maps.aliases[low];
  if (maps.codes[low]) return maps.codes[low];
  if (PROJECT_CODES_[low]) return PROJECT_CODES_[low];
  var up = raw.toUpperCase().replace(/-/g, '_');
  if (maps.labels[up] || PROJECT_LABELS_[up]) return up;
  Object.keys(maps.labels).forEach(function (code) {
    if (normTxt_(maps.labels[code]) === low) up = code;
  });
  Object.keys(PROJECT_LABELS_).forEach(function (code) {
    if (normTxt_(PROJECT_LABELS_[code]) === low) up = code;
  });
  return up || 'DIVERS';
}

function projectSlug_(storedProject) {
  var up = normalizeProjectCode_(storedProject);
  if (typeof getTresorerieProjects_ === 'function') {
    var projects = getTresorerieProjects_();
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var code = normalizeProjectCode_(p.code);
      if (code === up) return normTxt_(String(p.code || '')).replace(/\s+/g, '_');
    }
  }
  var k;
  for (k in PROJECT_CODES_) {
    if (PROJECT_CODES_[k] === up) return k;
  }
  return normTxt_(storedProject).replace(/\s+/g, '_') || 'divers';
}

function projectLabel_(storedProject) {
  var code = normalizeProjectCode_(storedProject);
  if (typeof buildProjectMaps_ === 'function') {
    var maps = buildProjectMaps_();
    if (maps.labels[code]) return maps.labels[code];
  }
  return PROJECT_LABELS_[code] || String(storedProject || '');
}

/** Mise à jour projet et/ou mode de paiement (journal Google de l'année ouverte). */
function updateJournalLine_(year, reference, actor, patch) {
  assertExerciceModifiable_(year);
  var ss = openYearJournal_(year);
  if (!ss) return null;
  ensurePaymentMethodColumn_(ss);
  var hit = findJournalRow_(ss, reference);
  if (!hit) return null;
  var before = {};
  hit.headers.forEach(function (h) { before[h] = hit.row[h]; });
  var headers = hit.sheet.getRange(1, 1, 1, hit.sheet.getLastColumn()).getValues()[0];
  var set = function (col, v) {
    var idx = headers.indexOf(col);
    if (idx < 0) return;
    hit.sheet.getRange(hit.row._row, idx + 1).setValue(v === undefined || v === null ? '' : v);
  };
  var after = {};
  hit.headers.forEach(function (h) { after[h] = hit.row[h]; });
  if (patch.project) {
    after.project = normalizeProjectCode_(patch.project);
    set('project', after.project);
  }
  if (patch.category) {
    after.category = String(patch.category);
    set('category', after.category);
  }
  if (patch.payment_method && hit.sheet.getName() === 'Detail_PM') {
    var pmPatch = applyPaymentMethodPatch_(hit.row, patch.payment_method);
    Object.keys(pmPatch).forEach(function (k) {
      after[k] = pmPatch[k];
      set(k, pmPatch[k]);
    });
  }
  if (patch.amount_pen === '' || patch.amount_pen === null) {
    after.amount_pen = '';
    set('amount_pen', '');
  } else if (patch.amount_pen != null && patch.amount_pen !== '') {
    var penVal = r2_(Number(patch.amount_pen));
    if (isNaN(penVal) || penVal <= 0) throw apiError_('VALIDATION_FAILED', 'Montant PEN invalide');
    after.amount_pen = penVal;
    set('amount_pen', penVal);
  }
  if (patch.amount_eur === '' || patch.amount_eur === null) {
    after.amount_eur = '';
    set('amount_eur', '');
  } else if (patch.amount_eur != null && patch.amount_eur !== '') {
    var eurVal = r2_(Math.abs(Number(patch.amount_eur)));
    if (isNaN(eurVal) || eurVal <= 0) throw apiError_('VALIDATION_FAILED', 'Montant EUR invalide');
    after.amount_eur = eurVal;
    set('amount_eur', eurVal);
  }
  if (patch.currency) {
    after.currency = String(patch.currency).toUpperCase() === 'EUR' ? 'EUR' : 'PEN';
    set('currency', after.currency);
    if (after.currency === 'EUR' && patch.amount_pen === undefined) {
      after.amount_pen = '';
      set('amount_pen', '');
    }
    if (after.currency === 'PEN' && patch.amount_eur === undefined && hit.sheet.getName() === 'Detail_PM') {
      after.amount_eur = '';
      set('amount_eur', '');
    }
  }
  if (patch.notes != null && hit.sheet.getName() === 'Journal') {
    after.notes = String(patch.notes);
    set('notes', after.notes);
  }
  if (typeof appendHistoriqueJournal_ === 'function') {
    appendHistoriqueJournal_(ss, actor, 'modification', reference, before, after, String(patch.reason || ''));
  }
  appendAudit_(actor, 'journal_line_updated', 'journal', reference, { year: year, before: before, after: after });
  invalidateJournalCaches_(ss);
  return {
    reference: reference, year: year, tab: hit.sheet.getName(),
    payment_method: readPaymentMethod_(after), project: after.project,
    amount_pen: num_(after.amount_pen), amount_eur: num_(after.amount_eur),
    currency: String(after.currency || ''), notes: String(after.notes || '')
  };
}

/** Lignes au format du site (onglets Écritures / Factures). */
function getJournalAnnee_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  var cacheKey = journalApiCacheKey_(year);
  try {
    var cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  var ss = openYearJournal_(year);
  if (!ss) {
    return {
      year: year, live: false, rows: [],
      reason: 'JOURNAL_SHEET_' + year + ' absent — exécuter initJournalAnnee_(' + year + ') dans Apps Script'
    };
  }
  var out = [];
  JOURNAL_TABS.forEach(function (tab) {
    var sh = ss.getSheetByName(tab);
    if (!sh) return;
    var src = tab === 'Journal' ? 'banque' : 'terrain';
    tabRows_(sh).rows.forEach(function (r) {
      var type = String(r.entry_type || '').toLowerCase();
      if (type !== 'recette' && type !== 'depense') return;
      var pen = num_(r.amount_pen), eur = num_(r.amount_eur);
      if (src === 'terrain' && !pen && !eur) return;
      if (src === 'banque' && !eur && !pen) return;
      var piece = String(r.piece_filename || '').trim();
      var url = String(r.drive_file_url || '').trim();
      var pm = src === 'terrain' ? readPaymentMethod_(r) : null;
      out.push({
        ref: String(r.reference), date: isoDate_(r.expense_date), source: src, type: type,
        project: projectLabel_(r.project), project_code: projectSlug_(r.project),
        category: String(r.category || ''), payment_method: pm,
        caisse_cash: src === 'terrain' && type === 'depense' && pen && isPaymentMethodCaisse_(readPaymentMethod_(r)),
        label: String(r.label || '').substring(0, 160), vendor: String(r.vendor_name || '').substring(0, 60),
        eur: eur || null,
        pen: pen || null,
        currency: String(r.currency || '').toUpperCase() || (src === 'banque' ? 'EUR' : 'PEN'),
        url: url, piece: piece, editable: true
      });
    });
  });
  out.sort(function (a, b) { return (b.date + b.ref).localeCompare(a.date + a.ref); });
  var result = { year: year, live: true, sheet_url: ss.getUrl(), rows: out };
  try {
    var ttl = (typeof isExerciceClos_ === 'function' && isExerciceClos_(year))
      ? JOURNAL_CLOSED_CACHE_TTL_
      : JOURNAL_API_CACHE_TTL_;
    CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), ttl);
  } catch (e) { Logger.log('journal cache put ' + year + ': ' + e); }
  return result;
}

function buildJournalRowIndex_(ss) {
  var id = ss.getId();
  if (_journalRowIndex_[id]) return _journalRowIndex_[id];
  var index = {};
  for (var t = 0; t < JOURNAL_TABS.length; t++) {
    var sh = ss.getSheetByName(JOURNAL_TABS[t]);
    if (!sh) continue;
    var tr = tabRows_(sh);
    for (var i = 0; i < tr.rows.length; i++) {
      var ref = String(tr.rows[i].reference);
      if (ref) index[ref] = { sheet: sh, headers: tr.headers, row: tr.rows[i] };
    }
  }
  _journalRowIndex_[id] = index;
  return index;
}

function findJournalRow_(ss, reference) {
  var index = buildJournalRowIndex_(ss);
  return index[String(reference)] || null;
}

/** Suppression réelle dans le Sheet de l'année (la ligne complète est gardée dans l'Audit). */
function deleteFromYearJournal_(year, reference, actor, reason) {
  assertExerciceModifiable_(year);
  var ss = openYearJournal_(year);
  if (!ss) return false;
  var hit = findJournalRow_(ss, reference);
  if (!hit) return false;
  var copy = {};
  hit.headers.forEach(function (h) { copy[h] = hit.row[h]; });
  appendAudit_(actor, 'journal_line_deleted_row', 'journal', reference, { year: year, reason: reason, tab: hit.sheet.getName(), row: copy });
  if (typeof appendHistoriqueJournal_ === 'function') {
    appendHistoriqueJournal_(ss, actor, 'suppression', reference, copy, {}, reason);
  }
  var prefix = typeof PROTECTION_DESC_PREFIX_ !== 'undefined' ? PROTECTION_DESC_PREFIX_ : 'AKUU exercice ';
  hit.sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (String(p.getDescription()).indexOf(prefix) >= 0) {
      try { p.remove(); } catch (e) { Logger.log('delete: levée protection : ' + e); }
    }
  });
  hit.sheet.deleteRow(hit.row._row);
  invalidateJournalCaches_(ss);
  return true;
}

function attachInYearJournal_(year, reference, fileName, url, actor) {
  var ss = openYearJournal_(year);
  if (!ss) return false;
  var hit = findJournalRow_(ss, reference);
  if (!hit) return false;
  var set = function (col, v) {
    var idx = hit.headers.indexOf(col);
    if (idx >= 0) hit.sheet.getRange(hit.row._row, idx + 1).setValue(v);
  };
  // Exercice clos : feuille protégée — levée temporaire pour la pièce jointe uniquement.
  var prefix = typeof PROTECTION_DESC_PREFIX_ !== 'undefined' ? PROTECTION_DESC_PREFIX_ : 'AKUU exercice ';
  var wasProtected = false;
  hit.sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (String(p.getDescription()).indexOf(prefix) >= 0) {
      wasProtected = true;
      try { p.remove(); } catch (e) { Logger.log('attach: levée protection : ' + e); }
    }
  });
  try {
    set('piece_filename', fileName);
    set('drive_file_url', url);
    set('notes', (String(hit.row.notes || '') + ' · Facture ajoutée depuis le site (' + actor + ', ' + isoDate_(new Date()) + ').').replace(/^ · /, ''));
    if (typeof appendHistoriqueJournal_ === 'function') {
      appendHistoriqueJournal_(ss, actor, 'piece_jointe', reference, {}, { file: fileName, url: url }, '');
    }
    invalidateJournalCaches_(ss);
    return true;
  } catch (e) {
    Logger.log('attachInYearJournal_ : ' + e);
    return false;
  } finally {
    if (wasProtected && typeof protectYearJournal_ === 'function' && typeof isExerciceClos_ === 'function' && isExerciceClos_(year)) {
      try { protectYearJournal_(year); } catch (e2) { Logger.log('attach: re-protection : ' + e2); }
    }
  }
}

/** Numéro séquentiel AKUU-PM-AAAA-NNNN ou AKUU-IMP-AAAA-NNNN dans un onglet. */
function maxRefNumberInSheet_(sh, prefix, year) {
  if (!sh) return 0;
  var maxN = 0;
  var re = new RegExp('^' + String(prefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-' + year + '-(\\d{4})$');
  tabRows_(sh).rows.forEach(function (r) {
    var m = String(r.reference || '').match(re);
    if (m) maxN = Math.max(maxN, Number(m[1]));
  });
  return maxN;
}

function nextYearJournalReference_(ss, tab, year) {
  var prefix = tab === 'Detail_PM' ? 'AKUU-PM' : 'AKUU-IMP';
  var sh = ss.getSheetByName(tab);
  return prefix + '-' + year + '-' + pad4_(maxRefNumberInSheet_(sh, prefix, year) + 1);
}

/** Ajout manuel depuis l'onglet Écritures (terrain Detail_PM ou banque Journal). */
function createJournalEntry_(session, body) {
  requireTreasurer_(session);
  var year = Number(body.year);
  if (!year || year < 2017) throw apiError_('VALIDATION_FAILED', 'Année invalide');
  assertExerciceModifiable_(year);
  var ss = openYearJournal_(year);
  if (!ss) throw apiError_('NOT_FOUND', 'Journal ' + year + ' introuvable', 404);

  var source = normTxt_(body.source || 'terrain');
  if (source !== 'terrain' && source !== 'banque') {
    throw apiError_('VALIDATION_FAILED', 'Source invalide (terrain ou banque)');
  }
  var label = String(body.label || '').trim();
  if (!label) throw apiError_('VALIDATION_FAILED', 'Libellé obligatoire');
  var expenseDate = isoDate_(body.expense_date);
  if (!expenseDate) throw apiError_('VALIDATION_FAILED', 'Date obligatoire');
  if (Number(String(expenseDate).substring(0, 4)) !== year) {
    throw apiError_('VALIDATION_FAILED', 'La date doit être en ' + year);
  }

  ensurePaymentMethodColumn_(ss);
  var tab = source === 'terrain' ? 'Detail_PM' : 'Journal';
  var sh = ss.getSheetByName(tab);
  if (!sh) throw apiError_('NOT_FOUND', 'Onglet ' + tab + ' absent', 404);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var reference = nextYearJournalReference_(ss, tab, year);

  var receipt = body._attachments && body._attachments.receipt;
  var blob = blobFromAttachment_(receipt, 'justificatif.pdf');
  var driveInfo = { drive_file_url: '', file_name: '' };
  if (blob) {
    var standardName = buildStandardFilename_({
      expense_date: expenseDate,
      reference: reference,
      currency: source === 'terrain' ? 'PEN' : 'EUR',
      amount_pen: body.amount_pen,
      amount_eur: body.amount_eur,
      vendor_name: body.vendor_name,
      label: label,
      ext: extensionFromAttachment_(receipt)
    });
    var uploaded = uploadFactureFile_(blob, { fileName: standardName, year: year });
    driveInfo.drive_file_url = uploaded.drive_file_url || '';
    driveInfo.file_name = uploaded.file_name || standardName;
  }

  var actor = session.email;
  var noteBase = 'Ajout manuel depuis Écritures (' + actor + ', ' + isoDate_(new Date()) + ')';
  if (body.notes) noteBase += ' · ' + String(body.notes).trim();

  var resolved = resolveJournalAmountsFromBody_(body, expenseDate);
  var obj, pen = null, eur = null;
  if (source === 'terrain') {
    pen = resolved.pen;
    eur = resolved.eur;
    if (!pen && !eur) throw apiError_('VALIDATION_FAILED', 'Montant obligatoire');
    var pm = normTxt_(body.payment_method) || 'especes';
    var curTerrain = normTxt_(body.currency || (pen ? 'pen' : 'eur'));
    var caissePm = isPaymentMethodCaisse_(pm) || pm === 'avance';
    obj = {
      reference: reference,
      expense_date: expenseDate,
      label: label,
      vendor_name: String(body.vendor_name || '').trim(),
      project: normalizeProjectCode_(body.project || 'maison'),
      category: 'Dépenses terrain PM',
      amount_eur: caissePm ? '' : (eur || ''),
      amount_pen: pen || '',
      currency: caissePm ? 'PEN' : (curTerrain === 'eur' ? 'EUR' : 'PEN'),
      entry_source: 'site',
      entry_type: 'depense',
      piece_filename: driveInfo.file_name,
      drive_file_url: driveInfo.drive_file_url,
      source_file: 'Écritures · site trésorerie',
      source_line: '',
      needs_review: 'non',
      payment_method: pm,
      notes: noteBase
    };
    if (pm && !isPaymentMethodCaisse_(pm)) {
      obj.category = 'Facture cataloguée';
      obj.currency = 'EUR';
    }
  } else {
    var entryType = normTxt_(body.entry_type) === 'recette' ? 'recette' : 'depense';
    eur = resolved.eur;
    pen = resolved.pen;
    if (!eur && !pen) throw apiError_('VALIDATION_FAILED', 'Montant obligatoire');
    var curBanque = normTxt_(body.currency || (eur ? 'eur' : 'pen'));
    obj = {
      reference: reference,
      expense_date: expenseDate,
      label: label,
      vendor_name: String(body.vendor_name || '').trim(),
      project: normalizeProjectCode_(body.project || 'fonctionnement'),
      category: String(body.category || 'Dépenses par carte').trim(),
      amount_eur: eur || '',
      amount_pen: pen || '',
      currency: curBanque === 'pen' ? 'PEN' : 'EUR',
      entry_source: 'site',
      entry_type: entryType,
      piece_filename: driveInfo.file_name,
      drive_file_url: driveInfo.drive_file_url,
      source_file: 'Écritures · site trésorerie',
      source_line: '',
      needs_review: 'non',
      payment_method: '',
      notes: noteBase
    };
  }

  var prefix = typeof PROTECTION_DESC_PREFIX_ !== 'undefined' ? PROTECTION_DESC_PREFIX_ : 'AKUU exercice ';
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (String(p.getDescription()).indexOf(prefix) >= 0) {
      try { p.remove(); } catch (e) { Logger.log('create: levée protection : ' + e); }
    }
  });
  try {
    sh.appendRow(headers.map(function (h) {
      var v = obj[h];
      return v === undefined || v === null ? '' : v;
    }));
    if (typeof appendHistoriqueJournal_ === 'function') {
      appendHistoriqueJournal_(ss, actor, 'ajout', reference, {}, obj, String(body.reason || ''));
    }
    invalidateJournalCaches_(ss);
    appendAudit_(actor, 'journal_line_created', 'journal', reference, { year: year, tab: tab, source: source });
  } catch (e) {
    Logger.log('createJournalEntry_ : ' + e);
    throw apiError_('INTERNAL_ERROR', 'Impossible d\'ajouter la ligne au journal');
  } finally {
    if (typeof protectYearJournal_ === 'function' && typeof isExerciceClos_ === 'function' && isExerciceClos_(year)) {
      try { protectYearJournal_(year); } catch (e2) { Logger.log('create: re-protection : ' + e2); }
    }
  }

  return {
    reference: reference,
    year: year,
    tab: tab,
    source: source === 'terrain' ? 'terrain' : 'banque',
    type: obj.entry_type,
    date: expenseDate,
    label: label,
    project: projectLabel_(obj.project),
    project_code: projectSlug_(obj.project),
    payment_method: source === 'terrain' ? readPaymentMethod_(obj) : null,
    pen: pen || null,
    eur: eur || null,
    url: driveInfo.drive_file_url
  };
}

/** Facture validée ou saisie directe → ligne Detail_PM du journal de l'année. */
function appendToYearJournal_(f) {
  var year = Number(String(f.expense_date || '').substring(0, 4)) || new Date().getFullYear();
  assertExerciceModifiable_(year);
  var ss = openYearJournal_(year);
  if (!ss) return false;
  ensurePaymentMethodColumn_(ss);
  var sh = ss.getSheetByName('Detail_PM');
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var pen = num_(f.amount_pen);
  var isPen = String(f.currency || '').toUpperCase() === 'PEN' && pen;
  var obj = {
    reference: f.reference,
    expense_date: String(f.expense_date || '').substring(0, 10),
    label: f.label,
    vendor_name: f.vendor_name || '',
    project: PROJECT_CODES_[String(f.project || '').toLowerCase()] || String(f.project || '').toUpperCase(),
    // Espèces en soles = dépense terrain ; payé en euros (carte, virement) = pièce cataloguée,
    // la dépense elle-même sera la ligne du relevé bancaire (pas de double compte).
    category: isPen ? 'Dépenses terrain PM' : 'Facture cataloguée',
    amount_eur: num_(f.amount_eur),
    amount_pen: pen,
    currency: isPen ? 'PEN' : 'EUR',
    entry_source: 'application',
    entry_type: 'depense',
    piece_filename: f.file_name || '',
    drive_file_url: f.drive_file_url || '',
    source_file: 'Application trésorerie',
    source_line: '',
    needs_review: '',
    payment_method: String(f.payment_method || (isPen ? 'especes' : 'cb')),
    notes: 'Saisie application · ' + (f.category || '') + ' · ' + (f.submitter_email || '') +
      (f.paid_by ? ' · payé par ' + f.paid_by : '')
  };
  if (obj.payment_method && !isPaymentMethodCaisse_(obj.payment_method)) {
    obj.category = 'Facture cataloguée';
    obj.currency = 'EUR';
  }
  sh.appendRow(headers.map(function (h) { var v = obj[h]; return v === undefined || v === null ? '' : v; }));
  if (typeof appendHistoriqueJournal_ === 'function') {
    appendHistoriqueJournal_(ss, f.submitter_email || f.treasurer_email || 'application', 'ajout', f.reference, {}, obj, f.notes || '');
  }
  invalidateJournalCaches_(ss);
  return true;
}
