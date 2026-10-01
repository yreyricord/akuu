/** Auth JWT simplifié (HMAC) + onglet Users */

function hashPassword_(password) {
  var secret = getJwtSecret_();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + secret);
  return Utilities.base64EncodeWebSafe(digest);
}

function authLogin_(body) {
  var email = String(body.email || '').toLowerCase().trim().substring(0, 200);
  var password = String(body.password || '');
  var bad = function () { return apiError_('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', 401); };
  if (!email || !password) throw bad();
  assertLoginAllowed_(email);

  // Même message pour « email inconnu » et « mauvais mot de passe » (pas d'énumération des comptes)
  var role = roleForEmail_(email);
  var userRow = role ? findUserRow_(email) : null;
  if (!role || !userRow || !passwordMatches_(password, userRow.password_hash)) {
    recordLoginFailure_(email);
    throw bad();
  }
  clearLoginFailures_(email);
  // Migration transparente vers le hachage salé (v2)
  if (String(userRow.password_hash || '').indexOf('v2$') !== 0) {
    try { setUserPasswordHash_(email, newPasswordHash_(password)); } catch (e) { /* ignore */ }
  }
  return createSessionFromUser_(email, normalizeRole_(role), userRow);
}

/** Connexion Google désactivée — e-mail + mot de passe uniquement. */
function authLoginGoogle_(body) {
  throw apiError_('DISABLED', 'Connexion Google désactivée.', 403);
}

function authLogout_(body) {
  var raw = String((body && body._token) || '');
  if (raw) CacheService.getScriptCache().remove('sess_' + raw);
  return { ok: true };
}

function createSessionFromUser_(email, role, userRow) {
  var profile = normalizeUserProfile_(userRow || {});
  if (!profile.name) profile.name = nameForEmail_(email);
  var token = Utilities.base64EncodeWebSafe(Utilities.getUuid() + Utilities.getUuid());
  var payload = JSON.stringify({
    email: email,
    role: role,
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name,
    exp: Date.now() + SESSION_TTL_SEC * 1000
  });
  CacheService.getScriptCache().put('sess_' + token, payload, SESSION_TTL_SEC);
  return {
    token: token,
    email: email,
    role: role,
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name
  };
}

function requireSession_(e, body) {
  // Jeton uniquement dans le corps POST (jamais dans l'URL : journaux, historique, Referer)
  var raw = String((body && body._token) || '');
  if (!raw || raw.length > 200) throw apiError_('UNAUTHORIZED', 'Session requise', 401);

  var cached = CacheService.getScriptCache().get('sess_' + raw);
  if (!cached) throw apiError_('UNAUTHORIZED', 'Session expirée, reconnectez-vous', 401);

  var session = JSON.parse(cached);
  if (session.exp && Date.now() > session.exp) {
    throw apiError_('UNAUTHORIZED', 'Session expirée, reconnectez-vous', 401);
  }
  // Révocation immédiate : compte retiré de la liste ou rôle changé
  var currentRole = roleForEmail_(session.email);
  if (!currentRole) {
    CacheService.getScriptCache().remove('sess_' + raw);
    throw apiError_('UNAUTHORIZED', 'Accès retiré', 401);
  }
  session.role = normalizeRole_(currentRole);
  return session;
}

function sessionProfile_(session) {
  var profile = normalizeUserProfile_(session);
  return {
    email: session.email,
    role: session.role,
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name
  };
}

function isTreasurerRole_(role) {
  var r = normalizeRole_(role);
  return r === 'tresorier' || r === 'admin';
}

function requireTreasurer_(session) {
  if (!isTreasurerRole_(session.role)) throw apiError_('FORBIDDEN', 'Rôle trésorier requis', 403);
}

function requireAdmin_(session) {
  var email = String(session.email || '').toLowerCase();
  if (normalizeRole_(session.role) !== 'admin' || email !== getAdminEmail_()) {
    throw apiError_('FORBIDDEN', 'Administrateur requis', 403);
  }
}

function findUserRow_(email) {
  var sheet = getSheet_('Users');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  var emailIdx = headers.indexOf('email');
  if (emailIdx < 0) emailIdx = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]).toLowerCase() === email) {
      var row = { row: i + 1 };
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      return normalizeUserProfile_(row);
    }
  }
  return null;
}

function updateUserRole_(email, role) {
  var sheet = getSheet_('Users');
  if (!sheet) return;
  var row = findUserRow_(email);
  if (!row) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var roleIdx = headers.indexOf('role');
  if (roleIdx < 0) roleIdx = 2;
  var normalized = typeof normalizeRole_ === 'function'
    ? normalizeRole_(role)
    : String(role || '').toLowerCase();
  sheet.getRange(row.row, roleIdx + 1).setValue(normalized);
}

function syncUserProfileInSheet_(email, profile) {
  var sheet = getSheet_('Users');
  if (!sheet) return;
  var row = findUserRow_(email);
  if (!row) return;
  profile = normalizeUserProfile_(profile);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  ['first_name', 'last_name', 'name'].forEach(function (key) {
    var col = headers.indexOf(key);
    if (col >= 0) sheet.getRange(row.row, col + 1).setValue(profile[key] || '');
  });
}
