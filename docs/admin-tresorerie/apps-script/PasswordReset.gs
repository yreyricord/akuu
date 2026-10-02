/**
 * Réinitialisation mot de passe — lien à usage unique par email.
 * Routes publiques : auth/forgot-password · auth/reset-password
 */

var PASSWORD_RESET_TTL_SEC_ = 30 * 60;
var PASSWORD_RESET_MAX_PER_EMAIL_HOUR_ = 3;

function forgotPasswordRequestKey_(email) {
  return 'pwd_rst_req_' + String(email || '').toLowerCase();
}

/** Toujours la même réponse (pas d'énumération des comptes). */
function passwordResetGenericResponse_() {
  return {
    ok: true,
    message: 'Si un compte existe pour cette adresse, un email de réinitialisation vient d\'être envoyé. Pensez à vérifier vos spams.'
  };
}

function authForgotPassword_(body) {
  assertPublicRateLimit_('pwd_reset_global', 40);
  var email = String(body.email || '').toLowerCase().trim().substring(0, 200);
  var generic = passwordResetGenericResponse_();
  if (!email || email.indexOf('@') < 1) return generic;

  var cache = CacheService.getScriptCache();
  var reqKey = forgotPasswordRequestKey_(email);
  var n = Number(cache.get(reqKey) || 0) + 1;
  cache.put(reqKey, String(n), 3600);
  if (n > PASSWORD_RESET_MAX_PER_EMAIL_HOUR_) return generic;

  var role = roleForEmail_(email);
  var userRow = role ? findUserRow_(email) : null;
  if (!role || !userRow) {
    Utilities.sleep(250 + Math.floor(Math.random() * 350));
    return generic;
  }

  var token = Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + Utilities.getUuid() + getJwtSecret_() + String(Date.now())
  )).replace(/=+$/, '');

  cache.put('pwd_rst_' + token, JSON.stringify({
    email: email,
    exp: Date.now() + PASSWORD_RESET_TTL_SEC_ * 1000
  }), PASSWORD_RESET_TTL_SEC_);

  var profile = normalizeUserProfile_(userRow);
  var resetUrl = getSiteUrl_() + '/admin/reset-password?token=' + encodeURIComponent(token);
  var content = buildPasswordResetEmail_({
    first_name: profile.first_name || profile.name || email,
    reset_url: resetUrl,
    expires_minutes: Math.round(PASSWORD_RESET_TTL_SEC_ / 60)
  });

  // Envoi synchrone : chemin critique (évite la file EmailQueue).
  sendMailContent_(email, content);

  try { appendAudit_(email, 'password_reset_requested', 'user', email, {}); } catch (e) { /* ignore */ }

  return generic;
}

function authResetPassword_(body) {
  assertPublicRateLimit_('pwd_reset_confirm', 25);
  var token = String(body.token || '').trim();
  var newPwd = String(body.new_password || '');
  if (!token || token.length > 256) {
    throw apiError_('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.', 400);
  }
  if (newPwd.length < PASSWORD_MIN_LENGTH) {
    throw apiError_('WEAK_PASSWORD', 'Le mot de passe doit faire au moins ' + PASSWORD_MIN_LENGTH + ' caractères.', 400);
  }

  var cache = CacheService.getScriptCache();
  var key = 'pwd_rst_' + token;
  var raw = cache.get(key);
  if (!raw) throw apiError_('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.', 400);

  var data;
  try { data = JSON.parse(raw); } catch (e) {
    cache.remove(key);
    throw apiError_('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.', 400);
  }

  if (data.exp && Date.now() > data.exp) {
    cache.remove(key);
    throw apiError_('INVALID_TOKEN', 'Ce lien a expiré. Demandez un nouveau lien.', 400);
  }

  var email = String(data.email || '').toLowerCase();
  if (!email || !roleForEmail_(email) || !findUserRow_(email)) {
    cache.remove(key);
    throw apiError_('INVALID_TOKEN', 'Lien invalide ou expiré. Demandez un nouveau lien.', 400);
  }

  setUserPasswordHash_(email, newPasswordHash_(newPwd));
  cache.remove(key);
  clearLoginFailures_(email);

  try { appendAudit_(email, 'password_reset_completed', 'user', email, {}); } catch (e) { /* ignore */ }

  return {
    ok: true,
    message: 'Mot de passe mis à jour. Vous pouvez vous connecter.'
  };
}
