/** Constantes métier (miroir src/data/tresorerie-config.js) */

var OPERATING_EXPENSE_CATEGORIES = ['banque_frais', 'admin_assurance', 'communication', 'autre'];
var OPERATING_EXPENSE_PROJECT = 'fonctionnement';
var DIRECT_EXPENSE_PAYMENT_TYPES = ['carte_asso', 'virement', 'avance_asso'];

/** Au-delà : photos/PDF de devis fournisseurs obligatoires (la demande/devis reste toujours requise). */
var DEVIS_PEN_THRESHOLD = 1000;
var MIN_DEVIS_ATTACHMENTS = 2;
var AMOUNT_TOLERANCE_PERCENT = 10;
var SESSION_TTL_SEC = 21600;   // 6 h : durée maximale de CacheService (l ancienne valeur 7 j était tronquée à 6 h)

function getProp_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  return v != null && v !== '' ? v : (fallback || '');
}

function getSpreadsheetId_() {
  return getProp_('SPREADSHEET_ID', '1VHVisgWvALpvj6xTc5xW7XQ3qihIui6YHYDW00fa-6o');
}

function getRootFolderId_() {
  return getProp_('ROOT_FOLDER_ID', '1jjSujWQnVXXP7Up3blVHShKOrBQN_lTq');
}

function getFacturesFolderId_() {
  return getProp_('FACTURES_FOLDER_ID', '');
}

/**
 * Arborescence Drive (depuis 30/09/2026) : ROOT = 3_Trésorerie
 *   3_Trésorerie/<année>/Factures
 *   3_Trésorerie/<année>/Documents/Devis
 *   3_Trésorerie/<année>/Documents/Releves_bancaires
 */
function getOrCreateChild_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getYearFolder_(year) {
  return getOrCreateChild_(DriveApp.getFolderById(getRootFolderId_()), String(year));
}

function getYearFacturesFolder_(year) {
  return getOrCreateChild_(getYearFolder_(year), 'Factures');
}

function getYearDocumentsSubfolder_(year, name) {
  return getOrCreateChild_(getOrCreateChild_(getYearFolder_(year), 'Documents'), name);
}

function getJwtSecret_() {
  var s = getProp_('JWT_SECRET', '');
  if (!s) throw apiError_('CONFIG_ERROR', 'JWT_SECRET manquant dans Script Properties', 500);
  return s;
}

function getAdminEmail_() {
  return getProp_('ADMIN_EMAIL', 'yoannreyricord@gmail.com').toLowerCase();
}

/** Phase test : admin ou ALLOW_SELF_VALIDATION=true → auto-validation autorisée (audit). */
function allowSelfValidation_(session) {
  if (getProp_('ALLOW_SELF_VALIDATION', '') === 'true') return true;
  if (String(session.email || '').toLowerCase() === getAdminEmail_()) return true;
  return normalizeRole_(session.role) === 'admin';
}

function getTreasurerEmails_() {
  var list = [];
  var t1 = getProp_('TREASURER_1', '');
  var t2 = getProp_('TREASURER_2', '');
  if (t1) list.push(t1.toLowerCase());
  if (t2) list.push(t2.toLowerCase());
  return list;
}

function normalizeRole_(role) {
  var r = String(role || '').toLowerCase();
  if (r === 'treasurer') return 'tresorier';
  if (r === 'member') return 'benevole';
  return r;
}

function getWhitelist_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('whitelist_json');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* relire ci-dessous */ }
  }
  var raw = getProp_('WHITELIST_JSON', '[]');
  try {
    var parsed = JSON.parse(raw);
    cache.put('whitelist_json', raw, 300);
    return parsed;
  } catch (e) {
    return [];
  }
}

function roleForEmail_(email) {
  var e = String(email || '').toLowerCase();
  if (e === getAdminEmail_()) return 'admin';
  if (getTreasurerEmails_().indexOf(e) >= 0) return 'tresorier';
  var wl = getWhitelist_();
  for (var i = 0; i < wl.length; i++) {
    if (String(wl[i].email || '').toLowerCase() === e) {
      return normalizeRole_(wl[i].role || 'benevole');
    }
  }
  return null;
}

function nameForEmail_(email) {
  var e = String(email || '').toLowerCase();
  var wl = getWhitelist_();
  for (var i = 0; i < wl.length; i++) {
    if (String(wl[i].email || '').toLowerCase() === e) return wl[i].name || e;
  }
  return e;
}

function requiresDevisPhotoAttachments_(pen) {
  return Number(pen) > DEVIS_PEN_THRESHOLD;
}

function requiresDevisAttachments_(pen) {
  return requiresDevisPhotoAttachments_(pen);
}

function amountPenMax_(estimatedPen) {
  return Math.round(Number(estimatedPen) * (1 + AMOUNT_TOLERANCE_PERCENT / 100) * 100) / 100;
}

function isAmountWithinTolerance_(actualPen, estimatedPen) {
  var actual = Number(actualPen);
  if (!isFinite(actual) || actual <= 0) return false;
  return actual <= amountPenMax_(estimatedPen);
}

function todayIsoLocal_() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate());
}

function pad2_(n) {
  return n < 10 ? '0' + n : String(n);
}

function uuid_() {
  return Utilities.getUuid();
}

function penToEur_(pen, rate) {
  return Math.round(Number(pen) * Number(rate) * 100) / 100;
}

function eurToPen_(eur, rate) {
  var r = Number(rate);
  if (!r || r <= 0) return 0;
  return Math.round(Number(eur) / r * 100) / 100;
}

function normalizeCurrency_(currency) {
  return String(currency || 'PEN').toUpperCase() === 'EUR' ? 'EUR' : 'PEN';
}

function parseDemandeAmounts_(body, rateInfo) {
  var currency = normalizeCurrency_(body.currency);
  var rate = rateInfo.rate;
  var pen, eur;
  if (currency === 'EUR') {
    eur = Number(body.amount != null ? body.amount : body.amount_eur_estimated);
    pen = eurToPen_(eur, rate);
  } else {
    pen = Number(body.amount != null ? body.amount : body.amount_pen_estimated);
    eur = penToEur_(pen, rate);
  }
  return { currency: currency, amount_pen_estimated: pen, amount_eur_estimated: eur };
}

function parseFactureAmounts_(body, rateInfo) {
  var currency = normalizeCurrency_(body.currency);
  var rate = rateInfo.rate;
  var pen, eur;
  if (currency === 'EUR') {
    eur = Number(body.amount != null ? body.amount : body.amount_eur);
    pen = eurToPen_(eur, rate);
  } else {
    pen = Number(body.amount != null ? body.amount : body.amount_pen);
    eur = penToEur_(pen, rate);
  }
  return { currency: currency, amount_pen: pen, amount_eur: eur };
}

function amountEurMax_(estimatedEur) {
  return Math.round(Number(estimatedEur) * (1 + AMOUNT_TOLERANCE_PERCENT / 100) * 100) / 100;
}

function isAmountWithinToleranceForDemande_(factureAmounts, demande) {
  var demCur = normalizeCurrency_(demande.currency);
  if (demCur === 'EUR') {
    return Number(factureAmounts.amount_eur) <= amountEurMax_(demande.amount_eur_estimated);
  }
  return isAmountWithinTolerance_(factureAmounts.amount_pen, demande.amount_pen_estimated);
}
