/**
 * Exécuter depuis l'éditeur Apps Script (compte akuu.asso@gmail.com)
 * 1. setupTresorerieSheets   — crée / migre les onglets (sans effacer les données)
 * 2. setupDriveFolders
 * 3. setupUsersFromWhitelist
 * 4. installAllTriggers      — relances 24h + bascule 1er janvier
 *
 * Migration seule (colonnes first_name, last_name, remboursements…) :
 *   migrateTresorerieSheets()
 * Mise en forme AKUU (couleurs, colonnes, statuts) :
 *   formatTresorerieSheets()
 * Test emails (admin · devis · facture) :
 *   testEmailNotifications()
 */

function setupTresorerieSheets() {
  var year = String(new Date().getFullYear());
  var results = migrateTresorerieSheets();
  var formatted = [];
  if (typeof formatTresorerieSheets === 'function') {
    try {
      formatted = formatTresorerieSheets();
    } catch (e) {
      Logger.log('formatTresorerieSheets ignoré (non bloquant) : ' + (e && e.message || e));
    }
  }

  ensureConfigRow_('ROOT_FOLDER_ID', getRootFolderId_());
  ensureConfigRow_('SPREADSHEET_ID', getSpreadsheetId_());
  if (getFacturesFolderId_()) ensureConfigRow_('FACTURES_FOLDER_ID', getFacturesFolderId_());
  ensureYearCounters_(year);

  Logger.log('setupTresorerieSheets OK · ' + results.length + ' onglet(s) · formatés: ' + formatted.join(', '));
  return { migrated: results, formatted: formatted };
}

function setupDriveFolders() {
  var year = String(new Date().getFullYear());
  ensureYearDriveFolders_(year);
  var facturesId = getYearFacturesFolder_(year).getId();
  PropertiesService.getScriptProperties().setProperty('FACTURES_FOLDER_ID', facturesId);
  Logger.log('ROOT (3_Trésorerie)=' + getRootFolderId_());
  Logger.log('FACTURES_FOLDER_ID (' + year + '/Factures)=' + facturesId);
  Logger.log('Copiez cet ID dans .env.local VITE_TRESORERIE_DRIVE_FACTURES_ID');
}

function setupUsersFromWhitelist() {
  var wl = getWhitelist_();
  if (!wl.length) throw new Error('WHITELIST_JSON vide dans Script Properties');

  syncSheetSchema_('Users');
  var sheet = getSheet_('Users');

  wl.forEach(function (u) {
    var email = String(u.email || '').toLowerCase();
    if (!email) return;
    var role = normalizeRole_(roleForEmail_(email) || u.role || 'benevole');
    var existing = findUserRow_(email);
    if (existing) {
      updateUserRole_(email, role);
      syncUserProfileInSheet_(email, normalizeUserProfile_({ name: u.name || email }));
      Logger.log('User existant · rôle synchronisé: ' + email + ' → ' + role);
      return;
    }
    var profile = normalizeUserProfile_({ name: u.name || email });
    var initialPassword = randomPassword_();
    appendRow_('Users', {
      email: email,
      password_hash: newPasswordHash_(initialPassword),
      role: role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      name: profile.name
    });
    envoyerMotDePasseProvisoire_(email, profile.first_name || profile.name, initialPassword);
    Logger.log('User créé: ' + email + ' · rôle ' + role + ' · mot de passe provisoire envoyé par email');
  });
}

function envoyerMotDePasseProvisoire_(email, prenom, pwd) {
  sendUserMail_(email, buildPasswordEmail_({ first_name: prenom, password: pwd }));
}

/**
 * Ajoute ou met à jour un trésorier (whitelist + Users + mot de passe si nouveau).
 * Exécuter depuis l'éditeur Apps Script (compte akuu.asso@gmail.com).
 */
function ensureTreasurerUser_(email, name) {
  email = String(email || '').toLowerCase().trim();
  if (!email) throw new Error('email requis');
  if (email === getAdminEmail_()) throw new Error('L\'admin principal reste admin — choisissez un autre e-mail pour le trésorier test.');
  name = String(name || email).trim();

  var props = PropertiesService.getScriptProperties();
  var wl = getWhitelist_();
  var inWl = false;
  wl.forEach(function (u) {
    if (String(u.email || '').toLowerCase() === email) {
      u.role = 'tresorier';
      u.name = name;
      inWl = true;
    }
  });
  if (!inWl) wl.push({ email: email, role: 'tresorier', name: name });
  props.setProperty('WHITELIST_JSON', JSON.stringify(wl));

  var t1 = (props.getProperty('TREASURER_1') || '').toLowerCase();
  var t2 = (props.getProperty('TREASURER_2') || '').toLowerCase();
  if (email !== t1 && (!t2 || t2 === 'tresorier2@example.com' || t2.indexOf('example.com') >= 0)) {
    props.setProperty('TREASURER_2', email);
  }

  syncSheetSchema_('Users');
  var existing = findUserRow_(email);
  if (existing) {
    updateUserRole_(email, 'tresorier');
    syncUserProfileInSheet_(email, normalizeUserProfile_({ name: name }));
    Logger.log('Trésorier mis à jour : ' + email);
    return { email: email, role: 'tresorier', created: false, password_sent: false };
  }

  var profile = normalizeUserProfile_({ name: name });
  var initialPassword = randomPassword_();
  appendRow_('Users', {
    email: email,
    password_hash: newPasswordHash_(initialPassword),
    role: 'tresorier',
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name
  });
  envoyerMotDePasseProvisoire_(email, profile.first_name || name, initialPassword);
  Logger.log('Trésorier créé : ' + email + ' · mot de passe provisoire envoyé par email');
  return { email: email, role: 'tresorier', created: true, password_sent: true };
}

/** Trésorier de test : compte Google asso (2e validateur pour vos tests). */
function setupTreasurerTestAkuuAsso() {
  return ensureTreasurerUser_('akuu.asso@gmail.com', 'Compte asso AKUU (test trésorier)');
}

/**
 * SÉCURITÉ — à exécuter une fois après la mise à jour du 01/10/2026 :
 * tous les comptes qui ont encore l'ancien mot de passe commun (INITIAL_PASSWORD) reçoivent
 * un mot de passe provisoire personnel par email. La propriété INITIAL_PASSWORD peut ensuite être supprimée.
 */
function remplacerMotsDePasseCommuns() {
  var common = getProp_('INITIAL_PASSWORD', 'ChangeMe-AKUU-2026!');
  var legacy = hashPassword_(common);
  var n = 0;
  readAll_('Users').forEach(function (u) {
    var stored = String(u.password_hash || '');
    var isCommon = stored === legacy || (stored.indexOf('v2$') === 0 && passwordMatches_(common, stored));
    if (!isCommon) return;
    var pwd = randomPassword_();
    setUserPasswordHash_(String(u.email).toLowerCase(), newPasswordHash_(pwd));
    envoyerMotDePasseProvisoire_(u.email, u.first_name || u.name, pwd);
    n++;
  });
  appendAudit_('system@akuu.asso', 'common_passwords_replaced', 'user', 'all', { count: n });
  Logger.log(n + ' compte(s) avec le mot de passe commun : nouveau mot de passe provisoire envoyé par email.');
}

/** Helpers locaux — syncUserRolesFromConfig fonctionne même si Config.gs n'est pas à jour */
function syncRoleNorm_(role) {
  var r = String(role || '').toLowerCase();
  if (r === 'treasurer') return 'tresorier';
  if (r === 'member') return 'benevole';
  return r;
}

function syncRoleForEmail_(email) {
  var props = PropertiesService.getScriptProperties();
  var e = String(email || '').toLowerCase();
  var admin = (props.getProperty('ADMIN_EMAIL') || 'yoannreyricord@gmail.com').toLowerCase();
  if (e === admin) return 'admin';
  var t1 = (props.getProperty('TREASURER_1') || '').toLowerCase();
  var t2 = (props.getProperty('TREASURER_2') || '').toLowerCase();
  if (t1 && e === t1) return 'tresorier';
  if (t2 && e === t2) return 'tresorier';
  try {
    var wl = JSON.parse(props.getProperty('WHITELIST_JSON') || '[]');
    for (var i = 0; i < wl.length; i++) {
      if (String(wl[i].email || '').toLowerCase() === e) {
        return syncRoleNorm_(wl[i].role || 'benevole');
      }
    }
  } catch (err) {}
  return null;
}

function getUsersSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID') || '1VHVisgWvALpvj6xTc5xW7XQ3qihIui6YHYDW00fa-6o';
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName('Users');
  if (!sheet) throw new Error('Onglet Users manquant — exécutez setupTresorerieSheets');
  return sheet;
}

/** Corrige uniquement la ligne admin (Yoann) — exécutable sans Config.gs */
function fixAdminUserRole() {
  syncSheetSchema_('Users');
  var props = PropertiesService.getScriptProperties();
  var adminEmail = (props.getProperty('ADMIN_EMAIL') || 'yoannreyricord@gmail.com').toLowerCase();
  updateUserRole_(adminEmail, 'admin');
  var row = findUserRow_(adminEmail);
  if (!row) throw new Error('Utilisateur introuvable dans Users : ' + adminEmail);
  Logger.log('fixAdminUserRole OK · ' + adminEmail + ' → admin (ligne ' + row.row + ')');
  return { email: adminEmail, role: 'admin', row: row.row };
}

/** Corrige les rôles Users selon ADMIN_EMAIL / TREASURER_* / WHITELIST */
function syncUserRolesFromConfig() {
  var props = PropertiesService.getScriptProperties();
  var sheet = getUsersSheet_();
  var data = sheet.getDataRange().getValues();
  var emailIdx = data[0].indexOf('email');
  var roleIdx = data[0].indexOf('role');
  if (emailIdx < 0) emailIdx = 0;
  if (roleIdx < 0) roleIdx = 2;
  var updated = 0;
  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][emailIdx]).toLowerCase();
    var expected = syncRoleForEmail_(email);
    if (!expected) continue;
    if (syncRoleNorm_(data[i][roleIdx]) !== expected) {
      sheet.getRange(i + 1, roleIdx + 1).setValue(expected);
      Logger.log('Corrigé: ' + email + ' → ' + expected);
      updated++;
    }
  }
  Logger.log('syncUserRolesFromConfig terminé · ' + updated + ' mise(s) à jour');
  Logger.log('ADMIN_EMAIL=' + (props.getProperty('ADMIN_EMAIL') || 'yoannreyricord@gmail.com'));
  Logger.log('TREASURER_1=' + (props.getProperty('TREASURER_1') || ''));
  return { updated: updated };
}

/**
 * Bascule annuelle · manuel ou automatique (1er janvier).
 * Idempotent : une seule exécution effective par année.
 */
function setupNewYear(yearOpt) {
  var year = yearOpt || new Date().getFullYear();
  var yearStr = String(year);
  var props = PropertiesService.getScriptProperties();
  var doneKey = 'NEW_YEAR_SETUP_' + yearStr;

  if (props.getProperty(doneKey) === 'done') {
    Logger.log('setupNewYear déjà fait pour ' + yearStr);
    return { year: year, skipped: true };
  }

  ensureYearDriveFolders_(yearStr);
  ensureYearCounters_(year);
  try { initJournalAnnee_(year); } catch (e) { Logger.log('initJournalAnnee_ : ' + e); }

  var summary =
    'Bascule comptable AKUU ' + yearStr + '\n\n' +
    '- Dossiers Drive 3_Trésorerie/' + yearStr + '/Factures et /Documents prêts\n' +
    '- Compteurs AKUU-DEM-' + yearStr + ' et AKUU-FAC-' + yearStr + ' initialisés à 0\n' +
    '- Même tableur · même Web App · aucune action requise des adhérents\n';

  notifyTreasurers_('[AKUU] Nouvelle année comptable ' + yearStr, summary);
  appendAudit_('system@akuu.asso', 'new_year_setup', 'config', yearStr, { year: year });

  props.setProperty(doneKey, 'done');
  Logger.log('setupNewYear OK pour ' + yearStr);
  return { year: year, skipped: false };
}

/** Appelé par le trigger · actif uniquement en janvier */
function setupNewYearScheduled() {
  var now = new Date();
  if (now.getMonth() !== 0) return;
  setupNewYear(now.getFullYear());
}

function ensureYearDriveFolders_(yearStr) {
  getYearFacturesFolder_(yearStr);
  getYearDocumentsSubfolder_(yearStr, 'Releves_bancaires');
  getYearDocumentsSubfolder_(yearStr, 'Devis');
}

function getOrCreateSubfolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function ensureYearCounters_(year) {
  ensureConfigRow_('DEM_COUNTER_' + year, 0);
  ensureConfigRow_('FAC_COUNTER_' + year, 0);
}

function getConfigValue_(key) {
  var sheet = getSheet_('Config');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function ensureConfigRow_(key, value) {
  if (getConfigValue_(key) !== null && getConfigValue_(key) !== '') return;
  var sheet = getSheet_('Config');
  if (!sheet) return;
  sheet.appendRow([key, value]);
}

function installNewYearTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'setupNewYearScheduled') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('setupNewYearScheduled')
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .inTimezone('Europe/Paris')
    .create();
  Logger.log('Trigger nouvelle année installé (1er janvier · Europe/Paris)');
}

/** Relances 24h + bascule annuelle */
function installAllTriggers() {
  installReminderTrigger();
  installNewYearTrigger();
  Logger.log('Triggers installés : relances 24h + nouvelle année');
}

/**
 * Admin : renvoie un mot de passe provisoire (éditeur Apps Script uniquement).
 * Envoi synchrone + affichage dans le journal d'exécution.
 */
function renvoyerMotDePasseAdmin(emailOpt) {
  var email = String(emailOpt || getAdminEmail_()).toLowerCase().trim();
  var row = findUserRow_(email);
  if (!row) throw new Error('Compte introuvable dans Users : ' + email);
  var pwd = randomPassword_();
  setUserPasswordHash_(email, newPasswordHash_(pwd));
  clearLoginFailures_(email);
  sendMailContent_(email, buildPasswordEmail_({
    first_name: row.first_name || row.name || email,
    password: pwd
  }));
  Logger.log('Mot de passe provisoire envoyé à ' + email + ' · copie journal : ' + pwd);
  return { email: email, password_sent: true };
}

/** Menu test après déploiement */
function testExchangeRate() {
  Logger.log(JSON.stringify(getExchangeRate_()));
}

/** Test manuel bascule (ex. setupNewYear(2027)) */
function testSetupNewYear() {
  Logger.log(JSON.stringify(setupNewYear(new Date().getFullYear())));
}

/**
 * SÉCURITÉ — si JWT_SECRET a pu être vu (copie d'écran, message, dépôt de code) :
 * génère un nouveau secret et envoie à CHAQUE compte un nouveau mot de passe provisoire personnel.
 * Toutes les sessions en cours sont coupées.
 */
function rotationSecretEtMotsDePasse() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('JWT_SECRET', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  var n = 0;
  readAll_('Users').forEach(function (u) {
    var email = String(u.email || '').toLowerCase();
    if (!email || !roleForEmail_(email)) return;
    var pwd = randomPassword_();
    setUserPasswordHash_(email, newPasswordHash_(pwd));
    envoyerMotDePasseProvisoire_(email, u.first_name || u.name, pwd);
    n++;
  });
  props.deleteProperty('INITIAL_PASSWORD');
  appendAudit_('system@akuu.asso', 'secret_rotated', 'config', 'JWT_SECRET', { users: n });
  Logger.log('Nouveau secret en place · ' + n + ' mot(s) de passe provisoire(s) envoyé(s) par email.');
}
