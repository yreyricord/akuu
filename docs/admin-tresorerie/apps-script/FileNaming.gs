/** Nommage standard pièces comptables (miroir completer_factures_upload.py). */

function slugify_(text, maxLen) {
  maxLen = maxLen || 48;
  var s = String(text || 'piece').trim().toLowerCase();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!s) s = 'piece';
  return s.substring(0, maxLen).replace(/-+$/g, '');
}

function formatAmountForFilename_(currency, amountPen, amountEur) {
  var cur = String(currency || 'EUR').toUpperCase();
  var val = cur === 'PEN'
    ? (amountPen != null && amountPen !== '' ? amountPen : null)
    : (amountEur != null && amountEur !== '' ? amountEur : null);
  if (val == null || val === '') return { amount: '0', currency: cur };
  var n = Number(val);
  if (isNaN(n)) return { amount: '0', currency: cur };
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return { amount: String(Math.round(n)), currency: cur };
  }
  return { amount: n.toFixed(2).replace('.', '_'), currency: cur };
}

/**
 * YYYY-MM-DD_AKUU-FAC-YYYY-NNNN_{montant}{devise}_{slug}.pdf
 */
function buildStandardFilename_(opts) {
  var datePart = String(opts.expense_date || '').substring(0, 10) || '0000-00-00';
  var ref = opts.reference || 'AKUU-FAC-0000-0000';
  var fmt = formatAmountForFilename_(opts.currency, opts.amount_pen, opts.amount_eur);
  var slug = slugify_(opts.vendor_name || opts.label);
  var ext = opts.ext || '.pdf';
  if (ext.charAt(0) !== '.') ext = '.' + ext;
  ext = ext.toLowerCase();
  return datePart + '_' + ref + '_' + fmt.amount + fmt.currency + '_' + slug + ext;
}

function extFromPieceFilename_(name) {
  var m = String(name || '').match(/(\.[a-z0-9]{1,5})$/i);
  return m ? m[1].toLowerCase() : '.pdf';
}

function driveFileIdFromUrl_(url) {
  var m = String(url || '').match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

/** Renomme la pièce Drive si montant ou devise de référence change. */
function maybeRenameJournalPiece_(hit, after, reference, setCol) {
  var url = String(after.drive_file_url || hit.row.drive_file_url || '').trim();
  if (!url) return;
  var cur = String(after.currency || hit.row.currency || 'EUR').toUpperCase();
  var pen = cur === 'PEN' ? (after.amount_pen != null ? after.amount_pen : hit.row.amount_pen) : null;
  var eur = cur === 'EUR' ? (after.amount_eur != null ? after.amount_eur : hit.row.amount_eur) : null;
  var newName = buildStandardFilename_({
    expense_date: isoDate_(after.expense_date || hit.row.expense_date),
    reference: reference,
    currency: cur,
    amount_pen: pen,
    amount_eur: eur,
    vendor_name: after.vendor_name || hit.row.vendor_name,
    label: after.label || hit.row.label,
    ext: extFromPieceFilename_(after.piece_filename || hit.row.piece_filename)
  });
  try {
    var fid = driveFileIdFromUrl_(url);
    if (fid) DriveApp.getFileById(fid).setName(newName);
  } catch (e) {
    Logger.log('maybeRenameJournalPiece_ : ' + e);
  }
  after.piece_filename = newName;
  setCol('piece_filename', newName);
}
