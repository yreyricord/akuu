/** Upload fichiers Drive (factures · devis) */

function getOrCreateYearFolder_(parentId, year) {
  var parent = DriveApp.getFolderById(parentId);
  var it = parent.getFoldersByName(String(year));
  if (it.hasNext()) return it.next();
  return parent.createFolder(String(year));
}

function uploadFactureFile_(blob, meta) {
  var year = (meta && meta.year) || new Date().getFullYear();
  var yearFolder = getYearFacturesFolder_(year);
  var name = safeFileName_(meta.fileName || blob.getName(), 'facture.pdf');
  // L'extension suit le contenu réel (un JPG n'est jamais nommé .pdf)
  var realExt = (blob.getName().match(/\.([a-z0-9]+)$/i) || [])[1];
  if (realExt) name = name.replace(/\.[a-z0-9]{1,5}$/i, '') + '.' + realExt.toLowerCase();
  var file = yearFolder.createFile(blob.setName(name));
  return {
    drive_file_id: file.getId(),
    drive_file_url: file.getUrl(),
    file_name: name
  };
}

function uploadDevisFiles_(attachments, demandReference) {
  var devisFolder = getYearDocumentsSubfolder_(new Date().getFullYear(), 'Devis');

  var out = [];
  checkAttachmentCount_(attachments);
  (attachments || []).forEach(function (att, idx) {
    if (!att || !att.base64) return;
    var blob = checkedBlob_(att, 'devis-' + (idx + 1));
    var fname = demandReference + '_' + blob.getName();
    var file = devisFolder.createFile(blob.setName(fname));
    out.push({ name: file.getName(), drive_file_id: file.getId(), drive_file_url: file.getUrl() });
  });
  return out;
}

function blobFromAttachment_(att, defaultName, allowed) {
  return checkedBlob_(att, defaultName, allowed);
}

/** Extension fichier justificatif (client convertit les images en PDF). */
function extensionFromAttachment_(att) {
  if (!att) return 'pdf';
  if (att.type === 'application/pdf') return 'pdf';
  var name = att.name || '';
  var ext = name.indexOf('.') >= 0 ? name.split('.').pop().toLowerCase() : '';
  if (ext === 'pdf') return 'pdf';
  return 'pdf';
}
