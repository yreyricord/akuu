/**
 * AKUU Trésorerie — Web App entry (doGet / doPost / doOptions)
 * Déployer sous akuu.asso@gmail.com · voir GUIDE-TRESORIER.md
 */

function doGet(e) {
  return handleRequest('GET', e);
}

function doPost(e) {
  return handleRequest('POST', e);
}

function doOptions(e) {
  return jsonResponse({ ok: true }, 204);
}

function handleRequest(method, e) {
  var t0 = Date.now();
  var path = '';
  var body = method === 'POST' ? parseRequestBody_(e) : {};
  try {
    if (typeof resetRequestCaches_ === 'function') resetRequestCaches_();
    path = normalizePath_(e.pathInfo || e.parameter.path || '');
    // Lectures : envoyées en POST (jeton dans le corps) avec _method: 'GET'
    var isWrite = method === 'POST' && body._method !== 'GET';
    if (method === 'POST' && body._method === 'GET') method = 'GET';
    var param = function (k) { return body[k] !== undefined ? body[k] : (e.parameter || {})[k]; };
    if (isWrite && path.indexOf('auth/') !== 0 && path !== 'access-requests') {
      var run = function () {
        var res = route_(method, path, body, e, param);
        if (typeof invalidateExercicesCache_ === 'function' && shouldInvalidateExercicesCache_(path)) {
          invalidateExercicesCache_();
        }
        return res;
      };
      if (typeof needsTresorerieWriteLock_ === 'function' && !needsTresorerieWriteLock_(path)) {
        return run();
      }
      return withWriteLock_(run);
    }
    return route_(method, path, body, e, param);
  } catch (err) {
    return jsonResponse({ ok: false, error: publicError_(err) }, err.status || 400);
  } finally {
    if (typeof logPerfIfSlow_ === 'function') logPerfIfSlow_(path, Date.now() - t0, '');
  }
}

function route_(method, path, body, e, param) {
  try {
    var session = null;

    // GET /exec ou /exec/health — ping public (pas de session)
    if (method === 'GET' && (path === '' || path === 'health')) {
      return jsonResponse({ ok: true, data: { status: 'ok', service: 'akuu-tresorerie' } });
    }
    if (path === 'auth/logout' && method === 'POST') {
      return jsonResponse({ ok: true, data: authLogout_(body) });
    }
    if (path === 'auth/login' && method === 'POST') {
      return jsonResponse({ ok: true, data: authLogin_(body) });
    }
    if (path === 'auth/forgot-password' && method === 'POST') {
      return jsonResponse({ ok: true, data: authForgotPassword_(body) });
    }
    if (path === 'auth/reset-password' && method === 'POST') {
      return jsonResponse({ ok: true, data: authResetPassword_(body) });
    }
    if (path === 'auth/google' && method === 'POST') {
      return jsonResponse({ ok: true, data: authLoginGoogle_(body) });
    }
    if (path === 'access-requests' && method === 'POST') {
      assertPublicRateLimit_('access_requests', 20);
      return jsonResponse({ ok: true, data: createAccessRequest_(body) });
    }
    if (path === 'finances-publiques' && method === 'GET') {
      return jsonResponse({ ok: true, data: getFinancesPubliques_() });
    }

    session = requireSession_(e, body);

    if (path === 'auth/password' && method === 'POST') {
      return jsonResponse({ ok: true, data: changePassword_(session, body) });
    }
    if (path === 'auth/me' && method === 'GET') {
      return jsonResponse({ ok: true, data: sessionProfile_(session) });
    }
    if (path === 'exchange-rate/pen-eur' && method === 'GET') {
      return jsonResponse({ ok: true, data: getExchangeRate_() });
    }
    if (path === 'demandes/mine' && method === 'GET') {
      return jsonResponse({ ok: true, data: getDemandesMine_(session) });
    }
    if (path === 'demandes/pending' && method === 'GET') {
      requireTreasurer_(session);
      return jsonResponse({ ok: true, data: getDemandesPending_() });
    }
    if (path === 'demandes/all' && method === 'GET') {
      return jsonResponse({ ok: true, data: listAllDemandes_(session) });
    }
    if (path === 'validation/stats' && method === 'GET') {
      return jsonResponse({ ok: true, data: getValidationStats_(session) });
    }
    if (path === 'validation/queue' && method === 'GET') {
      return jsonResponse({ ok: true, data: getValidationQueue_(session) });
    }
    if (path === 'validation/version' && method === 'GET') {
      return jsonResponse({ ok: true, data: getValidationVersion_(session) });
    }
    if (path === 'demandes/approved' && method === 'GET') {
      return jsonResponse({ ok: true, data: getApprovedDemandes_(session) });
    }
    if (path === 'demandes' && method === 'POST') {
      return jsonResponse({ ok: true, data: createDemande_(session, body) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/validate-devis') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refDv = extractRef_(path, '/validate-devis');
      return jsonResponse({ ok: true, data: validateDemandeDevis_(session, refDv) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/reject-devis') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refRd = extractRef_(path, '/reject-devis');
      return jsonResponse({ ok: true, data: rejectDemandeDevis_(session, refRd, body.reject_reason) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/resubmit-devis') > 0 && method === 'POST') {
      var refRs = extractRef_(path, '/resubmit-devis');
      return jsonResponse({ ok: true, data: resubmitDemandeDevis_(session, refRs, body) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/approve') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refA = extractRef_(path, '/approve');
      return jsonResponse({ ok: true, data: approveDemande_(session, refA) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/close-invoicing') > 0 && method === 'POST') {
      var refCi = extractRef_(path, '/close-invoicing');
      return jsonResponse({ ok: true, data: closeDemandeInvoicing_(session, refCi) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/validate-factures') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refVf = extractRef_(path, '/validate-factures');
      return jsonResponse({ ok: true, data: validateDemandeFactures_(session, refVf) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/reject') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refR = extractRef_(path, '/reject');
      return jsonResponse({ ok: true, data: rejectDemande_(session, refR, body.reject_reason) });
    }
    if (path.indexOf('demandes/') === 0 && path.indexOf('/resubmit') > 0 && method === 'POST') {
      var parentId = path.split('/')[1];
      return jsonResponse({ ok: true, data: resubmitDemande_(session, parentId, body) });
    }
    if (path === 'factures/pending' && method === 'GET') {
      requireTreasurer_(session);
      return jsonResponse({ ok: true, data: getFacturesPending_() });
    }
    if (path === 'factures/all' && method === 'GET') {
      return jsonResponse({ ok: true, data: listAllFactures_(session) });
    }
    if (path === 'audit' && method === 'GET') {
      return jsonResponse({ ok: true, data: listAuditLog_(session) });
    }
    if (path === 'expenses/direct' && method === 'POST') {
      requireTreasurer_(session);
      return jsonResponse({ ok: true, data: createDirectExpense_(session, body) });
    }
    if (path === 'factures/batch' && method === 'POST') {
      return jsonResponse({ ok: true, data: createFacturesBatch_(session, body) });
    }
    if (path === 'factures' && method === 'POST') {
      return jsonResponse({ ok: true, data: createFacture_(session, body) });
    }
    if (path.indexOf('factures/') === 0 && path.indexOf('/validate') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refV = extractRef_(path, '/validate');
      return jsonResponse({ ok: true, data: validateFacture_(session, refV) });
    }
    if (path.indexOf('factures/') === 0 && path.indexOf('/reject') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refF = extractRef_(path, '/reject');
      return jsonResponse({ ok: true, data: rejectFacture_(session, refF, body.reject_reason) });
    }
    if (path.indexOf('factures/') === 0 && path.indexOf('/reimburse') > 0 && method === 'POST') {
      requireTreasurer_(session);
      var refRb = extractRef_(path, '/reimburse');
      return jsonResponse({ ok: true, data: reimburseFacture_(session, refRb) });
    }
    if (path === 'factures/reimbursements-pending' && method === 'GET') {
      requireTreasurer_(session);
      return jsonResponse({ ok: true, data: getReimbursementsPending_() });
    }
    if (path === 'avances' && method === 'GET') {
      return jsonResponse({ ok: true, data: getAvancesAnnee_(session, param('year')) });
    }
    if (path === 'caisse-perou' && method === 'GET') {
      return jsonResponse({ ok: true, data: getCaissePerou_(session, param('year')) });
    }
    if (path === 'history' && method === 'GET') {
      return jsonResponse({
        ok: true,
        data: getHistory_(session, { limit: param('limit'), since: param('since') })
      });
    }
    if (path === 'compta' && method === 'GET') {
      return jsonResponse({ ok: true, data: getCompta_(session) });
    }
    if (path === 'site-data' && method === 'GET') {
      return jsonResponse({ ok: true, data: getSiteData_(session, param('name')) });
    }
    if (path === 'site-data' && method === 'POST') {
      return jsonResponse({ ok: true, data: uploadSiteData_(session, body) });
    }
    if (path === 'archive-file' && method === 'GET') {
      return jsonResponse({ ok: true, data: downloadArchiveFile_(session, body) });
    }
    if (path === 'archive-zip' && method === 'GET') {
      return jsonResponse({ ok: true, data: zipArchive_(session, body) });
    }
    if (path === 'bascule' && method === 'POST') {
      return jsonResponse({ ok: true, data: basculeAnnee_(session, body) });
    }
    if (path === 'releves' && method === 'POST') {
      return jsonResponse({ ok: true, data: uploadReleveArchive_(session, body) });
    }
    if (path === 'releves/archives' && method === 'GET') {
      return jsonResponse({ ok: true, data: listRelevesArchives_(session) });
    }
    if (path.indexOf('releves/archives/') === 0 && path.indexOf('/file') > 0 && method === 'GET') {
      return jsonResponse({ ok: true, data: releveArchiveFile_(session, path.split('/')[2]) });
    }
    if (path.indexOf('releves/archives/') === 0 && path.indexOf('/synced') > 0 && method === 'POST') {
      return jsonResponse({ ok: true, data: markReleveArchiveSynced_(session, path.split('/')[2]) });
    }
    if (path === 'releves/link' && method === 'GET') {
      return jsonResponse({ ok: true, data: getRelevePdfLink_(session, param('year'), param('month')) });
    }
    if (path === 'releves/import' && method === 'POST') {
      return jsonResponse({ ok: true, data: importReleve_(session, body) });
    }
    if (path === 'exercices' && method === 'GET') {
      return jsonResponse({ ok: true, data: getExercices_(session) });
    }
    if (path.indexOf('exercices/') === 0 && path.indexOf('/controle') > 0 && method === 'GET') {
      return jsonResponse({ ok: true, data: verifierExercicesControle_(session) });
    }
    if (path.indexOf('exercices/') === 0 && path.indexOf('/historique') > 0 && method === 'GET') {
      return jsonResponse({ ok: true, data: listHistoriqueExercice_(session, path.split('/')[1]) });
    }
    if (path.indexOf('exercices/') === 0 && method === 'GET') {
      return jsonResponse({ ok: true, data: getExercice_(session, path.split('/')[1]) });
    }
    if (path === 'exercice/rouvrir' && method === 'POST') {
      return jsonResponse({ ok: true, data: rouvrirExercice_(session, body) });
    }
    if (path === 'exercice/recloturer' && method === 'POST') {
      return jsonResponse({ ok: true, data: recloturerExercice_(session, body) });
    }
    if (path === 'exercice/regenerer' && method === 'POST') {
      return jsonResponse({ ok: true, data: genererClotureAnnee_(session, body) });
    }
    if (path === 'compta-annee' && method === 'GET') {
      return jsonResponse({ ok: true, data: getComptaAnnee_(session, param('year')) });
    }
    if (path === 'export-journal' && method === 'GET') {
      return jsonResponse({ ok: true, data: exportJournalXlsx_(session, param('year')) });
    }
    if (path === 'export-registre' && method === 'GET') {
      return jsonResponse({ ok: true, data: exportRegistreXlsx_(session, param('year')) });
    }
    if (path === 'journal-annee' && method === 'GET') {
      return jsonResponse({ ok: true, data: getJournalAnnee_(session, param('year')) });
    }
    if (path === 'corrections' && method === 'GET') {
      return jsonResponse({ ok: true, data: listCorrections_(session) });
    }
    if (path === 'corrections/delete' && method === 'POST') {
      return jsonResponse({ ok: true, data: requestDeletion_(session, body) });
    }
    if (path === 'corrections/update' && method === 'POST') {
      return jsonResponse({ ok: true, data: requestUpdate_(session, body) });
    }
    if (path === 'corrections/sync-modes' && method === 'POST') {
      return jsonResponse({ ok: true, data: bulkSyncPaymentModes_(session, body) });
    }
    if (path === 'tresorerie-meta' && method === 'GET') {
      return jsonResponse({ ok: true, data: getTresorerieMeta_(session) });
    }
    if (path === 'tresorerie-meta' && method === 'POST') {
      return jsonResponse({ ok: true, data: saveTresorerieMeta_(session, body) });
    }
    if (path === 'corrections/attach' && method === 'POST') {
      return jsonResponse({ ok: true, data: attachInvoice_(session, body) });
    }
    if (path.indexOf('corrections/') === 0 && path.indexOf('/file') > 0 && method === 'GET') {
      return jsonResponse({ ok: true, data: correctionFile_(session, path.split('/')[1]) });
    }
    if (path.indexOf('corrections/') === 0 && path.indexOf('/applied') > 0 && method === 'POST') {
      return jsonResponse({ ok: true, data: markCorrectionApplied_(session, path.split('/')[1]) });
    }
    if (path === 'access-requests/pending' && method === 'GET') {
      return jsonResponse({ ok: true, data: getAccessRequestsPending_(session) });
    }
    if (path.indexOf('access-requests/') === 0 && path.indexOf('/approve') > 0 && method === 'POST') {
      var accessIdA = path.split('/')[1];
      return jsonResponse({ ok: true, data: approveAccessRequest_(session, accessIdA) });
    }
    if (path.indexOf('access-requests/') === 0 && path.indexOf('/reject') > 0 && method === 'POST') {
      var accessIdR = path.split('/')[1];
      return jsonResponse({ ok: true, data: rejectAccessRequest_(session, accessIdR, body.reject_reason) });
    }

    throw apiError_('NOT_FOUND', 'Route inconnue');
  } catch (err) {
    return jsonResponse({ ok: false, error: publicError_(err) }, err.status || 400);
  }
}

/** Limite globale simple pour les routes publiques (anti-spam). */
function assertPublicRateLimit_(key, perHour) {
  var cache = CacheService.getScriptCache();
  var k = 'rl_' + key + '_' + Math.floor(Date.now() / 3600000);
  var n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), 3700);
  if (n > perHour) throw apiError_('TOO_MANY_REQUESTS', 'Trop de demandes, réessayez plus tard.', 429);
}

/** N'invalide le cache exercices que si le journal / la clôture est touché. */
function shouldInvalidateExercicesCache_(path) {
  if (!path) return false;
  if (path === 'expenses/direct' || path === 'bascule') return true;
  if (path.indexOf('exercice') === 0) return true;
  if (path.indexOf('corrections') === 0) return true;
  if (path.indexOf('releves') === 0) return true;
  if (path.indexOf('factures/') === 0 && path.indexOf('/validate') > 0) return true;
  return false;
}

function normalizePath_(path) {
  if (path && typeof path === 'object' && path.length) path = path[0];
  return String(path || '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function extractRef_(path, suffix) {
  return path.replace(suffix, '').split('/').pop();
}

function parseRequestBody_(e) {
  if (!e.postData || !e.postData.contents) return {};
  var type = e.postData.type || '';
  if (type.indexOf('application/json') >= 0) {
    return JSON.parse(e.postData.contents, safeJsonReviver_);
  }
  if (type.indexOf('multipart/form-data') >= 0) {
    return parseMultipartJson_(e);
  }
  try {
    return JSON.parse(e.postData.contents, safeJsonReviver_);
  } catch (err) {
    return {};
  }
}

/** Ignore les clés dangereuses (__proto__, constructor, prototype). */
function safeJsonReviver_(key, value) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return value;
}

/** multipart: champs json + devis[] + receipt (fallback) */
function parseMultipartJson_(e) {
  var out = { _attachments: { devis: [], receipt: null } };
  if (e.parameter && e.parameter.json) {
    try {
      out = JSON.parse(e.parameter.json);
      out._attachments = out._attachments || { devis: [], receipt: null };
    } catch (err) { /* ignore */ }
  }
  return out;
}

function jsonResponse(obj, status) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function apiError_(code, message, status) {
  var err = new Error(message);
  err.code = code;
  err.status = status || 400;
  return err;
}
