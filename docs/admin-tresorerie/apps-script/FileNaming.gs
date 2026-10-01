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
  var val;
  if (cur === 'PEN') {
    val = amountPen != null && amountPen !== '' ? amountPen : amountEur;
    if ((amountPen == null || amountPen === '') && amountEur != null && amountEur !== '') {
      return formatAmountForFilename_('EUR', null, amountEur);
    }
  } else {
    val = amountEur != null && amountEur !== '' ? amountEur : amountPen;
  }
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
