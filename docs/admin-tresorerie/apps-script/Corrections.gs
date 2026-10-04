/**
 * Corrections du trésorier depuis le site (onglets Écritures et Factures).
 *
 *  - delete : refusé si l'exercice est clos (statut onglet Cloture). Motif obligatoire.
 *  - attach : ajout d'une facture à une écriture existante (toutes années). Le fichier est renommé
 *             AAAA-MM-JJ_RÉF_montant_fournisseur.ext et rangé dans 3_Trésorerie/<année>/Factures.
 *
 * Année en cours : appliquées tout de suite au Google Sheet du journal (statut « applied »).
 * Années clôturées (Excel) : ajout de facture enregistré « pending », appliqué au journal Excel par
 * RELEVES/outils/synchroniser_corrections.py.
 */

function correctionsSheet_() {
  var sheet = getSheet_('Corrections');
  if (sheet) return sheet;
  sheet = getSpreadsheet_().insertSheet('Corrections');
  sheet.appendRow(SHEET_HEADERS.Corrections);
  return sheet;
}

function listCorrections_(session) {
  requireTreasurer_(session);
  correctionsSheet_();
  return readAll_('Corrections');
}

function deletedReferences_() {
  var out = {};
  if (!getSheet_('Corrections')) return out;
  readAll_('Corrections').forEach(function (c) {
    if (c.type === 'delete' && c.status !== 'cancelled') out[c.reference] = true;
  });
  return out;
}

function requestDeletion_(session, body) {
  requireTreasurer_(session);
  var ref = String(body.reference || '').trim();
  var year = Number(body.year || 0);
  var reason = String(body.reason || '').trim();
  if (!ref) throw apiError_('VALIDATION_FAILED', 'Référence manquante');
  assertExerciceModifiable_(year);
  if (reason.length < 3) throw apiError_('VALIDATION_FAILED', 'Motif obligatoire');
  if (deletedReferences_()[ref]) throw apiError_('CONFLICT', 'Écriture déjà supprimée', 409);

  correctionsSheet_();
  var done = deleteFromYearJournal_(year, ref, session.email, reason);
  var c = {
    id: uuid_(), created_at: new Date().toISOString(), actor_email: session.email, type: 'delete',
    reference: ref, year: year, reason: reason, status: done ? 'applied' : 'pending',
    applied_at: done ? new Date().toISOString() : ''
  };
  appendRow_('Corrections', c);
  appendAudit_(session.email, 'journal_line_deleted', 'journal', ref, { year: year, reason: reason });
  return c;
}

/** Mise à jour en masse des modes de paiement dans Detail_PM. */
function bulkSyncPaymentModes_(session, body) {
  requireTreasurer_(session);
  var year = Number(body.year || 0);
  assertExerciceModifiable_(year);
  var updates = body.updates || [];
  if (!updates.length) throw apiError_('VALIDATION_FAILED', 'Liste updates vide');
  var items = [];
  updates.forEach(function (u) {
    if (!u.reference || !u.payment_method) return;
    var r = updateJournalLine_(year, String(u.reference), session.email, {
      payment_method: u.payment_method,
      reason: String(body.reason || 'sync compte depenses')
    });
    if (r) items.push(r);
  });
  return { year: year, updated: items.length, items: items };
}

function requestCreate_(session, body) {
  requireTreasurer_(session);
  var result = createJournalEntry_(session, body);
  correctionsSheet_();
  appendRow_('Corrections', {
    id: uuid_(), created_at: new Date().toISOString(), actor_email: session.email, type: 'create',
    reference: result.reference, year: result.year,
    reason: String(body.reason || 'Ajout depuis Écritures'), status: 'applied',
    applied_at: new Date().toISOString()
  });
  return result;
}

function requestUpdate_(session, body) {
  requireTreasurer_(session);
  var ref = String(body.reference || '').trim();
  var year = Number(body.year || 0);
  if (!ref) throw apiError_('VALIDATION_FAILED', 'Référence manquante');
  assertExerciceModifiable_(year);
  var hasPen = body.amount_pen != null && body.amount_pen !== '';
  var hasEur = body.amount_eur != null && body.amount_eur !== '';
  if (!body.project && !body.payment_method && !body.category && !hasPen && !hasEur && body.notes == null) {
    throw apiError_('VALIDATION_FAILED', 'Rien à modifier');
  }

  var result = updateJournalLine_(year, ref, session.email, {
    project: body.project,
    payment_method: body.payment_method,
    category: body.category,
    amount_pen: hasPen ? body.amount_pen : undefined,
    amount_eur: hasEur ? body.amount_eur : undefined,
    currency: body.currency || undefined,
    notes: body.notes != null ? body.notes : undefined,
    reason: body.reason || ''
  });
  if (!result) throw apiError_('NOT_FOUND', 'Écriture introuvable dans le journal ' + year, 404);

  correctionsSheet_();
  var c = {
    id: uuid_(), created_at: new Date().toISOString(), actor_email: session.email, type: 'update',
    reference: ref, year: year, reason: String(body.reason || ''), status: 'applied',
    applied_at: new Date().toISOString()
  };
  appendRow_('Corrections', c);
  return result;
}

function attachInvoice_(session, body) {
  requireTreasurer_(session);
  var ref = String(body.reference || '').trim();
  var year = Number(body.year || String(body.expense_date || '').substring(0, 4));
  if (!ref) throw apiError_('VALIDATION_FAILED', 'Référence manquante');
  if (!year || year < 2017 || year > new Date().getFullYear()) throw apiError_('VALIDATION_FAILED', 'Année invalide');

  var receipt = body._attachments && body._attachments.receipt;
  var blob = blobFromAttachment_(receipt, 'facture.pdf');
  if (!blob) throw apiError_('VALIDATION_FAILED', 'Fichier manquant');

  var name = buildStandardFilename_({
    expense_date: body.expense_date,
    reference: ref,
    currency: body.currency || (body.amount_pen ? 'PEN' : 'EUR'),
    amount_pen: body.amount_pen,
    amount_eur: body.amount_eur,
    vendor_name: body.vendor_name,
    label: body.label,
    ext: extensionFromAttachment_(receipt)
  });
  var info = uploadFactureFile_(blob, { fileName: name, year: year });

  correctionsSheet_();
  var done = attachInYearJournal_(year, ref, name, info.drive_file_url, session.email);
  var c = {
    id: uuid_(), created_at: new Date().toISOString(), actor_email: session.email, type: 'attach',
    reference: ref, year: year, reason: '', drive_file_id: info.drive_file_id,
    drive_file_url: info.drive_file_url, file_name: name, status: done ? 'applied' : 'pending',
    applied_at: done ? new Date().toISOString() : ''
  };
  appendRow_('Corrections', c);
  // Écriture saisie via l'application : on met aussi à jour le tableur
  if (findByReference_('Journal', ref)) updateRowByReference_('Journal', ref, { drive_file_url: info.drive_file_url });
  appendAudit_(session.email, 'invoice_attached', 'journal', ref, { file: name, year: year });
  return c;
}

/** Contenu du fichier (base64) pour que le script local le range aussi dans UPLOAD_DRIVE. */
function correctionFile_(session, id) {
  requireTreasurer_(session);
  var c = readAll_('Corrections').filter(function (r) { return r.id === id; })[0];
  if (!c || !c.drive_file_id) throw apiError_('NOT_FOUND', 'Correction sans fichier', 404);
  var blob = DriveApp.getFileById(c.drive_file_id).getBlob();
  return { file_name: c.file_name, mime: blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
}

function markCorrectionApplied_(session, id) {
  requireTreasurer_(session);
  var sheet = correctionsSheet_();
  var data = sheet.getDataRange().getValues();
  var h = data[0];
  var idIdx = h.indexOf('id'), stIdx = h.indexOf('status'), apIdx = h.indexOf('applied_at');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      sheet.getRange(i + 1, stIdx + 1).setValue('applied');
      sheet.getRange(i + 1, apIdx + 1).setValue(new Date().toISOString());
      return { id: id, status: 'applied' };
    }
  }
  throw apiError_('NOT_FOUND', 'Correction inconnue', 404);
}
`