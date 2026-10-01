/** Lecture / écriture Google Sheets */

var SHEET_HEADERS = {
  Demandes: [
    "id",
    "reference",
    "created_at",
    "submitter_email",
    "project",
    "category",
    "amount_pen_estimated",
    "amount_eur_estimated",
    "currency",
    "exchange_rate",
    "payment_type",
    "description",
    "justification",
    "needed_by_date",
    "status",
    "treasurer_email",
    "decided_at",
    "reject_reason",
    "resubmission_of",
    "version",
    "devis_attachments_json",
    "devis_status",
    "devis_validated_at",
    "devis_validated_by",
    "devis_reject_reason",
  ],
  Factures: [
    "id",
    "reference",
    "demand_reference",
    "entry_source",
    "created_at",
    "expense_date",
    "submitter_email",
    "project",
    "category",
    "amount_pen",
    "amount_eur",
    "currency",
    "exchange_rate",
    "exchange_source",
    "payment_type",
    "payment_method",
    "paid_by",
    "vendor_name",
    "receipt_number",
    "location",
    "label",
    "status",
    "drive_file_id",
    "drive_file_url",
    "file_name",
    "treasurer_email",
    "validated_at",
    "reject_reason",
    "resubmission_of",
    "reimbursement_status",
    "reimbursed_at",
    "reimbursed_by",
  ],
  Journal: [
    "journal_at",
    "reference",
    "demand_reference",
    "expense_date",
    "submitter_email",
    "project",
    "category",
    "amount_pen",
    "amount_eur",
    "exchange_rate",
    "label",
    "drive_file_url",
    "treasurer_email",
    "validated_at",
  ],
  Corrections: [
    "id",
    "created_at",
    "actor_email",
    "type",
    "reference",
    "year",
    "reason",
    "drive_file_id",
    "drive_file_url",
    "file_name",
    "status",
    "applied_at",
  ],
  Audit: [
    "id",
    "timestamp",
    "actor_email",
    "action",
    "entity_type",
    "entity_id",
    "payload_json",
  ],
  Config: ["key", "value"],
  Users: ["email", "password_hash", "role", "first_name", "last_name", "name"],
  AccessRequests: [
    "id",
    "created_at",
    "email",
    "first_name",
    "last_name",
    "name",
    "requested_role",
    "message",
    "status",
    "decided_at",
    "decided_by",
    "reject_reason",
  ],
};

/** Cache par exécution (une requête Web App = une exécution GAS). */
var _ssCache_ = null;
var _sheetDataCache_ = {};

function invalidateSheetCache_(sheetName) {
  if (sheetName) delete _sheetDataCache_[sheetName];
  else _sheetDataCache_ = {};
}

/** Nouvelle requête Web App → caches lecture invalidés (conservés intra-requête). */
function resetRequestCaches_() {
  _ssCache_ = null;
  _sheetDataCache_ = {};
  if (typeof invalidateJournalCaches_ === "function")
    invalidateJournalCaches_(null);
  if (typeof invalidateTresorerieMetaCache_ === "function")
    invalidateTresorerieMetaCache_();
}

function getSpreadsheet_() {
  if (!_ssCache_) {
    var id = getSpreadsheetId_();
    if (!id) {
      throw apiError_(
        "CONFIG_ERROR",
        "SPREADSHEET_ID manquant dans Propriétés du script (Apps Script → Paramètres du projet).",
        500
      );
    }
    try {
      _ssCache_ = SpreadsheetApp.openById(id);
    } catch (e) {
      var who = "";
      try { who = Session.getEffectiveUser().getEmail(); } catch (ignore) {}
      throw apiError_(
        "CONFIG_ERROR",
        "Tableur AKUU inaccessible (id " + id + "). " +
          "Ouvrez le Google Sheet avec le compte " + (who || "akuu.asso@gmail.com") +
          " et vérifiez qu'il est bien partagé en Éditeur avec ce compte.",
        500
      );
    }
  }
  return _ssCache_;
}

function getSheet_(name) {
  return getSpreadsheet_().getSheetByName(name);
}

/** Évite le décalage de colonnes si l'onglet n'a pas été migré (devis, remboursements…). */
function ensureSheetHeadersBeforeWrite_(sheetName) {
  var targetHeaders = SHEET_HEADERS[sheetName];
  if (!targetHeaders) return;
  var sheet = getSheet_(sheetName);
  if (!sheet || sheet.getLastRow() === 0) return;
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headersMatch_(current, targetHeaders)) return;
  syncSheetSchema_(sheetName);
}

function appendRow_(sheetName, obj, headers) {
  var sheet = getSheet_(sheetName);
  if (!sheet)
    throw apiError_("CONFIG_ERROR", "Onglet manquant: " + sheetName, 500);
  ensureSheetHeadersBeforeWrite_(sheetName);
  sheet = getSheet_(sheetName);
  var cols = headers || SHEET_HEADERS[sheetName];
  var row = cols.map(function (h) {
    var v = obj[h];
    if (v === undefined || v === null) return "";
    return v;
  });
  sheet.appendRow(row);
  invalidateSheetCache_(sheetName);
  return obj;
}

function readAll_(sheetName) {
  if (_sheetDataCache_[sheetName]) return _sheetDataCache_[sheetName];
  var sheet = getSheet_(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var o = {};
    for (var j = 0; j < headers.length; j++) {
      o[headers[j]] = data[i][j];
    }
    rows.push(o);
  }
  _sheetDataCache_[sheetName] = rows;
  return rows;
}

function findByReference_(sheetName, reference) {
  var all = readAll_(sheetName);
  for (var i = 0; i < all.length; i++) {
    if (all[i].reference === reference) return all[i];
  }
  return null;
}

function updateRowByReference_(sheetName, reference, updates) {
  ensureSheetHeadersBeforeWrite_(sheetName);
  var sheet = getSheet_(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var refIdx = headers.indexOf("reference");
  for (var i = 1; i < data.length; i++) {
    if (data[i][refIdx] === reference) {
      var result = {};
      for (var j = 0; j < headers.length; j++) result[headers[j]] = data[i][j];
      Object.keys(updates).forEach(function (key) {
        var col = headers.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(updates[key]);
          result[key] = updates[key];
        }
      });
      invalidateSheetCache_(sheetName);
      return result;
    }
  }
  return null;
}

function nextReference_(prefix, year) {
  var key = "DEM_COUNTER_" + year;
  if (prefix === "FAC") key = "FAC_COUNTER_" + year;
  var sheet = getSheet_("Config");
  var data = sheet.getDataRange().getValues();
  var counter = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) counter = Number(data[i][1]) || 0;
  }
  counter += 1;
  var found = false;
  for (var j = 1; j < data.length; j++) {
    if (data[j][0] === key) {
      sheet.getRange(j + 1, 2).setValue(counter);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([key, counter]);
  return "AKUU-" + prefix + "-" + year + "-" + pad4_(counter);
}

function pad4_(n) {
  var s = String(n);
  while (s.length < 4) s = "0" + s;
  return s;
}

function appendAudit_(actorEmail, action, entityType, entityId, payload) {
  appendRow_("Audit", {
    id: uuid_(),
    timestamp: new Date().toISOString(),
    actor_email: actorEmail,
    action: action,
    entity_type: entityType,
    entity_id: entityId,
    payload_json: JSON.stringify(payload || {}),
  });
}

function rowToDemande_(r) {
  if (r.devis_attachments_json) {
    try {
      r.devis_attachments = JSON.parse(r.devis_attachments_json);
    } catch (e) {
      r.devis_attachments = [];
    }
  }
  return r;
}

function headersMatch_(current, target) {
  if (current.length !== target.length) return false;
  for (var i = 0; i < target.length; i++) {
    if (String(current[i] || "").trim() !== target[i]) return false;
  }
  return true;
}

/** Migre une ligne vers le schéma cible (prénom/nom, remboursements…) */
function migrateSheetRow_(sheetName, row) {
  if (sheetName === "Demandes") {
    if (!row.currency) row.currency = "PEN";
    if (!row.devis_status) {
      row.devis_status = requiresDevisAttachments_(row.amount_pen_estimated)
        ? "pending"
        : "not_required";
    }
    if (!row.devis_validated_at) row.devis_validated_at = "";
    if (!row.devis_validated_by) row.devis_validated_by = "";
    if (!row.devis_reject_reason) row.devis_reject_reason = "";
  }
  if (sheetName === "Users" || sheetName === "AccessRequests") {
    row = migrateUserProfileRow_(row);
  }
  if (sheetName === "Factures") {
    if (!row.currency) row.currency = "PEN";
    if (!row.entry_source)
      row.entry_source = row.demand_reference ? "demande" : "direct";
    if (!row.reimbursement_status) {
      if (
        row.payment_type === "avance_benevole" &&
        row.status === "validated"
      ) {
        row.reimbursement_status = row.reimbursed_at ? "paid" : "to_pay";
      } else if (row.payment_type === "avance_benevole") {
        row.reimbursement_status = "awaiting_validation";
      } else {
        row.reimbursement_status = "not_applicable";
      }
    }
    if (row.reimbursed_at === undefined || row.reimbursed_at === null)
      row.reimbursed_at = "";
    if (row.reimbursed_by === undefined || row.reimbursed_by === null)
      row.reimbursed_by = "";
  }
  return row;
}

function migrateUserProfileRow_(row) {
  var first = String(row.first_name || "").trim();
  var last = String(row.last_name || "").trim();
  var full = String(row.name || "").trim();
  if (!first && !last && full) {
    var parsed = parseLegacyFullName_(full);
    row.first_name = parsed.first_name;
    row.last_name = parsed.last_name;
  }
  if (!full) row.name = buildFullName_(row.first_name, row.last_name);
  return row;
}

/**
 * Crée ou migre un onglet vers SHEET_HEADERS[sheetName] sans effacer les données.
 * Insère les colonnes manquantes (first_name, last_name, reimbursement_*, etc.)
 */
function syncSheetSchema_(sheetName) {
  var targetHeaders = SHEET_HEADERS[sheetName];
  if (!targetHeaders) throw new Error("Schéma inconnu: " + sheetName);

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  var created = false;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    created = true;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);

  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, targetHeaders.length).setFontWeight("bold");
    Logger.log(sheetName + ": onglet créé");
    return { sheet: sheetName, created: true, migratedRows: 0 };
  }

  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headersMatch_(currentHeaders, targetHeaders)) {
    Logger.log(sheetName + ": schéma déjà à jour");
    return { sheet: sheetName, created: false, migratedRows: 0 };
  }

  var dataRows =
    lastRow > 1 ? sheet.getRange(2, 1, lastRow, lastCol).getValues() : [];

  var objects = [];
  for (var i = 0; i < dataRows.length; i++) {
    var o = {};
    for (var j = 0; j < currentHeaders.length; j++) {
      var key = String(currentHeaders[j] || "").trim();
      if (key) o[key] = dataRows[i][j];
    }
    objects.push(migrateSheetRow_(sheetName, o));
  }

  if (lastCol < targetHeaders.length) {
    sheet.insertColumnsAfter(lastCol, targetHeaders.length - lastCol);
  }

  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, targetHeaders.length).setFontWeight("bold");

  if (objects.length) {
    var outRows = objects.map(function (o) {
      return targetHeaders.map(function (h) {
        var v = o[h];
        return v === undefined || v === null ? "" : v;
      });
    });
    sheet
      .getRange(2, 1, objects.length, targetHeaders.length)
      .setValues(outRows);
  }

  if (sheet.getLastRow() > objects.length + 1) {
    sheet.deleteRows(
      objects.length + 2,
      sheet.getLastRow() - objects.length - 1,
    );
  }

  Logger.log(
    sheetName +
      ": migré · " +
      objects.length +
      " ligne(s) · colonnes → " +
      targetHeaders.join(", "),
  );
  return { sheet: sheetName, created: created, migratedRows: objects.length };
}

/** Migre tous les onglets vers le schéma courant (sans effacer les données) */
function migrateTresorerieSheets() {
  var results = [];
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    results.push(syncSheetSchema_(name));
  });
  Logger.log(
    "migrateTresorerieSheets terminé · " + results.length + " onglet(s)",
  );
  return results;
}
