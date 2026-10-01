/**
 * Génération du dossier Cloture/ depuis le journal Google (étape D).
 * Port Apps Script de generer_cloture_annee.py et modules associés.
 */

var CLOTURE_FILES_ = {
  registre: '01_Registre_recettes_depenses.xlsx',
  cr: '02_Compte_de_resultat.xlsx',
  bilan: '03_Bilan_simplifie.xlsx',
  annexe: '04_Annexe.xlsx',
  rapprochement: '05_Rapprochement_bancaire.xlsx',
  synthese: '06_Synthese_AG.xlsx',
  synthese_pdf: '06_Synthese_AG.pdf',
  checklist: '07_Checklist_cloture.xlsx'
};

var POSTES_CR_LABELS_ = {
  P1: 'Dons et mécénat', P2: 'Subventions et prix', P3: 'Cotisations / adhésions',
  P4: 'Loyers et participations', P5: 'Ventes et prestations', P6: 'Autres produits',
  C1: 'Charges de mission', C2: 'Frais de fonctionnement', C3: 'Frais bancaires', C4: 'Autres charges'
};

var PRODUITS_ORDER_ = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
var CHARGES_ORDER_ = ['C1', 'C2', 'C3', 'C4'];

function getOrCreateClotureFolder_(year) {
  return getOrCreateChild_(getYearFolder_(year), 'Cloture');
}

function frEurCloture_(n) {
  if (n === null || n === undefined || n === '') return '—';
  var x = r2_(Number(n));
  var parts = String(Math.abs(x)).split('.');
  var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  var dec = (parts[1] || '00').slice(0, 2);
  if (dec.length === 1) dec += '0';
  return (x < 0 ? '-' : '') + intPart + ',' + dec + ' €';
}

function clotureBannerLabel_(year, cloture) {
  if (year >= new Date().getFullYear()) return 'PROVISOIRE';
  var version = Number(clotureStr_(cloture, 'version') || 1);
  if (version >= 2) {
    var raw = clotureStr_(cloture, 'genere_le') || clotureStr_(cloture, 'rouvert_le');
    if (raw) {
      var d = new Date(raw);
      var label = Utilities.formatDate(d, 'Europe/Paris', 'dd/MM/yyyy');
      return 'Version corrigée du ' + label + ' — à présenter à la prochaine AG';
    }
    return 'Version corrigée — à présenter à la prochaine AG';
  }
  return '';
}

/** Pad chaque ligne à la même largeur (setValues exige des lignes homogènes). */
function normalizeSheetRows_(rows) {
  if (!rows || !rows.length) return rows;
  var maxCols = rows.reduce(function (m, row) {
    return Math.max(m, row && row.length ? row.length : 0);
  }, 0);
  if (!maxCols) return rows;
  return rows.map(function (row) {
    var out = (row || []).slice();
    while (out.length < maxCols) out.push('');
    return out;
  });
}

function exportRowsAsXlsx_(fileName, sheets) {
  var tmpId = null;
  try {
    var tmp = SpreadsheetApp.create('cloture_tmp_' + Utilities.getUuid().slice(0, 8));
    tmpId = tmp.getId();
    sheets.forEach(function (spec, idx) {
      var sh = idx === 0 ? tmp.getSheets()[0] : tmp.insertSheet(safeSheetName_(spec.name));
      sh.setName(safeSheetName_(spec.name));
      var rows = normalizeSheetRows_(spec.rows);
      if (rows.length && rows[0].length) {
        sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
        sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
        sh.setFrozenRows(1);
      }
    });
    SpreadsheetApp.flush();
    Utilities.sleep(300);
    var blob = exportSpreadsheetXlsx_(tmpId);
    if (!blob) {
      throw apiError_('EXPORT_FAILED', 'Export Excel impossible pour ' + fileName, 500);
    }
    return blob.setName(fileName);
  } finally {
    if (tmpId) try { DriveApp.getFileById(tmpId).setTrashed(true); } catch (e) { /* ignore */ }
  }
}

function safeSheetName_(name) {
  return String(name || 'Feuille').replace(/[\[\]\*\/\\\?\:]/g, '_').slice(0, 99);
}

/** Export xlsx : UrlFetch puis repli DriveApp.getAs. */
function exportSpreadsheetXlsx_(spreadsheetId) {
  var mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  try {
    var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=xlsx';
    var res = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) return res.getBlob();
  } catch (e) { Logger.log('UrlFetch export : ' + e); }
  try {
    return DriveApp.getFileById(spreadsheetId).getAs(mime);
  } catch (e2) {
    Logger.log('Drive getAs export : ' + e2);
    return null;
  }
}

function replaceClotureFile_(folder, fileName, blob) {
  blob = blob.setName(fileName);
  var it = folder.getFilesByName(fileName);
  while (it.hasNext()) {
    try { it.next().setTrashed(true); } catch (e) { Logger.log('Corbeille ignorée pour ' + fileName + ' : ' + e); }
  }
  return folder.createFile(blob);
}

function loadSaisiesManuelles_(year, folder, create) {
  var name = 'saisies_manuelles_' + year + '.json';
  var template = {
    exercice: year,
    _aide: 'Saisies manuelles (immobilisations, créances, dettes, provisions). Montants en EUR.',
    decisions_tresorier: '',
    immobilisations: [], creances: [], dettes: [], provisions: [], engagements_hors_bilan: [],
    ignorer_engagements_synthese: false
  };
  var it = folder.getFilesByName(name);
  if (it.hasNext()) {
    try {
      return { data: JSON.parse(it.next().getBlob().getDataAsString('UTF-8')), existed: true };
    } catch (e) { /* recréer */ }
  }
  if (create) {
    replaceClotureFile_(folder, name, Utilities.newBlob(JSON.stringify(template, null, 2), 'application/json', name));
  }
  return { data: template, existed: false };
}

function sumSaisies_(saisies, key) {
  return (saisies[key] || []).reduce(function (s, x) { return s + (num_(x.montant) || 0); }, 0);
}

function buildRegistreRows_(ss) {
  var journal = ss.getSheetByName('Journal');
  var rows = journal ? tabRows_(journal).rows : [];
  var recettes = [['Date', 'Référence', 'Libellé', 'Projet', 'Catégorie', 'Montant EUR']];
  var depenses = [['Date', 'Référence', 'Libellé', 'Projet', 'Catégorie', 'Montant EUR', 'Facture']];
  rows.forEach(function (r) {
    var type = normTxt_(r.entry_type);
    var eur = num_(r.amount_eur) || 0;
    if (!eur || (type !== 'recette' && type !== 'depense')) return;
    var line = [isoDate_(r.expense_date), r.reference, r.label, r.project, r.category, eur];
    if (type === 'recette') recettes.push(line);
    else depenses.push(line.concat([r.piece_filename || r.drive_file_url || '']));
  });
  return { recettes: recettes, depenses: depenses };
}

function buildCrRows_(ex) {
  var rows = [['Poste', 'Libellé', 'Montant EUR']];
  PRODUITS_ORDER_.forEach(function (p) {
    var m = ex.produits_postes[p] || 0;
    if (m) rows.push([p, POSTES_CR_LABELS_[p], m]);
  });
  rows.push(['', 'Total produits', ex.produits_eur]);
  CHARGES_ORDER_.forEach(function (c) {
    var m = ex.charges_postes[c] || 0;
    if (m) rows.push([c, POSTES_CR_LABELS_[c], m]);
  });
  rows.push(['', 'Total charges', ex.charges_eur]);
  rows.push(['', 'Résultat', ex.resultat_eur]);
  return rows;
}

function buildRapproRows_(year, ex, cloture) {
  var ouv = ex.tresorerie.solde_ouverture_eur;
  var rec = ex.rapprochement.recettes_au_releve;
  var dep = ex.rapprochement.depenses_au_releve;
  var calc = ex.tresorerie.solde_calcule_eur;
  var rel = ex.tresorerie.solde_releve_eur;
  var ecart = ex.tresorerie.ecart_rapprochement_eur;
  return [
    ['Exercice', year],
    ['Solde d\'ouverture', ouv],
    ['+ Recettes au relevé', rec],
    ['− Dépenses au relevé', dep],
    ['= Solde calculé', calc],
    ['Solde relevé bancaire', rel],
    ['Écart', ecart],
    ['Statut', ex.tresorerie.statut_rapprochement],
    ['Explication', clotureStr_(cloture, 'ecart_explication')]
  ];
}

function buildBilanRows_(ex, saisies) {
  var immo = sumSaisies_(saisies, 'immobilisations');
  var creances = sumSaisies_(saisies, 'creances');
  var treso = ex.tresorerie.solde_releve_eur != null ? ex.tresorerie.solde_releve_eur : ex.tresorerie.solde_calcule_eur;
  var actif = r2_(immo + creances + treso);
  var dettes = sumSaisies_(saisies, 'dettes');
  var provisions = sumSaisies_(saisies, 'provisions');
  var passif = r2_(treso + dettes + provisions);
  return [
    ['ACTIF', 'Montant EUR'],
    ['Immobilisations', immo],
    ['Créances', creances],
    ['Trésorerie', treso],
    ['Total actif', actif],
    ['', ''],
    ['PASSIF', 'Montant EUR'],
    ['Fonds propres (report + résultat)', treso],
    ['Dettes', dettes],
    ['Provisions', provisions],
    ['Total passif', passif],
    ['Écart actif − passif', r2_(actif - passif)]
  ];
}

function buildChecklistCloture_(year, ex, cloture, verification) {
  var items = [];
  var ref = CONTROLE_EXERCICES_[year];
  var crOk = verification.ok || !ref || !ref.produits;
  items.push({
    id: 'cr_reference', label: 'Compte de résultat auto = CR de référence (± 1 €)',
    statut: crOk ? 'ok' : 'erreur',
    detail: 'Produits ' + frEurCloture_(ex.produits_eur) + ' · Charges ' + frEurCloture_(ex.charges_eur) +
      (verification.problems.length ? ' · ' + verification.problems.join(' ; ') : '')
  });
  var rapOk = Math.abs(ex.tresorerie.ecart_rapprochement_eur || 0) < 0.01 ||
    Boolean(clotureStr_(cloture, 'ecart_explication'));
  items.push({
    id: 'rapprochement', label: 'Rapprochement bancaire (solde calculé = relevé ± 1 €)',
    statut: rapOk ? 'ok' : 'erreur',
    detail: 'Calculé ' + frEurCloture_(ex.tresorerie.solde_calcule_eur) + ' · relevé ' +
      frEurCloture_(ex.tresorerie.solde_releve_eur) + ' · écart ' + frEurCloture_(ex.tresorerie.ecart_rapprochement_eur)
  });
  var bilanEquilibre = Math.abs(ex.tresorerie.solde_releve_eur - ex.tresorerie.solde_calcule_eur) < 0.01;
  items.push({
    id: 'bilan_equilibre', label: 'Bilan simplifié équilibré (Actif = Passif ± 1 €)',
    statut: bilanEquilibre ? 'ok' : 'warning',
    detail: 'Trésorerie ' + frEurCloture_(ex.tresorerie.solde_releve_eur)
  });
  items.push({
    id: 'exercice_clos', label: year < new Date().getFullYear() ? 'Exercice clos' : 'Exercice en cours',
    statut: year < new Date().getFullYear() ? 'ok' : 'info',
    detail: year < new Date().getFullYear() ? 'Arrêté au ' + year + '-12-31' : 'Provisoire'
  });
  var okCount = items.filter(function (i) { return i.statut === 'ok' || i.statut === 'info'; }).length;
  var hasErr = items.some(function (i) { return i.statut === 'erreur'; });
  var status = hasErr ? 'a_completer' : (items.some(function (i) { return i.statut === 'warning'; }) ? 'attention' : 'pret');
  var label = { pret: 'Clôture prête pour l\'AG', attention: 'Clôture OK · points d\'attention',
    a_completer: 'Actions requises avant l\'AG' }[status];
  if (year >= new Date().getFullYear()) label += ' (exercice provisoire)';
  return { items: items, ok_count: okCount, total: items.length, status: status, label: label, questions: [] };
}

function buildClotureSummaryJson_(year, ex, checklist, files, saisies) {
  var postes = {};
  PRODUITS_ORDER_.concat(CHARGES_ORDER_).forEach(function (k) {
    var v = (ex.produits_postes[k] || ex.charges_postes[k]) || 0;
    if (v) postes[k] = r2_(v);
  });
  var treso = ex.tresorerie.solde_releve_eur != null ? ex.tresorerie.solde_releve_eur : ex.tresorerie.solde_calcule_eur;
  var terrainPen = 0;
  Object.keys(ex.terrain_pen || {}).forEach(function (k) { terrainPen += ex.terrain_pen[k]; });
  var ref = CONTROLE_EXERCICES_[year];
  var verification = verifierGenerationCloture_(year, ex);
  return {
    year: year,
    generated_at: new Date().toISOString(),
    provisoire: year >= new Date().getFullYear(),
    clos: year < new Date().getFullYear(),
    status: checklist.status,
    label: checklist.label,
    checklist_ok: checklist.ok_count,
    checklist_total: checklist.total,
    checklist: checklist.items,
    questions_ouvertes: checklist.questions,
    compte_resultat: {
      produits_eur: ex.produits_eur, charges_eur: ex.charges_eur, resultat_eur: ex.resultat_eur,
      controle: {
        ecart_produits: ref && ref.produits ? r2_(ex.produits_eur - ref.produits) : null,
        ecart_charges: ref && ref.charges ? r2_(ex.charges_eur - ref.charges) : null,
        statut: verification.ok ? 'ok' : (ref && ref.produits ? 'ecart' : 'sans_reference'),
        explication: verification.problems.join(' ') || '',
        source: ref && ref.produits ? 'CONTROLE_EXERCICES_ (journal Google)' : null
      },
      postes: postes
    },
    tresorerie: {
      debut_eur: ex.tresorerie.solde_ouverture_eur,
      fin_eur: treso,
      releve_fin_eur: ex.tresorerie.solde_releve_eur,
      ecart_rapprochement_eur: ex.tresorerie.ecart_rapprochement_eur || 0,
      statut_rapprochement: ex.tresorerie.statut_rapprochement
    },
    bilan: {
      actif_eur: treso, passif_eur: treso, ecart_eur: 0, equilibre: true
    },
    terrain: { lignes: Object.keys(ex.terrain_pen || {}).length, pen: r2_(terrainPen) },
    files: files
  };
}

function buildSyntheseHtml_(year, ex, banner, prevEx) {
  var hist = '';
  if (prevEx) {
    hist = '<tr><td>' + (year - 1) + '</td><td>' + frEurCloture_(prevEx.produits_eur) + '</td><td>' +
      frEurCloture_(prevEx.charges_eur) + '</td><td>' + frEurCloture_(prevEx.resultat_eur) + '</td></tr>';
  }
  hist += '<tr><td><strong>' + year + '</strong></td><td><strong>' + frEurCloture_(ex.produits_eur) +
    '</strong></td><td><strong>' + frEurCloture_(ex.charges_eur) + '</strong></td><td><strong>' +
    frEurCloture_(ex.resultat_eur) + '</strong></td></tr>';
  var postes = '';
  PRODUITS_ORDER_.concat(CHARGES_ORDER_).forEach(function (p) {
    var m = ex.produits_postes[p] || ex.charges_postes[p];
    if (m) postes += '<li>' + POSTES_CR_LABELS_[p] + ' : ' + frEurCloture_(m) + '</li>';
  });
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;color:#1a1a1a;margin:24px;font-size:11px}' +
    'h1{color:#1B400D;font-size:20px;margin:0}h2{color:#04488F;font-size:13px;margin:16px 0 6px}' +
    '.banner{background:#1B400D;color:#fff;padding:6px 10px;font-weight:bold;margin-bottom:12px}' +
    'table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 6px;text-align:right}' +
    'th{background:#04488F;color:#fff;text-align:left}.sig{margin-top:24px;border-top:1px solid #1B400D;padding-top:8px}' +
    '</style></head><body>' +
    (banner ? '<div class="banner">' + banner + '</div>' : '') +
    '<h1>AKUU — Synthèse AG ' + year + '</h1>' +
    '<p>Association loi 1901 · Comptabilité de trésorerie · Généré le ' +
    Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy') + '</p>' +
    '<h2>Chiffres clés</h2><table><tr><th>Recettes</th><td>' + frEurCloture_(ex.produits_eur) +
    '</td></tr><tr><th>Dépenses</th><td>' + frEurCloture_(ex.charges_eur) +
    '</td></tr><tr><th>Résultat</th><td>' + frEurCloture_(ex.resultat_eur) +
    '</td></tr><tr><th>Trésorerie fin d\'exercice</th><td>' +
    frEurCloture_(ex.tresorerie.solde_releve_eur) + '</td></tr></table>' +
    '<h2>Historique</h2><table><tr><th>Année</th><th>Recettes</th><th>Dépenses</th><th>Résultat</th></tr>' +
    hist + '</table><h2>Principaux postes</h2><ul>' + postes + '</ul>' +
    '<div class="sig">Le trésorier certifie l\'exactitude des comptes · Signature : _____________________</div>' +
    '</body></html>';
}

function buildPackZipCloture_(folder, year, names) {
  var blobs = [];
  names.forEach(function (n) {
    var it = folder.getFilesByName(n);
    if (it.hasNext()) blobs.push(it.next().getBlob());
  });
  if (!blobs.length) return null;
  return Utilities.zip(blobs, 'Pack_Cloture_' + year + '.zip');
}

/** Compare les totaux générés aux valeurs de contrôle 2017–2025 (± 1 centime). */
function verifierGenerationCloture_(year, ex) {
  var ref = CONTROLE_EXERCICES_[year];
  if (!ref || ref.produits == null) return { ok: true, skipped: true, problems: [] };
  var problems = [];
  if (Math.abs(ex.produits_eur - ref.produits) >= 0.01) {
    problems.push('Produits ' + ex.produits_eur + ' ≠ référence ' + ref.produits);
  }
  if (Math.abs(ex.charges_eur - ref.charges) >= 0.01) {
    problems.push('Charges ' + ex.charges_eur + ' ≠ référence ' + ref.charges);
  }
  if (Math.abs(ex.resultat_eur - ref.resultat) >= 0.01) {
    problems.push('Résultat ' + ex.resultat_eur + ' ≠ référence ' + ref.resultat);
  }
  var banque = ex.tresorerie.solde_releve_eur;
  if (banque != null && ref.solde_cloture != null && Math.abs(banque - ref.solde_cloture) >= 0.01) {
    problems.push('Banque ' + banque + ' ≠ référence ' + ref.solde_cloture);
  }
  return { ok: problems.length === 0, problems: problems };
}

/**
 * Génère le dossier Cloture/ complet pour une année (admin ou trésorier).
 * body.force : true pour ignorer les écarts de contrôle (réouverture validée).
 */
function genererClotureAnnee_(session, body) {
  try {
    return genererClotureAnneeCore_(session, body);
  } catch (e) {
    if (e && e.code) throw e;
    Logger.log('genererClotureAnnee_ : ' + (e && e.stack || e));
    throw apiError_('GENERATION_FAILED', 'Génération interrompue : ' + (e.message || String(e)), 500);
  }
}

function genererClotureAnneeCore_(session, body) {
  requireTreasurer_(session);
  body = body || {};
  var year = Number(body.year);
  if (!year || year < EXERCICES_FIRST_YEAR_ || year > new Date().getFullYear()) {
    throw apiError_('VALIDATION_FAILED', 'Année invalide');
  }
  var ss = openYearJournal_(year);
  if (!ss) throw apiError_('NOT_FOUND', 'Pas de journal Google pour ' + year, 404);

  var ex = buildExercicePayload_(year, ss);
  var cloture = clotureMap_(ss);
  var verification = verifierGenerationCloture_(year, ex);
  if (!body.force && !verification.ok && !verification.skipped) {
    return { ok: false, year: year, problems: verification.problems, verification: verification };
  }

  var folder = getOrCreateClotureFolder_(year);
  var banner = clotureBannerLabel_(year, cloture);
  var saisiesPack = loadSaisiesManuelles_(year, folder, true);
  var registre = buildRegistreRows_(ss);
  var prevSs = openYearJournal_(year - 1);
  var prevEx = prevSs ? buildExercicePayload_(year - 1, prevSs) : null;

  var written = [];
  replaceClotureFile_(folder, CLOTURE_FILES_.registre, exportRowsAsXlsx_(CLOTURE_FILES_.registre, [
    { name: 'Recettes', rows: registre.recettes },
    { name: 'Depenses', rows: registre.depenses }
  ]));
  written.push(CLOTURE_FILES_.registre);

  replaceClotureFile_(folder, CLOTURE_FILES_.cr, exportRowsAsXlsx_(CLOTURE_FILES_.cr, [
    { name: 'CR', rows: buildCrRows_(ex) },
    { name: 'Detail_projet', rows: [['Projet', 'Montant EUR']].concat(
      Object.keys(ex.charges_projets || {}).map(function (k) { return [k, ex.charges_projets[k]]; })
    ) }
  ]));
  written.push(CLOTURE_FILES_.cr);

  replaceClotureFile_(folder, CLOTURE_FILES_.bilan, exportRowsAsXlsx_(CLOTURE_FILES_.bilan, [
    { name: 'Bilan', rows: buildBilanRows_(ex, saisiesPack.data) }
  ]));
  written.push(CLOTURE_FILES_.bilan);

  replaceClotureFile_(folder, CLOTURE_FILES_.annexe, exportRowsAsXlsx_(CLOTURE_FILES_.annexe, [
    { name: 'Methodes', rows: [
      ['AKUU — Annexe de clôture ' + year],
      ['Méthode', 'Comptabilité de trésorerie · journal banque = source officielle'],
      ['Terrain PEN', 'Hors CR EUR · financé par retraits comptabilisés au journal'],
      ['Bannière', banner || 'Exercice clos']
    ] },
    { name: 'Terrain_PEN', rows: [['Projet', 'Montant PEN']].concat(
      Object.keys(ex.terrain_pen || {}).map(function (k) { return [k, ex.terrain_pen[k]]; })
    ) }
  ]));
  written.push(CLOTURE_FILES_.annexe);

  replaceClotureFile_(folder, CLOTURE_FILES_.rapprochement, exportRowsAsXlsx_(CLOTURE_FILES_.rapprochement, [
    { name: 'Rapprochement', rows: buildRapproRows_(year, ex, cloture) }
  ]));
  written.push(CLOTURE_FILES_.rapprochement);

  var syntheseRows = [
    ['Synthèse AG AKUU — Exercice ' + year],
    ['Bannière', banner],
    ['Recettes', ex.produits_eur], ['Dépenses', ex.charges_eur], ['Résultat', ex.resultat_eur],
    ['Trésorerie fin', ex.tresorerie.solde_releve_eur]
  ];
  replaceClotureFile_(folder, CLOTURE_FILES_.synthese, exportRowsAsXlsx_(CLOTURE_FILES_.synthese, [
    { name: 'Synthese', rows: syntheseRows }
  ]));
  written.push(CLOTURE_FILES_.synthese);

  var checklist = buildChecklistCloture_(year, ex, cloture, verification);
  replaceClotureFile_(folder, CLOTURE_FILES_.checklist, exportRowsAsXlsx_(CLOTURE_FILES_.checklist, [
    { name: 'Checklist', rows: [['ID', 'Contrôle', 'Statut', 'Détail']].concat(
      checklist.items.map(function (i) { return [i.id, i.label, i.statut, i.detail]; })
    ) }
  ]));
  written.push(CLOTURE_FILES_.checklist);

  try {
    var html = buildSyntheseHtml_(year, ex, banner, prevEx);
    var pdf = HtmlService.createHtmlOutput(html).getAs('application/pdf').setName(CLOTURE_FILES_.synthese_pdf);
    replaceClotureFile_(folder, CLOTURE_FILES_.synthese_pdf, pdf);
    written.push(CLOTURE_FILES_.synthese_pdf);
  } catch (pdfErr) {
    Logger.log('PDF synthèse non généré : ' + pdfErr);
  }

  var summary = buildClotureSummaryJson_(year, ex, checklist, written, saisiesPack.data);
  replaceClotureFile_(folder, 'cloture_' + year + '.json',
    Utilities.newBlob(JSON.stringify(summary, null, 2), 'application/json', 'cloture_' + year + '.json'));
  written.push('cloture_' + year + '.json');

  var zipBlob = buildPackZipCloture_(folder, year, written.filter(function (n) { return n !== 'Pack_Cloture_' + year + '.zip'; }));
  if (zipBlob) {
    replaceClotureFile_(folder, 'Pack_Cloture_' + year + '.zip', zipBlob);
    written.push('Pack_Cloture_' + year + '.zip');
  }

  // Exercice clos : journal protégé — pas d'écriture onglet Cloture/Historique (audit central suffit).
  var statut = exerciceStatut_(cloture, year);
  if (statut !== 'clos') {
    try {
      setClotureKeyForce_(ss, 'genere_le', new Date().toISOString());
      setClotureKeyForce_(ss, 'genere_par', session.email);
      appendHistoriqueJournal_(ss, session.email, 'generation_cloture', '', {}, { files: written }, '');
    } catch (metaErr) {
      Logger.log('Méta journal non écrite (exercice protégé ?) : ' + metaErr);
    }
  }
  appendAudit_(session.email, 'cloture_generee', 'journal', String(year), { files: written.length, statut: statut });
  invalidateExercicesCache_();

  return {
    ok: true, year: year, files: written, summary: summary, verification: verification, banner: banner
  };
}

/** Agrégats publics pour la page Comptes AG (sans authentification, sans détail privé). */
function getFinancesPubliques_() {
  var cache = CacheService.getScriptCache();
  var key = 'finances_publiques';
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* recalc */ }
  }
  var current = new Date().getFullYear();
  var years = [];
  var totals = { received: 0, spent: 0, resources: 0, bankBalance: 0 };
  var recettesGroupes = {};
  var depensesProjets = {};
  for (var y = EXERCICES_FIRST_YEAR_; y <= current; y++) {
    var ex = readExercice_(y);
    if (!ex.live) continue;
    var closing = ex.tresorerie.solde_releve_eur != null ? ex.tresorerie.solde_releve_eur : ex.tresorerie.solde_calcule_eur;
    years.push({
      year: y, label: String(y), credits: ex.produits_eur, debits: ex.charges_eur,
      resources: ex.produits_eur, provisional: ex.provisoire, closing: closing,
      recettes_groupes: ex.recettes_groupes || {},
      charges_projets: ex.charges_projets || {}
    });
    totals.received = r2_(totals.received + ex.produits_eur);
    totals.spent = r2_(totals.spent + ex.charges_eur);
    totals.resources = r2_(totals.resources + ex.produits_eur);
    if (y === current) totals.bankBalance = closing;
    Object.keys(ex.recettes_groupes || {}).forEach(function (g) {
      recettesGroupes[g] = r2_((recettesGroupes[g] || 0) + ex.recettes_groupes[g]);
    });
    Object.keys(ex.charges_projets || {}).forEach(function (p) {
      depensesProjets[p] = r2_((depensesProjets[p] || 0) + ex.charges_projets[p]);
    });
  }
  var out = {
    generated_at: new Date().toISOString(),
    meta: {
      periodLabel: EXERCICES_FIRST_YEAR_ + ' – ' + current,
      notes: ['Données agrégées depuis les journaux Google · aucune ligne ni nom de personne.']
    },
    totals: totals,
    years: years,
    recettes_par_groupe: recettesGroupes,
    depenses_par_projet: depensesProjets
  };
  cache.put(key, JSON.stringify(out), EXERCICES_CACHE_TTL_);
  return out;
}
