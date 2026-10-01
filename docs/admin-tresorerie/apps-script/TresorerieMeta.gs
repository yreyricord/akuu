/**
 * Projets et catégories configurables (onglet Config du tableur application).
 */

var DEFAULT_TRESORERIE_PROJECTS_ = [
  { code: 'musee', label: 'Musée Shapishiko' },
  { code: 'maison', label: 'Projet Maison communautaire' },
  { code: 'akuuvision', label: 'AKUUVision' },
  { code: 'anglais', label: "Cours d'anglais" },
  { code: 'hydrama', label: 'Hydrama' },
  { code: 'lowtech', label: 'Low Tech' },
  { code: 'dechets', label: 'Gestion des déchets' },
  { code: 'sensibilisation', label: 'Sensibilisation' },
  { code: 'fonctionnement', label: 'Frais de fonctionnement' },
  { code: 'divers', label: 'Divers / non affecté' }
];

var DEFAULT_TRESORERIE_CATEGORIES_ = [
  { code: 'transport', label: 'Transport & logistique' },
  { code: 'materiel', label: 'Matériel & fournitures' },
  { code: 'services_locaux', label: "Services locaux & main d'œuvre" },
  { code: 'batiment_travaux', label: 'Bâtiment & travaux' },
  { code: 'equipement', label: 'Équipement durable' },
  { code: 'communication', label: 'Communication' },
  { code: 'banque_frais', label: 'Frais bancaires & change' },
  { code: 'admin_assurance', label: 'Administratif & assurance' },
  { code: 'autre', label: 'Autre' }
];

var _configRowsCache_ = null;
var _projectMapsCache_ = null;

function invalidateTresorerieMetaCache_() {
  _configRowsCache_ = null;
  _projectMapsCache_ = null;
}

function readConfigRows_() {
  if (_configRowsCache_) return _configRowsCache_;
  var sheet = getSheet_('Config');
  if (!sheet || sheet.getLastRow() < 2) {
    _configRowsCache_ = [];
    return _configRowsCache_;
  }
  _configRowsCache_ = sheet.getDataRange().getValues();
  return _configRowsCache_;
}

function configJson_(key, fallback) {
  var data = readConfigRows_();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key && data[i][1]) {
      try { return JSON.parse(String(data[i][1])); } catch (e) { return fallback; }
    }
  }
  return fallback;
}

function setConfigJson_(key, value) {
  var sheet = getSheet_('Config');
  if (!sheet) {
    sheet = getSpreadsheet_().insertSheet('Config');
    sheet.appendRow(['key', 'value']);
  }
  var data = sheet.getDataRange().getValues();
  var rowIdx = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) { rowIdx = i + 1; break; }
  }
  var json = JSON.stringify(value);
  if (rowIdx > 0) sheet.getRange(rowIdx, 2).setValue(json);
  else sheet.appendRow([key, json]);
  invalidateTresorerieMetaCache_();
  invalidateSheetCache_('Config');
}

function getTresorerieProjects_() {
  var list = configJson_('TRESORERIE_PROJECTS', DEFAULT_TRESORERIE_PROJECTS_);
  if (!list || !list.length) return DEFAULT_TRESORERIE_PROJECTS_;
  return list;
}

function getTresorerieCategories_() {
  var list = configJson_('TRESORERIE_CATEGORIES', DEFAULT_TRESORERIE_CATEGORIES_);
  if (!list || !list.length) return DEFAULT_TRESORERIE_CATEGORIES_;
  return list;
}

function buildProjectMaps_() {
  if (_projectMapsCache_) return _projectMapsCache_;
  var codes = {};
  var labels = {};
  var aliases = {
    museo: 'MUSEE', 'casa akuu': 'MAISON', 'maison': 'MAISON', 'akuuvision': 'AKUUVISION',
    anglais: 'ANGLAIS', hydrama: 'HYDRAMA', lowtech: 'LOW_TECH', 'low tech': 'LOW_TECH',
    dechets: 'GESTION_DECHETS', sensibilisation: 'SENSIBILISATION', fonctionnement: 'FONCTIONNEMENT',
    divers: 'DIVERS', 'non affecte': 'DIVERS'
  };
  getTresorerieProjects_().forEach(function (p) {
    var slug = normTxt_(p.code);
    var code = String(p.code || '').toUpperCase().replace(/-/g, '_');
    if (PROJECT_CODES_[slug]) code = PROJECT_CODES_[slug];
    codes[slug] = code;
    labels[code] = p.label || code;
    aliases[slug] = code;
    aliases[normTxt_(p.label)] = code;
  });
  _projectMapsCache_ = { codes: codes, labels: labels, aliases: aliases };
  return _projectMapsCache_;
}

function getTresorerieMeta_(session) {
  requireTreasurer_(session);
  return { projects: getTresorerieProjects_(), categories: getTresorerieCategories_() };
}

function saveTresorerieMeta_(session, body) {
  requireTreasurer_(session);
  if (body.projects) {
    var cleaned = (body.projects || []).filter(function (p) { return p && p.code && p.label; }).map(function (p) {
      return { code: normTxt_(p.code).replace(/\s+/g, '_'), label: String(p.label).trim() };
    });
    if (!cleaned.length) throw apiError_('VALIDATION_FAILED', 'Liste projets vide');
    setConfigJson_('TRESORERIE_PROJECTS', cleaned);
  }
  if (body.categories) {
    var cats = (body.categories || []).filter(function (c) { return c && c.code && c.label; }).map(function (c) {
      return { code: normTxt_(c.code).replace(/\s+/g, '_'), label: String(c.label).trim() };
    });
    if (cats.length) setConfigJson_('TRESORERIE_CATEGORIES', cats);
  }
  appendAudit_(session.email, 'tresorerie_meta_updated', 'config', 'meta', {});
  return getTresorerieMeta_(session);
}
