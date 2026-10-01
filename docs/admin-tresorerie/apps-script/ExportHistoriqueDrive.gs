/**
 * Exporte la liste des fichiers du dossier historique 3_Trésorerie sur Drive.
 * À exécuter UNE FOIS après upload manuel des journaux 2017–2026.
 *
 * 1. Extensions → Apps Script → coller ce fichier
 * 2. Remplacer ROOT_FOLDER_ID si besoin (ID du dossier 3_Trésorerie uploadé)
 * 3. Exécuter exportHistoriqueDriveIndex
 * 4. Fichier drive_index.json créé dans le dossier racine + résumé dans les logs
 * 5. Télécharger drive_index.json → RELEVES/outils/drive_index.json
 * 6. python3 injecter_urls_drive.py drive_index.json
 */

var HISTORIQUE_ROOT_FOLDER_ID = '1jjSujWQnVXXP7Up3blVHShKOrBQN_lTq';

function exportHistoriqueDriveIndex() {
  var root = DriveApp.getFolderById(HISTORIQUE_ROOT_FOLDER_ID);
  var files = [];
  var folders = [];
  walkFolder_(root, '', files, folders);
  var payload = {
    exported_at: new Date().toISOString(),
    root_folder_id: HISTORIQUE_ROOT_FOLDER_ID,
    root_folder_name: root.getName(),
    file_count: files.length,
    files: files,
    folders: folders
  };
  var json = JSON.stringify(payload, null, 2);
  var old = root.getFilesByName('drive_index.json');
  while (old.hasNext()) old.next().setTrashed(true);
  root.createFile('drive_index.json', json, MimeType.PLAIN_TEXT);
  Logger.log('OK — ' + files.length + ' fichiers et ' + folders.length + ' dossiers indexés. drive_index.json créé dans « ' + root.getName() + ' ».');
  Logger.log('Téléchargez-le vers RELEVES/outils/drive_index.json puis lancez injecter_urls_drive.py');
}

function walkFolder_(folder, prefix, out, folders) {
  var subs = folder.getFolders();
  while (subs.hasNext()) {
    var sub = subs.next();
    var subPath = prefix + sub.getName();
    folders.push({ path: subPath, id: sub.getId(), url: sub.getUrl() });
    walkFolder_(sub, subPath + '/', out, folders);
  }
  var it = folder.getFiles();
  while (it.hasNext()) {
    var file = it.next();
    if (file.getName() === 'drive_index.json') continue;
    out.push({
      name: file.getName(),
      path: prefix + file.getName(),
      id: file.getId(),
      url: file.getUrl()
    });
  }
}
