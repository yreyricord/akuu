/**
 * Données et fichiers PRIVÉS du site (réservés aux trésoriers) — 01/10/2026.
 *
 * Avant : relevés, journaux, registres et le détail des écritures étaient copiés dans le site public
 * (akuu/public/downloads, src/data/*.json) → lisibles par n'importe qui connaissant l'adresse.
 * Maintenant : ils restent sur le Drive (3_Trésorerie) et ne sont servis qu'à un trésorier connecté.
 */

/** Exports JSON statiques retirés — source unique : Google Sheets (journal-annee). */
var SITE_DATA_NAMES_ = [];
var SITE_DATA_MAX_BYTES = 5 * 1024 * 1024;
var ARCHIVE_PATH_RE_ = /^20\d\d\/(Journal_AKUU_20\d\d\.xlsx|Registre_Depenses_20\d\d\.xlsx|Bilan_Comptable_20\d\d\.xlsx|Cloture\/[A-Za-z0-9_.-]+\.(pdf|xlsx|zip|json|md)|Documents\/Releves_bancaires\/[A-Za-z0-9_.-]+\.pdf|Factures\/[^\/]+\.(pdf|jpg|jpeg|png))$/;

function privateSiteFolder_() {
  return getOrCreateChild_(DriveApp.getFolderById(getRootFolderId_()), '_site_prive');
}

/** Dépôt d'un fichier de données (script local publier_donnees_privees.py). */
function uploadSiteData_(session, body) {
  requireTreasurer_(session);
  var name = String(body.name || '');
  if (SITE_DATA_NAMES_.indexOf(name) < 0) throw apiError_('VALIDATION_FAILED', 'Nom de données inconnu');
  var content = String(body.content || '');
  if (!content || content.length > SITE_DATA_MAX_BYTES) throw apiError_('FILE_TOO_LARGE', 'Contenu vide ou trop gros');
  JSON.parse(content);   // doit être du JSON valide
  var folder = privateSiteFolder_();
  var old = folder.getFilesByName(name);
  while (old.hasNext()) old.next().setTrashed(true);
  folder.createFile(name, content, 'application/json');
  appendAudit_(session.email, 'site_data_published', 'site_data', name, { bytes: content.length });
  return { name: name, bytes: content.length };
}

function getSiteData_(session, name) {
  requireTreasurer_(session);
  if (SITE_DATA_NAMES_.indexOf(String(name)) < 0) throw apiError_('VALIDATION_FAILED', 'Nom de données inconnu');
  var it = privateSiteFolder_().getFilesByName(String(name));
  if (!it.hasNext()) return null;
  return JSON.parse(it.next().getBlob().getDataAsString('UTF-8'));
}

function fileByArchivePath_(path) {
  path = String(path || '');
  if (!ARCHIVE_PATH_RE_.test(path) || path.indexOf('..') >= 0) throw apiError_('FORBIDDEN', 'Fichier non autorisé', 403);
  var parts = path.split('/');
  var folder = DriveApp.getFolderById(getRootFolderId_());
  for (var i = 0; i < parts.length - 1; i++) {
    var it = folder.getFoldersByName(parts[i]);
    if (!it.hasNext()) throw apiError_('NOT_FOUND', 'Fichier introuvable sur le Drive', 404);
    folder = it.next();
  }
  var files = folder.getFilesByName(parts[parts.length - 1]);
  if (!files.hasNext()) throw apiError_('NOT_FOUND', 'Fichier introuvable sur le Drive', 404);
  return files.next();
}

/** Téléchargement d'un fichier d'archive (journal, registre, clôture, relevé, facture). */
function downloadArchiveFile_(session, body) {
  requireTreasurer_(session);
  var f = fileByArchivePath_(body.path);
  var blob = f.getBlob();
  if (blob.getBytes().length > 25 * 1024 * 1024) throw apiError_('FILE_TOO_LARGE', 'Fichier trop gros pour le téléchargement direct : ouvrez-le sur le Drive.');
  return { file_name: f.getName(), mime: blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
}

/** ZIP à la demande : relevés d'une année, ou dossier complet (journaux, registres, clôtures, relevés) de toutes les années. */
function zipArchive_(session, body) {
  requireTreasurer_(session);
  var root = DriveApp.getFolderById(getRootFolderId_());
  var blobs = [];
  var add = function (folder, prefix, filter) {
    var it = folder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (!filter || filter(f.getName())) blobs.push(f.getBlob().setName(prefix + f.getName()));
    }
  };
  var sub = function (folder, name) { var it = folder.getFoldersByName(name); return it.hasNext() ? it.next() : null; };
  var years = [];
  if (body.kind === 'releves') years = [String(Number(body.year))];
  else if (body.kind === 'tout') { for (var y = 2017; y <= new Date().getFullYear(); y++) years.push(String(y)); }
  else throw apiError_('VALIDATION_FAILED', 'Type de ZIP inconnu');
  years.forEach(function (y) {
    var yf = sub(root, y);
    if (!yf) return;
    var docs = sub(yf, 'Documents');
    var rel = docs && sub(docs, 'Releves_bancaires');
    if (rel) add(rel, body.kind === 'tout' ? y + '/Releves_bancaires/' : '', function (n) { return /\.pdf$/i.test(n); });
    if (body.kind === 'tout') {
      add(yf, y + '/', function (n) { return /^(Journal_AKUU|Registre_Depenses)_\d{4}\.xlsx$/.test(n); });
      var clo = sub(yf, 'Cloture');
      if (clo) add(clo, y + '/Cloture/', function (n) { return /^(06_Synthese_AG\.pdf|Pack_Cloture_\d{4}\.zip|NOTE_RESERVES_AUDIT\.md)$/.test(n); });
    }
  });
  if (!blobs.length) throw apiError_('NOT_FOUND', 'Aucun fichier à regrouper', 404);
  var name = body.kind === 'releves' ? 'Releves_bancaires_' + years[0] + '.zip' : 'AKUU_Tresorerie_2017-' + years[years.length - 1] + '.zip';
  var zip = Utilities.zip(blobs, name);
  return { file_name: name, mime: 'application/zip', base64: Utilities.base64Encode(zip.getBytes()) };
}
