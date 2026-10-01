/**
 * Durcissement sécurité (01/10/2026) — voir RELEVES/outils/RAPPORT_SECURITE_REDTEAM.md
 *  - fichiers envoyés : taille, type réel (octets magiques), nom nettoyé
 *  - limitation des tentatives de connexion
 *  - mots de passe salés + étirés (format v2), migration transparente
 *  - vérification id_token Google
 *  - verrou d'écriture (références uniques, pas de double validation)
 */

var MAX_UPLOAD_BYTES = 10 * 1024 * 1024;           // 10 Mo par fichier
var MAX_ATTACHMENTS = 6;                             // par requête
var LOGIN_MAX_FAILS = 5;                             // puis blocage
var LOGIN_LOCK_SEC = 15 * 60;                        // 15 min
var PASSWORD_MIN_LENGTH = 10;
var HASH_ROUNDS = 500;

var MAGIC_ = [
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },          // %PDF
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47] }
];

/** Nom de fichier sûr (pas de chemin, pas de caractères de contrôle). */
function safeFileName_(name, fallback) {
  var s = String(name || fallback || 'fichier').split(/[\\/]/).pop();
  s = s.replace(/[\u0000-\u001f<>:"|?*]/g, '').replace(/\.\.+/g, '.').trim();
  return (s || fallback || 'fichier').substring(0, 120);
}

/**
 * Pièce jointe {name, type, base64} → Blob contrôlé, ou null si absente.
 * allowed : liste d'extensions acceptées (défaut pdf, jpg, png). Lève une erreur claire sinon.
 */
function checkedBlob_(att, defaultName, allowed) {
  if (!att || !att.base64) return null;
  allowed = allowed || ['pdf', 'jpg', 'png'];
  var b64 = String(att.base64);
  if (b64.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 16) {
    throw apiError_('FILE_TOO_LARGE', 'Fichier trop lourd (10 Mo maximum). Réduisez-le ou scannez en qualité moyenne.', 413);
  }
  var bytes;
  try { bytes = Utilities.base64Decode(b64); } catch (e) {
    throw apiError_('INVALID_FILE', 'Fichier illisible. Réessayez avec un PDF, JPG ou PNG.');
  }
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) {
    throw apiError_('FILE_TOO_LARGE', 'Fichier vide ou trop lourd (10 Mo maximum).', 413);
  }
  var kind = null;
  for (var i = 0; i < MAGIC_.length && !kind; i++) {
    var m = MAGIC_[i], ok = true;
    for (var j = 0; j < m.bytes.length; j++) {
      if (((bytes[j] + 256) % 256) !== m.bytes[j]) { ok = false; break; }
    }
    if (ok) kind = m;
  }
  if (!kind || allowed.indexOf(kind.ext) < 0) {
    throw apiError_('INVALID_FILE_TYPE', 'Type de fichier refusé. Envoyez un ' + allowed.join(', ').toUpperCase() + '.');
  }
  var base = safeFileName_(att.name, defaultName).replace(/\.[a-z0-9]{1,5}$/i, '');
  return Utilities.newBlob(bytes, kind.mime, base + '.' + kind.ext);
}

function checkAttachmentCount_(list) {
  if ((list || []).length > MAX_ATTACHMENTS) {
    throw apiError_('TOO_MANY_FILES', 'Trop de fichiers (' + MAX_ATTACHMENTS + ' maximum).');
  }
}

// --------------------------------------------------------------------------- connexion

function loginKey_(email) { return 'login_fail_' + String(email || '').toLowerCase(); }

function assertLoginAllowed_(email) {
  var n = Number(CacheService.getScriptCache().get(loginKey_(email)) || 0);
  if (n >= LOGIN_MAX_FAILS) {
    throw apiError_('TOO_MANY_ATTEMPTS', 'Trop de tentatives. Réessayez dans 15 minutes.', 429);
  }
}

function recordLoginFailure_(email) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(loginKey_(email)) || 0) + 1;
  cache.put(loginKey_(email), String(n), LOGIN_LOCK_SEC);
  if (n === LOGIN_MAX_FAILS) {
    try { appendAudit_(email, 'login_locked', 'user', email, { fails: n }); } catch (e) { /* ignore */ }
  }
}

function clearLoginFailures_(email) {
  CacheService.getScriptCache().remove(loginKey_(email));
}

// --------------------------------------------------------------------------- mots de passe

function hashPasswordV2_(password, salt) {
  var secret = getJwtSecret_();
  var h = Utilities.computeHmacSha256Signature(password, salt + secret);
  for (var i = 0; i < HASH_ROUNDS; i++) {
    h = Utilities.computeHmacSha256Signature(h, Utilities.newBlob(salt + secret).getBytes());
  }
  return 'v2$' + salt + '$' + Utilities.base64EncodeWebSafe(h);
}

function newPasswordHash_(password) {
  var salt = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  return hashPasswordV2_(password, salt);
}

/** Vérifie un mot de passe (formats v2 et ancien). */
function passwordMatches_(password, stored) {
  stored = String(stored || '');
  if (stored.indexOf('v2$') === 0) {
    var salt = stored.split('$')[1];
    return constantTimeEquals_(hashPasswordV2_(password, salt), stored);
  }
  return constantTimeEquals_(hashPassword_(password), stored);
}

function constantTimeEquals_(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function setUserPasswordHash_(email, hash) {
  var sheet = getSheet_('Users');
  var row = findUserRow_(email);
  if (!sheet || !row) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = headers.indexOf('password_hash');
  sheet.getRange(row.row, (idx >= 0 ? idx : 1) + 1).setValue(hash);
}

/** Mot de passe provisoire aléatoire (un par compte, jamais partagé). */
function randomPassword_() {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var out = '';
  var raw = Utilities.getUuid() + Utilities.getUuid();
  for (var i = 0; out.length < 14; i++) {
    out += alphabet.charAt(raw.charCodeAt(i % raw.length) * (i + 7) % alphabet.length);
  }
  return out.substring(0, 7) + '-' + out.substring(7);
}

function changePassword_(session, body) {
  var current = String(body.current_password || '');
  var next = String(body.new_password || '');
  if (next.length < PASSWORD_MIN_LENGTH) {
    throw apiError_('WEAK_PASSWORD', 'Le nouveau mot de passe doit faire au moins ' + PASSWORD_MIN_LENGTH + ' caractères.');
  }
  var user = findUserRow_(session.email);
  if (!user || !passwordMatches_(current, user.password_hash)) {
    throw apiError_('INVALID_CREDENTIALS', 'Mot de passe actuel incorrect');
  }
  setUserPasswordHash_(session.email, newPasswordHash_(next));
  appendAudit_(session.email, 'password_changed', 'user', session.email, {});
  return { ok: true };
}

// --------------------------------------------------------------------------- Google

/** Vérifie un id_token Google (signature vérifiée par Google, audience, email vérifié). */
function verifyGoogleIdToken_(idToken) {
  var clientId = getProp_('GOOGLE_CLIENT_ID', '');
  if (!clientId) throw apiError_('GOOGLE_LOGIN_DISABLED', 'Connexion Google non activée', 403);
  if (!idToken) throw apiError_('INVALID_CREDENTIALS', 'Connexion Google invalide', 401);
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw apiError_('INVALID_CREDENTIALS', 'Connexion Google invalide', 401);
  var info = JSON.parse(res.getContentText());
  var issOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  if (!issOk || info.aud !== clientId || String(info.email_verified) !== 'true' || Number(info.exp) * 1000 < Date.now()) {
    throw apiError_('INVALID_CREDENTIALS', 'Connexion Google invalide', 401);
  }
  return String(info.email).toLowerCase();
}

// --------------------------------------------------------------------------- erreurs & verrou

/** Message renvoyé au navigateur : erreurs métier telles quelles, erreurs internes masquées. */
function publicError_(err) {
  if (err && err.code) return { code: err.code, message: err.message };
  try { Logger.log('Erreur interne : ' + (err && err.stack || err)); } catch (e) { /* ignore */ }
  return { code: 'INTERNAL_ERROR', message: 'Erreur interne. Réessayez ; si le problème persiste, contactez l\'administrateur.' };
}

/** Écritures qui ne touchent que le journal d'exercice (pas Demandes/Factures). */
function needsTresorerieWriteLock_(path) {
  if (!path) return true;
  if (path === 'releves/import') return false;
  if (path === 'bascule') return false;
  if (path.indexOf('exercice/') === 0) return false;
  if (path.indexOf('corrections/sync-modes') === 0) return false;
  return true;
}

function withWriteLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw apiError_('BUSY', 'Serveur occupé, réessayez dans quelques secondes.', 503);
  try { return fn(); } finally { lock.releaseLock(); }
}
