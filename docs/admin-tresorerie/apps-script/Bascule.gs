/**
 * Bascule unique des exercices clos (2017 → année précédente) vers Google Sheets.
 *
 * Appelée une fois par année depuis le site local (bouton « Basculer vers Google Sheets »).
 * Pour chaque année :
 *   1. la première fois, met de côté la version approuvée en AG : Journal_AKUU_AAAA_version_AG_v1.xlsx
 *      et le dossier Cloture_version_AG_v1 (rien n'est supprimé) ;
 *   2. range le journal corrigé (Journal_AKUU_AAAA.xlsx) et le convertit en Google Sheet Journal_AKUU_AAAA ;
 *   3. ajoute les onglets Releves (soldes mensuels) et Cloture (statut, version) ;
 *   4. range le dossier de clôture et le registre à jour ;
 *   5. recalcule les totaux depuis le Google Sheet, pour le contrôle au centime côté site.
 *
 * Relancer la bascule d'une année remplace son Google Sheet (la version AG reste intacte).
 */

var BASCULE_FILE_RE_ = /^(0[1-7]_[A-Za-z_]+\.(xlsx|pdf)|NOTE_RESERVES_AUDIT\.md|Pack_Cloture_\d{4}\.zip|cloture_\d{4}\.json|saisies_manuelles_\d{4}\.json|Registre_Depenses_\d{4}\.xlsx)$/;
var BASCULE_MIME_ = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf', zip: 'application/zip', md: 'text/markdown', json: 'application/json'
};
var CLOTURE_TAB_HEADERS = ['cle', 'valeur'];

/** Fichier envoyé par le site : nom contrôlé, taille bornée, contenu cohérent avec l'extension. */
function basculeBlob_(file) {
  var name = String(file && file.name || '');
  if (!BASCULE_FILE_RE_.test(name) && !/^Journal_AKUU_\d{4}\.xlsx$/.test(name)) {
    throw apiError_('INVALID_FILE', 'Fichier non attendu pour la bascule : ' + name);
  }
  var bytes;
  try { bytes = Utilities.base64Decode(String(file.base64 || '')); } catch (e) {
    throw apiError_('INVALID_FILE', 'Fichier illisible : ' + name);
  }
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw apiError_('FILE_TOO_LARGE', 'Fichier vide ou trop lourd : ' + name, 413);
  var ext = name.split('.').pop().toLowerCase();
  var b0 = (bytes[0] + 256) % 256, b1 = (bytes[1] + 256) % 256;
  var isZip = b0 === 0x50 && b1 === 0x4B;                       // PK : xlsx et zip
  var isPdf = b0 === 0x25 && b1 === 0x50;                       // %P
  if ((ext === 'xlsx' || ext === 'zip') && !isZip) throw apiError_('INVALID_FILE_TYPE', 'Contenu inattendu : ' + name);
  if (ext === 'pdf' && !isPdf) throw apiError_('INVALID_FILE_TYPE', 'Contenu inattendu : ' + name);
  if ((ext === 'md' || ext === 'json') && (isZip || isPdf)) throw apiError_('INVALID_FILE_TYPE', 'Contenu inattendu : ' + name);
  return Utilities.newBlob(bytes, BASCULE_MIME_[ext], name);
}

/** Remplace (corbeille) les fichiers de même nom puis crée le nouveau. */
function basculeReplaceFile_(folder, blob) {
  var old = folder.getFilesByName(blob.getName());
  while (old.hasNext()) old.next().setTrashed(true);
  return folder.createFile(blob);
}

/** Met de côté, une seule fois, la version approuvée en AG (journal Excel + dossier Cloture). */
function basculeKeepAgVersion_(yearFolder, year) {
  var kept = [];
  var agName = 'Journal_AKUU_' + year + '_version_AG_v1.xlsx';
  if (!yearFolder.getFilesByName(agName).hasNext()) {
    var cur = yearFolder.getFilesByName('Journal_AKUU_' + year + '.xlsx');
    if (cur.hasNext()) { cur.next().setName(agName); kept.push(agName); }
  }
  if (!yearFolder.getFoldersByName('Cloture_version_AG_v1').hasNext()) {
    var clo = yearFolder.getFoldersByName('Cloture');
    if (clo.hasNext()) { clo.next().setName('Cloture_version_AG_v1'); kept.push('Cloture_version_AG_v1/'); }
  }
  return kept;
}

/** Convertit le journal Excel en Google Sheet (API Drive v3, sinon v2). */
function basculeConvertJournal_(blob, yearFolder, year) {
  var name = 'Journal_AKUU_' + year;
  var file;
  try {
    file = Drive.Files.create({ name: name, mimeType: MimeType.GOOGLE_SHEETS, parents: [yearFolder.getId()] }, blob);
  } catch (e) {
    file = Drive.Files.insert({ title: name, mimeType: MimeType.GOOGLE_SHEETS, parents: [{ id: yearFolder.getId() }] }, blob, { convert: true });
  }
  return SpreadsheetApp.openById(file.id);
}

function basculeWriteTab_(ss, name, headers, rows) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  var values = [headers].concat(rows.map(function (r) { return headers.map(function (h) { return r[h] === undefined || r[h] === null ? '' : r[h]; }); }));
  sh.getRange(1, 1, values.length, headers.length).setValues(values);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  return sh;
}

function basculeAnnee_(session, body) {
  requireAdmin_(session);
  var year = Number(body.year);
  var current = new Date().getFullYear();
  if (!year || year < 2017 || year >= current) throw apiError_('VALIDATION_FAILED', 'Seuls les exercices clos (2017–' + (current - 1) + ') se basculent.');
  if (!body.journal || body.journal.name !== 'Journal_AKUU_' + year + '.xlsx') {
    throw apiError_('VALIDATION_FAILED', 'Journal ' + year + ' manquant.');
  }
  var files = body.files || [];
  if (files.length > 20) throw apiError_('VALIDATION_FAILED', 'Trop de fichiers.');
  // Tout contrôler avant d'écrire quoi que ce soit.
  var journalBlob = basculeBlob_(body.journal);
  var blobs = files.map(basculeBlob_);

  var yearFolder = getYearFolder_(year);
  var kept = basculeKeepAgVersion_(yearFolder, year);

  // Journal Excel corrigé + Google Sheet (l'ancien Google Sheet éventuel part à la corbeille).
  basculeReplaceFile_(yearFolder, journalBlob.copyBlob().setName('Journal_AKUU_' + year + '.xlsx'));
  var previous = journalSheetId_(year);
  var ss = basculeConvertJournal_(journalBlob, yearFolder, year);
  JOURNAL_TABS.forEach(function (tab) {
    var sh = journalTabSheet_(ss, tab) || ss.insertSheet(tab);
    if (sh.getLastRow() === 0) sh.appendRow(JOURNAL_COLUMNS);
    sh.setFrozenRows(1);
  });
  if (previous && previous !== ss.getId()) {
    try { DriveApp.getFileById(previous).setTrashed(true); } catch (e) { /* déjà supprimé */ }
  }
  PropertiesService.getScriptProperties().setProperty('JOURNAL_SHEET_' + year, ss.getId());

  // Soldes mensuels des relevés (rapprochement depuis le journal).
  var releves = (body.releves || []).slice(0, 13).map(function (r) {
    return { mois: String(r.mois || '').substring(0, 7), date_fin: String(r.date_fin || '').substring(0, 10),
      solde_debut: num_(r.solde_debut), solde_fin: num_(r.solde_fin), operations_ajoutees: '', operations_ignorees: '',
      fichier: safeFileName_(r.fichier, ''), url: '', importe_le: new Date().toISOString(), importe_par: 'bascule ' + session.email };
  });
  basculeWriteTab_(ss, 'Releves', RELEVES_HEADERS, releves);

  // Statut de l'exercice : clos, version 1 (la réouverture fera passer en v2).
  basculeWriteTab_(ss, 'Cloture', CLOTURE_TAB_HEADERS, [
    { cle: 'statut', valeur: 'clos' },
    { cle: 'version', valeur: 1 },
    { cle: 'approuve_en_ag', valeur: 'oui' },
    { cle: 'bascule_le', valeur: new Date().toISOString() },
    { cle: 'bascule_par', valeur: session.email },
    { cle: 'note', valeur: 'Comptes clos. Toute modification passe par une réouverture (motif obligatoire) puis une reclôture.' }
  ]);

  // Dossier de clôture et registre à jour.
  var cloture = getOrCreateChild_(yearFolder, 'Cloture');
  var stored = blobs.map(function (b) {
    var target = /^Registre_Depenses_/.test(b.getName()) ? yearFolder : cloture;
    basculeReplaceFile_(target, b);
    return b.getName();
  });

  SpreadsheetApp.flush();
  protectYearJournal_(year);
  var totals = getComptaAnnee_(session, year);
  var lignes = tabRows_(ss.getSheetByName('Journal')).rows.length;
  appendAudit_(session.email, 'bascule_annee', 'journal', String(year),
    { url: ss.getUrl(), lignes: lignes, fichiers: stored.length, version_ag_conservee: kept });
  return {
    year: year, url: ss.getUrl(), lignes: lignes, fichiers: stored, version_ag_conservee: kept,
    produits_eur: totals.produits_eur, charges_eur: totals.charges_eur, resultat_eur: totals.resultat_eur
  };
}
