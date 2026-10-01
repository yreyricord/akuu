/**
 * Diagnostic du dépôt de relevé archivé (Bilan → « Déposer le relevé PDF »).
 * À lancer depuis l'éditeur : sélectionner diagnosticDepotReleve puis ▶ Exécuter.
 * Rejoue chaque étape du dépôt avec un petit PDF de test (2017, mois 9), affiche
 * l'étape qui échoue, puis supprime tout ce qu'il a créé (fichier + ligne).
 */
function diagnosticDepotReleve() {
  var year = 2017, month = 9, fileName = '2017_09_RELEVE_PRO_AKUU_TEST_DIAGNOSTIC.pdf';
  var created = null, rowId = null;
  function step(name, fn) {
    try {
      var r = fn();
      Logger.log('✅ ' + name);
      return r;
    } catch (e) {
      Logger.log('❌ ' + name + ' → ' + (e && e.message) + (e && e.code ? ' [' + e.code + ']' : ''));
      Logger.log(String(e && e.stack || e));
      throw e;
    }
  }
  try {
    step('1. Constantes chargées (Releves.gs, Security.gs)', function () {
      if (typeof RELEVES_ARCHIVES_HEADERS === 'undefined') throw new Error('RELEVES_ARCHIVES_HEADERS absent : Releves.gs non à jour');
      if (typeof MAX_UPLOAD_BYTES === 'undefined') throw new Error('MAX_UPLOAD_BYTES absent : Security.gs non à jour');
    });
    var b64 = Utilities.base64Encode(Utilities.newBlob('%PDF-1.4\n%diagnostic AKUU\n').getBytes());
    var blob = step('2. Contrôle du fichier PDF (checkedBlob_)', function () {
      return checkedBlob_({ base64: b64, name: fileName }, fileName, ['pdf']);
    });
    var folder = step('3. Dossier Drive 3_Trésorerie/2017/Documents/Releves_bancaires', function () {
      var f = getYearDocumentsSubfolder_(year, 'Releves_bancaires');
      Logger.log('   dossier : ' + f.getUrl());
      return f;
    });
    created = step('4. Création du fichier sur le Drive', function () { return folder.createFile(blob); });
    var sheet = step('5. Onglet RelevesArchives', function () { return relevesArchivesSheet_(); });
    step('6. Lecture de l\'onglet', function () { return sheet.getDataRange().getValues(); });
    rowId = uuid_();
    step('7. Écriture de la ligne', function () {
      appendRow_('RelevesArchives', { id: rowId, year: year, month: month, file_name: fileName,
        drive_file_id: created.getId(), url: created.getUrl(), uploaded_at: new Date().toISOString(),
        uploaded_by: 'diagnostic', status: 'test' }, RELEVES_ARCHIVES_HEADERS);
    });
    step('8. Journal d\'audit', function () {
      appendAudit_('diagnostic', 'releve_archive_diagnostic', 'releve', year + '-09', { file: fileName });
    });
    Logger.log('🎉 Toutes les étapes passent : le problème vient du déploiement (version web non mise à jour).');
  } finally {
    try { if (created) created.setTrashed(true); } catch (e) { /* ignore */ }
    try {
      if (rowId) {
        var sh = getSheet_('RelevesArchives'), data = sh.getDataRange().getValues();
        for (var i = data.length - 1; i >= 1; i--) if (data[i][0] === rowId) sh.deleteRow(i + 1);
      }
    } catch (e) { /* ignore */ }
    Logger.log('Nettoyage terminé (fichier de test à la corbeille, ligne de test supprimée).');
  }
}


/**
 * Vérifie que chaque fichier .gs du projet Google est à jour (fonctions récentes présentes).
 * À lancer depuis l'éditeur : diagnosticFichiers puis ▶ Exécuter.
 */
/**
 * Test génération Cloture pour une année (éditeur Apps Script → Exécuter).
 * Affiche l'erreur exacte dans Journal d'exécution si échec.
 */
/** Liste les propriétés JOURNAL_SHEET_YYYY (éditeur Apps Script). */
function diagnosticJournaux() {
  var current = new Date().getFullYear();
  var rows = [];
  for (var y = 2017; y <= current; y++) {
    var id = PropertiesService.getScriptProperties().getProperty('JOURNAL_SHEET_' + y);
    rows.push({ year: y, sheet_id: id || null, ok: Boolean(id) });
    Logger.log(y + ' → ' + (id || 'ABSENT'));
  }
  return { rows: rows, ok: rows.every(function (r) { return r.ok; }) };
}

function diagnosticGenererCloture(year) {
  year = Number(year) || 2017;
  var session = { email: Session.getEffectiveUser().getEmail() || 'diagnostic', role: 'admin' };
  var r = genererClotureAnnee_({ email: session.email, role: 'tresorier' }, { year: year, force: true });
  Logger.log(JSON.stringify(r, null, 2));
  return r;
}

/**
 * Connexion / tableur — à lancer depuis l'éditeur Apps Script (▶ Exécuter).
 * Affiche dans « Exécutions » la cause si login renvoie « Erreur interne ».
 */
function diagnosticConnexion() {
  var out = { ok: true, checks: [] };
  var requiredFiles = [
    ['Config.gs', function () { return typeof getJwtSecret_ === 'function'; }],
    ['UserProfile.gs', function () { return typeof normalizeUserProfile_ === 'function'; }],
    ['SheetsRepo.gs', function () { return typeof getSpreadsheet_ === 'function'; }],
    ['Security.gs', function () { return typeof assertLoginAllowed_ === 'function'; }],
    ['Auth.gs', function () { return typeof authLogin_ === 'function'; }],
    ['App.gs', function () { return typeof handleRequest === 'function'; }]
  ];
  requiredFiles.forEach(function (entry) {
    var label = entry[0];
    if (!entry[1]()) {
      out.ok = false;
      out.checks.push({ name: label, ok: false, detail: 'Fichier absent — copiez-le depuis docs/admin-tresorerie/apps-script/' + label });
      Logger.log('❌ ' + label + ' — manquant dans le projet Apps Script');
    } else {
      Logger.log('✅ ' + label);
    }
  });
  if (!out.ok) {
    Logger.log('➡️ Copiez tous les .gs du Mac (voir liste ci-dessous dans le chat / GUIDE), puis relancez diagnosticConnexion');
    return out;
  }
  function check(name, fn) {
    try {
      var detail = fn();
      out.checks.push({ name: name, ok: true, detail: detail || "OK" });
      Logger.log("✅ " + name + (detail ? " — " + detail : ""));
    } catch (e) {
      out.ok = false;
      var msg = (e && e.message) || String(e);
      var code = e && e.code;
      out.checks.push({ name: name, ok: false, code: code || "", detail: msg });
      Logger.log("❌ " + name + " — " + msg + (code ? " [" + code + "]" : ""));
    }
  }
  check("JWT_SECRET", function () {
    getJwtSecret_();
    return "présent";
  });
  check("ADMIN_EMAIL", function () {
    return getAdminEmail_();
  });
  check("SPREADSHEET_ID", function () {
    return getSpreadsheetId_();
  });
  check("Ouverture tableur", function () {
    invalidateSheetCache_();
    _ssCache_ = null;
    var ss = getSpreadsheet_();
    return ss.getName() + " (" + ss.getUrl() + ")";
  });
  check("Onglet Users", function () {
    var sh = getSheet_("Users");
    if (!sh) throw new Error("Onglet Users absent — exécutez setupTresorerieSheets puis setupUsersFromWhitelist");
    var n = Math.max(0, sh.getLastRow() - 1);
    return n + " compte(s)";
  });
  check("Route auth/login (mot de passe faux → INVALID_CREDENTIALS)", function () {
    try {
      authLogin_({ email: getAdminEmail_(), password: "__diagnostic_wrong__" });
      throw new Error("Le login aurait dû échouer");
    } catch (e) {
      if (e && e.code === "INVALID_CREDENTIALS") return "route auth OK";
      throw e;
    }
  });
  Logger.log(out.ok ? "🎉 diagnosticConnexion OK" : "➡️ Corrigez les ❌ ci-dessus, puis Déployer → Nouvelle version");
  return out;
}

function diagnosticFichiers() {
  var files = [
    ['App.gs', { 'safeJsonReviver_': function () { return typeof safeJsonReviver_; }, 'route_': function () { return typeof route_; } }],
    ['Auth.gs', { 'authLoginGoogle_': function () { return typeof authLoginGoogle_; }, 'requireTreasurer_': function () { return typeof requireTreasurer_; } }],
    ['Security.gs', { 'publicError_': function () { return typeof publicError_; }, 'changePassword_': function () { return typeof changePassword_; }, 'checkedBlob_': function () { return typeof checkedBlob_; }, 'withWriteLock_': function () { return typeof withWriteLock_; } }],
    ['Config.gs', { 'getYearDocumentsSubfolder_': function () { return typeof getYearDocumentsSubfolder_; } }],
    ['SheetsRepo.gs', { 'appendAudit_': function () { return typeof appendAudit_; } }],
    ['Business.gs', { 'reimburseFacture_': function () { return typeof reimburseFacture_; }, 'createDirectExpense_': function () { return typeof createDirectExpense_; } }],
    ['AccessRequests.gs', { 'ensureUserAccount_': function () { return typeof ensureUserAccount_; } }],
    ['DriveService.gs', { 'blobFromAttachment_': function () { return typeof blobFromAttachment_; } }],
    ['FileNaming.gs', { 'buildStandardFilename_': function () { return typeof buildStandardFilename_; } }],
    ['JournalAnnee.gs', { 'attachInYearJournal_': function () { return typeof attachInYearJournal_; }, 'deleteFromYearJournal_': function () { return typeof deleteFromYearJournal_; } }],
    ['ComptaAnnee.gs', { 'exportRegistreXlsx_': function () { return typeof exportRegistreXlsx_; } }],
    ['Releves.gs', { 'uploadReleveArchive_': function () { return typeof uploadReleveArchive_; }, 'markReleveArchiveSynced_': function () { return typeof markReleveArchiveSynced_; }, 'importReleve_': function () { return typeof importReleve_; } }],
    ['Corrections.gs', { 'attachInvoice_': function () { return typeof attachInvoice_; }, 'requestDeletion_': function () { return typeof requestDeletion_; } }],
    ['SiteData.gs', { 'zipArchive_': function () { return typeof zipArchive_; }, 'getSiteData_': function () { return typeof getSiteData_; } }],
    ['Setup.gs', { 'remplacerMotsDePasseCommuns': function () { return typeof remplacerMotsDePasseCommuns; }, 'rotationSecretEtMotsDePasse': function () { return typeof rotationSecretEtMotsDePasse; } }],
    ['Bascule.gs', { 'basculeAnnee_': function () { return typeof basculeAnnee_; } }],
    ['GenererCloture.gs', { 'genererClotureAnnee_': function () { return typeof genererClotureAnnee_; }, 'getFinancesPubliques_': function () { return typeof getFinancesPubliques_; }, 'verifierGenerationCloture_': function () { return typeof verifierGenerationCloture_; } }],
    ['ExerciceCloture.gs', { 'recloturerExercice_': function () { return typeof recloturerExercice_; }, 'rouvrirExercice_': function () { return typeof rouvrirExercice_; } }],
  ];
  var vars = { RELEVES_ARCHIVES_HEADERS: function () { return typeof RELEVES_ARCHIVES_HEADERS; },
    MAX_UPLOAD_BYTES: function () { return typeof MAX_UPLOAD_BYTES; } };
  var aRemplacer = [];
  files.forEach(function (entry) {
    var missing = [];
    Object.keys(entry[1]).forEach(function (n) {
      var t; try { t = entry[1][n](); } catch (e) { t = 'undefined'; }
      if (t !== 'function') missing.push(n);
    });
    if (missing.length) aRemplacer.push(entry[0]);
    Logger.log((missing.length ? '❌ ' : '✅ ') + entry[0] + (missing.length ? ' — manque : ' + missing.join(', ') : ''));
  });
  Object.keys(vars).forEach(function (n) {
    var t; try { t = vars[n](); } catch (e) { t = 'undefined'; }
    if (t === 'undefined') Logger.log('❌ variable ' + n + ' absente');
  });
  Logger.log(aRemplacer.length
    ? '➡️ Fichiers à remplacer par la version du Mac : ' + aRemplacer.join(', ') + ' — puis Déployer → Gérer les déploiements → ✏️ → Nouvelle version.'
    : '🎉 Tous les fichiers sont à jour. Pensez à publier une nouvelle version du déploiement.');
}
