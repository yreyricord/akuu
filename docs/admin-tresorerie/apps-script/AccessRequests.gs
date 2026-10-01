/** Demandes d'accès espace adhérent — validation admin uniquement */

var ACCESS_REQUEST_ROLES = ['benevole', 'tresorier'];   // le rôle admin ne se demande pas (attribué à la main)

function createAccessRequest_(body) {
  var email = String(body.email || '').toLowerCase().trim();
  var profile = profileFromAccessRequest_(body);
  var requestedRole = normalizeRole_(body.requested_role || body.requestedRole || '');
  var message = String(body.message || '').trim();

  if (!email || !profile || !profile.first_name || !profile.last_name) {
    throw apiError_('VALIDATION_FAILED', 'Prénom, nom et email requis');
  }
  if (ACCESS_REQUEST_ROLES.indexOf(requestedRole) < 0) {
    throw apiError_('VALIDATION_FAILED', 'Rôle demandé invalide');
  }
  if (roleForEmail_(email)) {
    throw apiError_('ALREADY_MEMBER', 'Cet email dispose déjà d\'un accès');
  }

  var pending = readAll_('AccessRequests').filter(function (r) {
    return String(r.email).toLowerCase() === email && r.status === 'pending';
  });
  if (pending.length) {
    throw apiError_('DUPLICATE_REQUEST', 'Une demande est déjà en cours pour cet email');
  }

  var row = {
    id: uuid_(),
    created_at: new Date().toISOString(),
    email: email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    name: profile.name,
    requested_role: requestedRole,
    message: message,
    status: 'pending',
    decided_at: '',
    decided_by: '',
    reject_reason: ''
  };
  appendRow_('AccessRequests', row);
  appendAudit_(email, 'access_request_create', 'access_request', row.id, { requested_role: requestedRole });

  notifyAdminMail_(buildAccessRequestEmail_({
    name: profile.name,
    email: email,
    requested_role: requestedRole,
    message: message
  }));

  return row;
}

function getAccessRequestsPending_(session) {
  requireAdmin_(session);
  return readAll_('AccessRequests')
    .filter(function (r) { return r.status === 'pending'; })
    .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
}

function approveAccessRequest_(session, id) {
  requireAdmin_(session);
  var req = findAccessRequest_(id);
  if (!req || req.status !== 'pending') throw apiError_('NOT_FOUND', 'Demande introuvable ou déjà traitée');

  var role = normalizeRole_(req.requested_role);
  var profile = normalizeUserProfile_(req);
  appendToWhitelist_(req.email, role, profile.name);
  var initialPassword = ensureUserAccount_(req.email, role, profile);

  updateAccessRequest_(id, {
    status: 'approved',
    decided_at: new Date().toISOString(),
    decided_by: session.email,
    reject_reason: ''
  });

  appendAudit_(session.email, 'access_request_approve', 'access_request', id, { email: req.email, role: role });

  try {
    sendUserMail_(req.email, buildAccessApprovedEmail_({
      first_name: profile.first_name,
      email: req.email,
      role: role,
      initial_password: initialPassword
    }));
  } catch (e) { /* quota */ }

  return { id: id, email: req.email, role: role, status: 'approved' };
}

function rejectAccessRequest_(session, id, reason) {
  requireAdmin_(session);
  var req = findAccessRequest_(id);
  if (!req || req.status !== 'pending') throw apiError_('NOT_FOUND', 'Demande introuvable ou déjà traitée');

  var rejectReason = String(reason || '').trim();
  if (!rejectReason) throw apiError_('VALIDATION_FAILED', 'Motif de refus obligatoire');

  updateAccessRequest_(id, {
    status: 'rejected',
    decided_at: new Date().toISOString(),
    decided_by: session.email,
    reject_reason: rejectReason
  });

  appendAudit_(session.email, 'access_request_reject', 'access_request', id, { reason: rejectReason });

  try {
    MailApp.sendEmail(
      req.email,
      '[AKUU] Demande d\'accès refusée',
      'Bonjour ' + normalizeUserProfile_(req).first_name + ',\n\nVotre demande d\'accès n\'a pas été retenue.\n\nMotif : ' + rejectReason
    );
  } catch (e) { /* quota */ }

  return { id: id, status: 'rejected' };
}

function findAccessRequest_(id) {
  var all = readAll_('AccessRequests');
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) return all[i];
  }
  return null;
}

function updateAccessRequest_(id, updates) {
  var sheet = getSheet_('AccessRequests');
  if (!sheet) throw apiError_('CONFIG_ERROR', 'Onglet AccessRequests manquant', 500);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      Object.keys(updates).forEach(function (key) {
        var col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
      });
      return findAccessRequest_(id);
    }
  }
  return null;
}

function appendToWhitelist_(email, role, name) {
  var wl = getWhitelist_();
  var e = String(email).toLowerCase();
  var found = false;
  for (var i = 0; i < wl.length; i++) {
    if (String(wl[i].email || '').toLowerCase() === e) {
      wl[i].role = role;
      wl[i].name = name;
      found = true;
      break;
    }
  }
  if (!found) wl.push({ email: email, role: role, name: name });
  var json = JSON.stringify(wl);
  PropertiesService.getScriptProperties().setProperty('WHITELIST_JSON', json);
  try { CacheService.getScriptCache().put('whitelist_json', json, 300); } catch (e) { /* ignore */ }
}

function ensureUserAccount_(email, role, profile) {
  profile = normalizeUserProfile_(profile);
  if (!findUserRow_(email)) {
    var initialPassword = randomPassword_();   // un mot de passe provisoire différent par compte
    appendRow_('Users', {
      email: email,
      password_hash: newPasswordHash_(initialPassword),
      role: role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      name: profile.name
    });
    return initialPassword;
  }
  // Compte déjà existant : on ne renvoie jamais de mot de passe
  return '';
}
