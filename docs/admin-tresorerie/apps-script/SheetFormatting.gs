/**
 * Mise en forme AKUU des onglets Google Sheets
 * Couleurs alignées tailwind.config.js · exécuté via formatTresorerieSheets()
 */

var AKUU_COLORS = {
  forest: '#2D6915',
  forestLight: '#DFEFCF',
  leaf: '#A6C639',
  leafLight: '#F5F9E8',
  cream: '#FEFDFC',
  creamAlt: '#F5F2ED',
  bleu: '#04488F',
  bleuLight: '#E6EEF7',
  night: '#3A4040',
  white: '#FFFFFF',
  terracotta: '#E76F51',
  terracottaLight: '#FDF0EC',
  ochre: '#F4A261',
  ochreLight: '#FEF6ED',
  validated: '#DFEFCF',
  pending: '#FEF6ED',
  rejected: '#FDF0EC'
};

/** Largeurs colonnes par onglet (px approximatifs Sheets) */
var COLUMN_WIDTHS = {
  Journal: [140, 120, 120, 100, 180, 120, 140, 90, 90, 70, 220, 120, 140, 140],
  Factures: [120, 120, 120, 140, 100, 180, 100, 140, 90, 90, 70, 120, 100, 100, 120, 140, 80, 100, 180, 90, 120, 120, 80, 140, 140, 120, 120, 120, 140, 140],
  Demandes: [120, 120, 140, 180, 120, 140, 90, 90, 70, 120, 220, 220, 100, 90, 180, 140, 140, 120, 120, 200],
  Users: [220, 200, 90, 120, 120, 180],
  AccessRequests: [120, 140, 220, 120, 120, 180, 100, 220, 90, 140, 180, 140]
};

function formatTresorerieSheets() {
  var names = ['Journal', 'Factures', 'Demandes', 'Users', 'AccessRequests', 'Audit', 'Config'];
  var done = [];
  names.forEach(function (name) {
    var sheet = getSheet_(name);
    if (!sheet) return;
    formatSheet_(name, sheet);
    done.push(name);
  });
  Logger.log('formatTresorerieSheets OK · ' + done.join(', '));
  return done;
}

function formatSheet_(sheetName, sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  applyHeaderRow_(sheet, lastCol);
  applyZebraRows_(sheet, lastRow, lastCol);
  applyColumnWidths_(sheetName, sheet, lastCol);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(sheetName === 'Journal' ? 2 : 1);

  if (sheetName === 'Journal') formatJournalSheet_(sheet, headers, lastRow);
  if (sheetName === 'Factures') formatFacturesSheet_(sheet, headers, lastRow);
  if (sheetName === 'Demandes') formatDemandesSheet_(sheet, headers, lastRow);
  if (sheetName === 'Users' || sheetName === 'AccessRequests') formatProfileSheet_(sheet, lastRow, lastCol);

  sheet.getRange(1, 1, lastRow, lastCol).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
}

function applyHeaderRow_(sheet, numCols) {
  var header = sheet.getRange(1, 1, 1, numCols);
  header.setBackground(AKUU_COLORS.forest);
  header.setFontColor(AKUU_COLORS.white);
  header.setFontWeight('bold');
  header.setFontSize(10);
  header.setHorizontalAlignment('center');
  header.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);
}

function applyZebraRows_(sheet, lastRow, lastCol) {
  if (lastRow < 2) return;
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange.setBackground(AKUU_COLORS.cream);
  dataRange.setFontColor(AKUU_COLORS.night);
  dataRange.setFontSize(10);
  dataRange.setVerticalAlignment('middle');

  for (var r = 2; r <= lastRow; r++) {
    if (r % 2 === 0) {
      sheet.getRange(r, 1, r, lastCol).setBackground(AKUU_COLORS.creamAlt);
    }
  }
}

function applyColumnWidths_(sheetName, sheet, lastCol) {
  var widths = COLUMN_WIDTHS[sheetName];
  if (!widths) return;
  for (var i = 0; i < Math.min(widths.length, lastCol); i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

function formatJournalSheet_(sheet, headers, lastRow) {
  if (lastRow < 2) return;
  applyDateFormat_(sheet, headers, ['journal_at', 'expense_date', 'validated_at'], lastRow);
  applyNumberFormat_(sheet, headers, ['amount_pen'], '#,##0.00 "PEN"', lastRow);
  applyNumberFormat_(sheet, headers, ['amount_eur'], '#,##0.00 "€"', lastRow);
  applyNumberFormat_(sheet, headers, ['exchange_rate'], '#,##0.0000', lastRow);
  applyTextFormat_(sheet, headers, ['reference', 'demand_reference'], lastRow, { bold: true, color: AKUU_COLORS.forest });
}

function formatFacturesSheet_(sheet, headers, lastRow) {
  if (lastRow < 2) return;
  applyDateFormat_(sheet, headers, ['created_at', 'expense_date', 'validated_at', 'reimbursed_at'], lastRow);
  applyNumberFormat_(sheet, headers, ['amount_pen'], '#,##0.00 "PEN"', lastRow);
  applyNumberFormat_(sheet, headers, ['amount_eur'], '#,##0.00 "€"', lastRow);
  applyStatusRules_(sheet, headers, 'status', lastRow, {
    validated: AKUU_COLORS.validated,
    pending: AKUU_COLORS.pending,
    rejected: AKUU_COLORS.rejected
  });
  applyStatusRules_(sheet, headers, 'reimbursement_status', lastRow, {
    to_pay: AKUU_COLORS.ochreLight,
    paid: AKUU_COLORS.validated,
    awaiting_validation: AKUU_COLORS.bleuLight,
    not_applicable: AKUU_COLORS.cream
  });
}

function formatDemandesSheet_(sheet, headers, lastRow) {
  if (lastRow < 2) return;
  applyDateFormat_(sheet, headers, ['created_at', 'needed_by_date', 'decided_at'], lastRow);
  applyNumberFormat_(sheet, headers, ['amount_pen_estimated'], '#,##0.00 "PEN"', lastRow);
  applyNumberFormat_(sheet, headers, ['amount_eur_estimated'], '#,##0.00 "€"', lastRow);
  applyStatusRules_(sheet, headers, 'status', lastRow, {
    approved: AKUU_COLORS.validated,
    awaiting_approval: AKUU_COLORS.pending,
    closed: AKUU_COLORS.creamAlt,
    rejected: AKUU_COLORS.rejected,
    cancelled: AKUU_COLORS.creamAlt
  });
  applyStatusRules_(sheet, headers, 'devis_status', lastRow, {
    validated: AKUU_COLORS.validated,
    pending: AKUU_COLORS.pending,
    rejected: AKUU_COLORS.rejected,
    not_required: AKUU_COLORS.creamAlt
  });
}

function formatProfileSheet_(sheet, lastRow, lastCol) {
  if (lastRow < 2) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  applyTextFormat_(sheet, headers, ['first_name', 'last_name'], lastRow, { bold: true });
  applyStatusRules_(sheet, headers, 'role', lastRow, {
    admin: AKUU_COLORS.forestLight,
    tresorier: AKUU_COLORS.bleuLight,
    benevole: AKUU_COLORS.leafLight
  });
}

function colIndex_(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]) === name) return i + 1;
  }
  return -1;
}

function applyDateFormat_(sheet, headers, colNames, lastRow) {
  colNames.forEach(function (name) {
    var col = colIndex_(headers, name);
    if (col > 0) sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('dd/mm/yyyy');
  });
}

function applyNumberFormat_(sheet, headers, colNames, pattern, lastRow) {
  colNames.forEach(function (name) {
    var col = colIndex_(headers, name);
    if (col > 0) {
      var range = sheet.getRange(2, col, lastRow - 1, 1);
      range.setNumberFormat(pattern);
      range.setHorizontalAlignment('right');
    }
  });
}

function applyTextFormat_(sheet, headers, colNames, lastRow, opts) {
  if (!colNames || !colNames.length || lastRow < 2) return;
  opts = opts || {};
  colNames.forEach(function (colName) {
    var col = colIndex_(headers, colName);
    if (col > 0) {
      var range = sheet.getRange(2, col, lastRow - 1, 1);
      if (opts.bold) range.setFontWeight('bold');
      if (opts.color) range.setFontColor(opts.color);
    }
  });
}

function applyStatusRules_(sheet, headers, colName, lastRow, colorMap) {
  var col = colIndex_(headers, colName);
  if (col < 1 || lastRow < 2) return;

  var range = sheet.getRange(2, col, lastRow - 1, 1);
  var rules = sheet.getConditionalFormatRules().filter(function (rule) {
    var ranges = rule.getRanges();
    for (var i = 0; i < ranges.length; i++) {
      if (ranges[i].getColumn() === col) return false;
    }
    return true;
  });

  Object.keys(colorMap).forEach(function (status) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(status)
        .setBackground(colorMap[status])
        .setFontColor(AKUU_COLORS.night)
        .setRanges([range])
        .build()
    );
  });

  sheet.setConditionalFormatRules(rules);
}
