/** Logique métier (miroir mockBackend.js) */

function getExchangeRate_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('pen_eur_rate');
  if (cached) return JSON.parse(cached);

  var rate = 0.24;
  var source = 'fallback';
  var date = todayIsoLocal_();
  try {
    var res = UrlFetchApp.fetch('https://api.frankfurter.app/latest?from=PEN&to=EUR', { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());
    rate = data.rates.EUR;
    source = 'Frankfurter/ECB';
    date = data.date;
  } catch (e) { /* fallback */ }

  var payload = { rate: rate, source: source, date: date };
  cache.put('pen_eur_rate', JSON.stringify(payload), 86400);
  return payload;
}

var ALLOWED_PROJECTS_ = ['musee', 'maison', 'akuuvision', 'anglais', 'hydrama', 'lowtech', 'dechets', 'sensibilisation', 'fonctionnement', 'divers'];
var ALLOWED_CATEGORIES_ = ['transport', 'hebergement_resto', 'materiel', 'equipement', 'communication', 'services_locaux', 'sante',
  'batiment_travaux', 'formation', 'banque_frais', 'admin_assurance', 'autre'];

function clip_(v, n) { return String(v === undefined || v === null ? '' : v).substring(0, n || 500); }

function createDemande_(session, body, internal) {
  if (ALLOWED_PROJECTS_.indexOf(String(body.project)) < 0) throw apiError_('VALIDATION_FAILED', 'Projet inconnu');
  if (ALLOWED_CATEGORIES_.indexOf(String(body.category)) < 0) throw apiError_('VALIDATION_FAILED', 'Catégorie inconnue');
  body.description = clip_(body.description, 500);
  body.justification = clip_(body.justification, 2000);
  if (!internal) { body.resubmission_of = ''; body.version = 1; }
  if (body.needed_by_date && body.needed_by_date < todayIsoLocal_()) {
    throw apiError_('VALIDATION_FAILED', 'La date d\'achat prévue ne peut pas être antérieure à aujourd\'hui.');
  }

  var rateInfo = getExchangeRate_();
  var amounts = parseDemandeAmounts_(body, rateInfo);
  var amountPen = amounts.amount_pen_estimated;
  var amountEur = amounts.amount_eur_estimated;

  var devisMeta = (body._attachments && body._attachments.devis) || [];
  checkAttachmentCount_(devisMeta);
  devisMeta.forEach(function (att, idx) { if (att && att.base64) checkedBlob_(att, 'devis-' + (idx + 1)); });
  if (requiresDevisAttachments_(amountPen) && devisMeta.length < MIN_DEVIS_ATTACHMENTS) {
    throw apiError_('VALIDATION_FAILED', 'Dépense > ' + DEVIS_PEN_THRESHOLD + ' S/. : joignez au moins ' + MIN_DEVIS_ATTACHMENTS + ' photos/PDF de devis fournisseurs.');
  }

  var year = new Date().getFullYear();
  var reference = nextReference_('DEM', year);
  var id = uuid_();

  var devisUploaded = uploadDevisFiles_(devisMeta, reference);

  var demande = {
    id: id,
    reference: reference,
    created_at: new Date().toISOString(),
    submitter_email: session.email,
    project: body.project,
    category: body.category,
    amount_pen_estimated: amountPen,
    amount_eur_estimated: amountEur,
    currency: amounts.currency,
    exchange_rate: rateInfo.rate,
    payment_type: body.payment_type,
    description: body.description,
    justification: body.justification,
    needed_by_date: body.needed_by_date,
    status: 'awaiting_approval',
    treasurer_email: '',
    decided_at: '',
    reject_reason: '',
    resubmission_of: body.resubmission_of || '',
    version: body.version || 1,
    devis_attachments_json: JSON.stringify(devisUploaded),
    devis_status: requiresDevisAttachments_(amountPen) ? 'pending' : 'not_required',
    devis_validated_at: '',
    devis_validated_by: ''
  };

  try {
    appendRow_('Demandes', demande);
  } catch (err) {
    trashUploaded_(devisUploaded);   // pas de fichier orphelin sur le Drive
    throw err;
  }
  appendAudit_(session.email, 'demande_created', 'demande', id, { reference: reference });

  var needsDevis = requiresDevisAttachments_(amountPen);
  if (needsDevis && devisUploaded.length >= MIN_DEVIS_ATTACHMENTS) {
    notifyTreasurersAndAdminMail_(buildDevisValidationEmail_({
      reference: reference,
      submitter: session.email,
      project: body.project,
      category: body.category,
      currency: amounts.currency,
      amount_pen: amountPen,
      amount_eur: amountEur,
      devis_count: devisUploaded.length,
      description: body.description,
      devis: devisUploaded
    }));
  } else if (!needsDevis) {
    notifyTreasurersMail_(buildNouvelleDemandeEmail_({
      reference: reference,
      submitter: session.email,
      currency: amounts.currency,
      amount_pen: amountPen,
      amount_eur: amountEur
    }));
  }

  demande.devis_attachments = devisUploaded;
  return demande;
}

function getDemandesMine_(session) {
  var mine = normTxt_(session.email);
  return readAll_('Demandes')
    .filter(function (d) { return normTxt_(d.submitter_email) === mine; })
    .map(rowToDemande_);
}

function normStatus_(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function getDemandesPending_() {
  return readAll_('Demandes')
    .filter(function (d) { return normStatus_(d.status) === 'awaiting_approval'; })
    .map(rowToDemande_);
}

function normDemandRef_(ref) {
  return String(ref || '').trim();
}

function roundPen_(n) {
  return Math.round(Number(n) * 100) / 100;
}

function normInvoicingStatus_(demande) {
  return String(demande && demande.invoicing_status || '').toLowerCase().trim();
}

function isInvoicingOpen_(demande) {
  var s = normInvoicingStatus_(demande);
  return !s || s === 'open';
}

/** Somme des factures non refusées rattachées à une demande (plusieurs tickets magasins possibles). */
function getDemandeFactureTotals_(demandRef, factures) {
  var ref = normDemandRef_(demandRef);
  var sumPen = 0;
  var sumEur = 0;
  var count = 0;
  (factures || readAll_('Factures')).forEach(function (f) {
    if (normDemandRef_(f.demand_reference) !== ref) return;
    if (normStatus_(f.status) === 'rejected') return;
    sumPen += Number(f.amount_pen) || 0;
    sumEur += Number(f.amount_eur) || 0;
    count++;
  });
  return { sum_pen: roundPen_(sumPen), sum_eur: roundPen_(sumEur), count: count };
}

/** Plafond demande (+10 %) moins déjà facturé (pending + validated). */
function getDemandeRemainingPen_(demandeOrRef, factures) {
  var d = typeof demandeOrRef === 'string' ? findByReference_('Demandes', demandeOrRef) : demandeOrRef;
  if (!d) return 0;
  var max = amountPenMax_(d.amount_pen_estimated);
  var totals = getDemandeFactureTotals_(d.reference, factures);
  return Math.max(0, roundPen_(max - totals.sum_pen));
}

function enrichDemandeFactureBudget_(demande, factures) {
  var ref = normDemandRef_(demande.reference);
  var totals = getDemandeFactureTotals_(demande.reference, factures);
  var maxPen = amountPenMax_(demande.amount_pen_estimated);
  var draftCount = 0;
  var pendingCount = 0;
  (factures || []).forEach(function (f) {
    if (normDemandRef_(f.demand_reference) !== ref) return;
    var st = normStatus_(f.status);
    if (st === 'draft') draftCount++;
    if (st === 'pending') pendingCount++;
  });
  demande.invoiced_pen = totals.sum_pen;
  demande.invoiced_eur = totals.sum_eur;
  demande.facture_count = totals.count;
  demande.draft_count = draftCount;
  demande.pending_facture_count = pendingCount;
  demande.invoicing_status = normInvoicingStatus_(demande) || (demande.status === 'approved' ? 'open' : '');
  demande.invoicing_submitted_at = demande.invoicing_submitted_at || '';
  demande.max_pen = maxPen;
  demande.remaining_pen = Math.max(0, roundPen_(maxPen - totals.sum_pen));
  return demande;
}

function getApprovedDemandes_(session) {
  var factures = readAll_('Factures');
  return readAll_('Demandes')
    .filter(function (d) {
      if (d.submitter_email !== session.email || d.status !== 'approved') return false;
      if (normInvoicingStatus_(d) === 'submitted') return false;
      return getDemandeRemainingPen_(d, factures) > 0;
    })
    .map(function (d) {
      return enrichDemandeFactureBudget_(rowToDemande_(d), factures);
    });
}

function validateDemandeDevis_(session, reference) {
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.status !== 'awaiting_approval') throw apiError_('VALIDATION_FAILED', 'Demande déjà traitée');
  assertNotSelf_(session, d.submitter_email, 'valider les devis de votre propre demande');
  if (!requiresDevisAttachments_(d.amount_pen_estimated)) {
    throw apiError_('VALIDATION_FAILED', 'Photos de devis non requises pour cette demande (≤ ' + DEVIS_PEN_THRESHOLD + ' S/.)');
  }
  var attachments = [];
  try { attachments = JSON.parse(d.devis_attachments_json || '[]'); } catch (e) {}
  if (attachments.length < MIN_DEVIS_ATTACHMENTS) {
    throw apiError_('VALIDATION_FAILED', 'Devis manquants — au moins ' + MIN_DEVIS_ATTACHMENTS + ' requis');
  }
  var validatedAt = new Date().toISOString();
  updateRowByReference_('Demandes', reference, {
    devis_status: 'validated',
    devis_validated_at: validatedAt,
    devis_validated_by: session.email
  });
  appendAudit_(session.email, 'devis_validated', 'demande', d.id, { reference: reference });
  d.devis_status = 'validated';
  d.devis_validated_at = validatedAt;
  d.devis_validated_by = session.email;
  return rowToDemande_(d);
}

function rejectDemandeDevis_(session, reference, reason) {
  if (!reason || !String(reason).trim()) throw apiError_('REJECT_REASON_REQUIRED', 'Motif de refus des devis obligatoire');
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.status !== 'awaiting_approval') throw apiError_('VALIDATION_FAILED', 'Demande déjà traitée');
  assertNotSelf_(session, d.submitter_email, 'refuser les devis de votre propre demande');
  if (!requiresDevisAttachments_(d.amount_pen_estimated)) {
    throw apiError_('VALIDATION_FAILED', 'Photos de devis non requises pour cette demande (≤ ' + DEVIS_PEN_THRESHOLD + ' S/.)');
  }
  reason = clip_(reason, 1000);
  updateRowByReference_('Demandes', reference, {
    devis_status: 'rejected',
    devis_reject_reason: String(reason).trim(),
    devis_validated_at: '',
    devis_validated_by: ''
  });
  appendAudit_(session.email, 'devis_rejected', 'demande', d.id, { reference: reference, reason: reason });
  sendUserMail_(d.submitter_email, buildDevisRejectedEmail_({
    reference: reference,
    reason: reason,
    description: d.description
  }));
  notifyTreasurersMail_('Devis refusés ' + reference, 'Refusés par ' + session.email + '\n\n' + reason);
  d.devis_status = 'rejected';
  d.devis_reject_reason = String(reason).trim();
  return rowToDemande_(d);
}

function resubmitDemandeDevis_(session, reference, body) {
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.submitter_email !== session.email) throw apiError_('FORBIDDEN', 'Demande non autorisée');
  if (d.status !== 'awaiting_approval') throw apiError_('VALIDATION_FAILED', 'Demande déjà traitée');
  if (String(d.devis_status || '') !== 'rejected') {
    throw apiError_('VALIDATION_FAILED', 'Seuls les devis refusés peuvent être renvoyés sur cette demande');
  }
  var devisMeta = (body._attachments && body._attachments.devis) || [];
  checkAttachmentCount_(devisMeta);
  devisMeta.forEach(function (att, idx) { if (att && att.base64) checkedBlob_(att, 'devis-' + (idx + 1)); });
  if (devisMeta.length < MIN_DEVIS_ATTACHMENTS) {
    throw apiError_('VALIDATION_FAILED', 'Au moins ' + MIN_DEVIS_ATTACHMENTS + ' devis requis.');
  }
  var oldAttachments = [];
  try { oldAttachments = JSON.parse(d.devis_attachments_json || '[]'); } catch (e) {}
  trashUploaded_(oldAttachments);
  var devisUploaded = uploadDevisFiles_(devisMeta, reference);
  try {
    updateRowByReference_('Demandes', reference, {
      devis_attachments_json: JSON.stringify(devisUploaded),
      devis_status: 'pending',
      devis_reject_reason: '',
      devis_validated_at: '',
      devis_validated_by: ''
    });
  } catch (err) {
    trashUploaded_(devisUploaded);
    throw err;
  }
  appendAudit_(session.email, 'devis_resubmitted', 'demande', d.id, { reference: reference, count: devisUploaded.length });
  notifyTreasurersAndAdminMail_(buildDevisValidationEmail_({
    reference: reference,
    submitter: session.email,
    project: d.project,
    category: d.category,
    currency: d.currency,
    amount_pen: d.amount_pen_estimated,
    amount_eur: d.amount_eur_estimated,
    devis_count: devisUploaded.length,
    description: d.description,
    devis: devisUploaded
  }));
  d.devis_attachments = devisUploaded;
  d.devis_status = 'pending';
  d.devis_reject_reason = '';
  return rowToDemande_(d);
}

function approveDemande_(session, reference) {
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.status !== 'awaiting_approval') throw apiError_('VALIDATION_FAILED', 'Demande déjà traitée');
  assertNotSelf_(session, d.submitter_email, 'approuver votre propre demande');
  if (requiresDevisAttachments_(d.amount_pen_estimated) && String(d.devis_status || 'pending') !== 'validated') {
    throw apiError_('DEVIS_NOT_VALIDATED', 'Validez les devis avant d\'approuver la demande');
  }

  var decided = new Date().toISOString();
  updateRowByReference_('Demandes', reference, {
    status: 'approved',
    treasurer_email: session.email,
    decided_at: decided,
    invoicing_status: 'open',
    invoicing_submitted_at: ''
  });

  appendAudit_(session.email, 'demande_approved', 'demande', d.id, { reference: reference });

  var approvedMail = buildDemandeApprovedEmail_({ reference: reference });
  sendUserMail_(d.submitter_email, approvedMail);
  notifyTreasurersMail_('Demande approuvée ' + reference, 'Approuvée par ' + session.email);

  d.status = 'approved';
  d.treasurer_email = session.email;
  d.decided_at = decided;
  d.emailSent = true;
  d.emailSubject = approvedMail.subject;
  return rowToDemande_(d);
}

function rejectDemande_(session, reference, reason) {
  if (!reason || !String(reason).trim()) throw apiError_('REJECT_REASON_REQUIRED', 'Motif de refus obligatoire');
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.status !== 'awaiting_approval') throw apiError_('VALIDATION_FAILED', 'Demande déjà traitée');
  reason = clip_(reason, 1000);

  updateRowByReference_('Demandes', reference, {
    status: 'rejected',
    reject_reason: String(reason).trim(),
    treasurer_email: session.email,
    decided_at: new Date().toISOString()
  });
  appendAudit_(session.email, 'demande_rejected', 'demande', d.id, { reference: reference, reason: reason });
  sendUserMail_(d.submitter_email, buildDemandeRejectedEmail_({ reference: reference, reason: reason }));
  return findByReference_('Demandes', reference);
}

function resubmitDemande_(session, parentId, body) {
  var all = readAll_('Demandes');
  var parent = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === parentId) parent = all[i];
  }
  if (!parent || parent.submitter_email !== session.email) {
    throw apiError_('DEMAND_NOT_FOUND', 'Demande parente introuvable');
  }
  var siblings = all.filter(function (d) { return d.resubmission_of === parentId || d.id === parentId; });
  var version = 1;
  siblings.forEach(function (s) { version = Math.max(version, Number(s.version) || 1); });
  body.resubmission_of = parentId;
  body.version = version + 1;
  return createDemande_(session, body, true);
}

function createFacture_(session, body) {
  var demande = findByReference_('Demandes', body.demand_reference);
  if (!demande) throw apiError_('DEMAND_NOT_FOUND', 'Référence demande introuvable');
  if (demande.status !== 'approved') throw apiError_('DEMAND_NOT_APPROVED', 'Demande non approuvée');
  if (demande.submitter_email !== session.email) throw apiError_('FORBIDDEN', 'Demande non autorisée');
  body.demand_reference = normDemandRef_(body.demand_reference);
  var remainingPen = getDemandeRemainingPen_(demande);
  if (remainingPen <= 0) {
    throw apiError_('CONFLICT', 'Le plafond de la demande ' + body.demand_reference + ' est déjà entièrement couvert par des factures.', 409);
  }
  if (!isInvoicingOpen_(demande)) {
    throw apiError_('CONFLICT', 'Ce devis est clôturé et en attente de validation trésorier. Ajoutez des factures après traitement ou contactez le trésorier.', 409);
  }
  body.resubmission_of = '';
  // Fichier contrôlé AVANT d'attribuer un numéro (pas de trou dans la numérotation si le fichier est refusé)
  var receiptBlobFac = blobFromAttachment_(body._attachments && body._attachments.receipt, 'facture.pdf');

  var rateInfo = getExchangeRate_();
  var amounts = parseFactureAmounts_(body, rateInfo);
  var amountPen = amounts.amount_pen;
  if (amountPen > remainingPen + 0.001) {
    throw apiError_('VALIDATION_FAILED',
      'Montant supérieur au reste à facturer : ' + remainingPen + ' PEN restants (plafond demande +' + AMOUNT_TOLERANCE_PERCENT + ' %).');
  }
  if (normalizeCurrency_(body.currency) !== normalizeCurrency_(demande.currency)) {
    throw apiError_('VALIDATION_FAILED', 'La devise doit correspondre à la demande approuvée');
  }
  if (body.project !== demande.project || body.category !== demande.category ||
      body.payment_type !== demande.payment_type || body.label !== demande.description) {
    throw apiError_('VALIDATION_FAILED', 'Champs figés invalides');
  }

  var year = new Date().getFullYear();
  var reference = nextReference_('FAC', year);
  var id = uuid_();

  var receipt = body._attachments && body._attachments.receipt;
  var driveInfo = { drive_file_id: '', drive_file_url: '', file_name: '' };
  var blob = receiptBlobFac;
  if (blob) {
    var standardName = buildStandardFilename_({
      expense_date: body.expense_date,
      reference: reference,
      currency: amounts.currency,
      amount_pen: amounts.amount_pen,
      amount_eur: amounts.amount_eur,
      vendor_name: body.vendor_name,
      label: body.label,
      ext: extensionFromAttachment_(receipt)
    });
    driveInfo = uploadFactureFile_(blob, { fileName: standardName });
    driveInfo.file_name = driveInfo.file_name || standardName;
  }

  var facture = {
    id: id,
    reference: reference,
    demand_reference: body.demand_reference,
    entry_source: 'demande',
    created_at: new Date().toISOString(),
    expense_date: body.expense_date,
    submitter_email: session.email,
    project: body.project,
    category: body.category,
    amount_pen: amountPen,
    amount_eur: amounts.amount_eur,
    currency: amounts.currency,
    exchange_rate: rateInfo.rate,
    exchange_source: rateInfo.source + ' · ' + rateInfo.date,
    payment_type: body.payment_type,
    payment_method: body.payment_method,
    paid_by: body.paid_by,
    vendor_name: body.vendor_name,
    receipt_number: body.receipt_number || '',
    location: body.location,
    label: body.label,
    status: 'draft',
    drive_file_id: driveInfo.drive_file_id,
    drive_file_url: driveInfo.drive_file_url,
    file_name: driveInfo.file_name || '',
    treasurer_email: '',
    validated_at: '',
    reject_reason: '',
    resubmission_of: body.resubmission_of || '',
    reimbursement_status: body.payment_type === 'avance_benevole' ? 'awaiting_validation' : 'not_applicable',
    reimbursed_at: '',
    reimbursed_by: ''
  };

  try {
    appendRow_('Factures', facture);
  } catch (err) {
    trashUploaded_([driveInfo]);
    throw err;
  }
  appendAudit_(session.email, 'facture_created', 'facture', id, { reference: reference, status: 'draft' });

  if (!normInvoicingStatus_(demande)) {
    updateRowByReference_('Demandes', body.demand_reference, { invoicing_status: 'open' });
  }

  return facture;
}

function isFactureVisibleToTreasurer_(facture, demande) {
  if (normStatus_(facture.status) !== 'pending') return false;
  if (!facture.demand_reference) return true;
  if (!demande) return true;
  var inv = normInvoicingStatus_(demande);
  return !inv || inv === 'submitted';
}

function getFacturesPending_() {
  var demandesByRef = {};
  readAll_('Demandes').forEach(function (d) {
    demandesByRef[normDemandRef_(d.reference)] = d;
  });
  return readAll_('Factures').filter(function (f) {
    var d = demandesByRef[normDemandRef_(f.demand_reference)];
    return isFactureVisibleToTreasurer_(f, d);
  });
}

function closeDemandeInvoicing_(session, reference) {
  var d = findByReference_('Demandes', reference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  if (d.status !== 'approved') throw apiError_('DEMAND_NOT_APPROVED', 'Demande non approuvée');
  if (d.submitter_email !== session.email) throw apiError_('FORBIDDEN', 'Demande non autorisée');
  if (normInvoicingStatus_(d) === 'submitted') {
    throw apiError_('CONFLICT', 'Ce devis est déjà clôturé et envoyé au trésorier.', 409);
  }
  var ref = normDemandRef_(reference);
  var drafts = readAll_('Factures').filter(function (f) {
    return normDemandRef_(f.demand_reference) === ref && normStatus_(f.status) === 'draft';
  });
  if (!drafts.length) {
    throw apiError_('VALIDATION_FAILED', 'Aucune facture en brouillon — ajoutez au moins une facture avant de clore le devis.');
  }
  var submittedAt = new Date().toISOString();
  updateRowByReference_('Demandes', reference, {
    invoicing_status: 'submitted',
    invoicing_submitted_at: submittedAt
  });
  var sumPen = 0;
  var sumEur = 0;
  var refs = [];
  drafts.forEach(function (f) {
    updateRowByReference_('Factures', f.reference, { status: 'pending' });
    sumPen += Number(f.amount_pen) || 0;
    sumEur += Number(f.amount_eur) || 0;
    refs.push(f.reference);
  });
  appendAudit_(session.email, 'demande_invoicing_closed', 'demande', d.id, {
    reference: reference,
    facture_count: refs.length,
    facture_references: refs
  });
  notifyTreasurersAndAdminMail_(buildFacturesLotEmail_({
    demand_reference: reference,
    submitter: session.email,
    facture_count: refs.length,
    facture_references: refs,
    amount_pen: roundPen_(sumPen),
    amount_eur: roundPen_(sumEur),
    currency: d.currency || 'PEN'
  }));
  d.invoicing_status = 'submitted';
  d.invoicing_submitted_at = submittedAt;
  return enrichDemandeFactureBudget_(rowToDemande_(d), readAll_('Factures'));
}

function maybeReopenDemandeInvoicing_(demandRef) {
  var d = findByReference_('Demandes', demandRef);
  if (!d || normInvoicingStatus_(d) !== 'submitted') return;
  var ref = normDemandRef_(demandRef);
  var stillPending = readAll_('Factures').some(function (f) {
    return normDemandRef_(f.demand_reference) === ref && normStatus_(f.status) === 'pending';
  });
  if (!stillPending) {
    updateRowByReference_('Demandes', demandRef, { invoicing_status: 'open', invoicing_submitted_at: '' });
  }
}

function validateDemandeFactures_(session, demandReference) {
  var d = findByReference_('Demandes', demandReference);
  if (!d) throw apiError_('DEMAND_NOT_FOUND', 'Demande introuvable');
  var ref = normDemandRef_(demandReference);
  var pending = readAll_('Factures').filter(function (f) {
    return normDemandRef_(f.demand_reference) === ref && normStatus_(f.status) === 'pending';
  });
  if (!pending.length) throw apiError_('VALIDATION_FAILED', 'Aucune facture en attente pour cette demande');
  pending.forEach(function (f) {
    assertNotSelf_(session, f.submitter_email, 'valider les factures de votre propre demande');
  });
  var validatedAt = new Date().toISOString();
  var validatedRefs = [];
  pending.forEach(function (f) {
    var reimbStatus = f.payment_type === 'avance_benevole' ? 'to_pay' : 'not_applicable';
    updateRowByReference_('Factures', f.reference, {
      status: 'validated',
      treasurer_email: session.email,
      validated_at: validatedAt,
      reimbursement_status: reimbStatus
    });
    f.status = 'validated';
    f.validated_at = validatedAt;
    f.reimbursement_status = reimbStatus;
    appendJournalFromFacture_(f, session.email, validatedAt);
    validatedRefs.push(f.reference);
  });
  appendAudit_(session.email, 'demande_factures_validated', 'demande', d.id, {
    reference: demandReference,
    facture_references: validatedRefs
  });
  if (getDemandeRemainingPen_(findByReference_('Demandes', demandReference)) > 0) {
    updateRowByReference_('Demandes', demandReference, { invoicing_status: 'open', invoicing_submitted_at: '' });
  }
  sendUserMail_(d.submitter_email, buildFacturesLotValidatedEmail_({
    demand_reference: demandReference,
    references: validatedRefs
  }));
  return {
    demand_reference: demandReference,
    validated: validatedRefs,
    count: validatedRefs.length,
    validated_at: validatedAt
  };
}

/** Compteurs pour diagnostic Validation (trésorier). */
function getValidationStats_(session) {
  requireTreasurer_(session);
  var demandes = readAll_('Demandes');
  var factures = readAll_('Factures');
  var byStatus = {};
  demandes.forEach(function (d) {
    var s = normStatus_(d.status) || 'unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
  });
  var facByStatus = {};
  factures.forEach(function (f) {
    var s = normStatus_(f.status) || 'unknown';
    facByStatus[s] = (facByStatus[s] || 0) + 1;
  });
  var ss = getSpreadsheet_();
  return {
    demandes_total: demandes.length,
    demandes_pending: demandes.filter(function (d) { return normStatus_(d.status) === 'pending'; }).length,
    demandes_by_status: byStatus,
    factures_total: factures.length,
    factures_pending: factures.filter(function (f) { return normStatus_(f.status) === 'pending'; }).length,
    factures_by_status: facByStatus,
    spreadsheet_url: ss.getUrl(),
    demandes_sheet_exists: Boolean(getSheet_('Demandes'))
  };
}

function appendJournalFromFacture_(f, treasurerEmail, validatedAt) {
  appendRow_('Journal', {
    journal_at: validatedAt,
    reference: f.reference,
    demand_reference: f.demand_reference || '',
    expense_date: f.expense_date,
    submitter_email: f.submitter_email,
    project: f.project,
    category: f.category,
    amount_pen: f.amount_pen,
    amount_eur: f.amount_eur,
    exchange_rate: f.exchange_rate,
    label: f.label,
    drive_file_url: f.drive_file_url || '',
    treasurer_email: treasurerEmail,
    validated_at: validatedAt
  });
  // Journal de l'année (Google Sheet, source unique de l'année en cours)
  try { appendToYearJournal_(f); } catch (e) { Logger.log('appendToYearJournal_ : ' + e); }
}

function validateFacture_(session, reference) {
  var f = findByReference_('Factures', reference);
  if (!f) throw apiError_('DEMAND_NOT_FOUND', 'Facture introuvable');
  if (f.status !== 'pending') throw apiError_('CONFLICT', 'Facture déjà traitée (' + f.status + ')', 409);
  assertNotSelf_(session, f.submitter_email, 'valider votre propre facture');
  var validatedAt = new Date().toISOString();
  var reimbStatus = f.payment_type === 'avance_benevole' ? 'to_pay' : 'not_applicable';
  updateRowByReference_('Factures', reference, {
    status: 'validated',
    treasurer_email: session.email,
    validated_at: validatedAt,
    reimbursement_status: reimbStatus
  });
  appendJournalFromFacture_(f, session.email, validatedAt);
  appendAudit_(session.email, 'facture_validated', 'facture', f.id, { reference: reference });
  sendUserMail_(f.submitter_email, buildFactureValidatedEmail_({ reference: reference }));
  f.status = 'validated';
  f.validated_at = validatedAt;
  f.reimbursement_status = reimbStatus;
  return f;
}

function createDirectExpense_(session, body) {
  requireTreasurer_(session);

  if (OPERATING_EXPENSE_CATEGORIES.indexOf(String(body.category || '')) < 0) {
    throw apiError_('VALIDATION_FAILED', 'Catégorie non autorisée pour saisie directe');
  }
  if (DIRECT_EXPENSE_PAYMENT_TYPES.indexOf(String(body.payment_type || '')) < 0) {
    throw apiError_('VALIDATION_FAILED', 'Type de flux non autorisé pour saisie directe');
  }
  if (!body.label || !String(body.label).trim()) {
    throw apiError_('VALIDATION_FAILED', 'Libellé obligatoire');
  }
  if (!body.vendor_name || !String(body.vendor_name).trim()) {
    throw apiError_('VALIDATION_FAILED', 'Fournisseur obligatoire');
  }
  if (!body.expense_date) {
    throw apiError_('VALIDATION_FAILED', 'Date obligatoire');
  }

  var rateInfo = getExchangeRate_();
  var amounts = parseFactureAmounts_(body, rateInfo);
  if (!amounts.amount_pen || amounts.amount_pen <= 0) {
    throw apiError_('VALIDATION_FAILED', 'Montant invalide');
  }

  var receiptBlobDir = blobFromAttachment_(body._attachments && body._attachments.receipt, 'justificatif.pdf');
  var year = new Date().getFullYear();
  var reference = nextReference_('FAC', year);
  var id = uuid_();
  var validatedAt = new Date().toISOString();

  var receipt = body._attachments && body._attachments.receipt;
  var driveInfo = { drive_file_id: '', drive_file_url: '', file_name: '' };
  var blob = receiptBlobDir;
  if (blob) {
    var standardName = buildStandardFilename_({
      expense_date: body.expense_date,
      reference: reference,
      currency: amounts.currency,
      amount_pen: amounts.amount_pen,
      amount_eur: amounts.amount_eur,
      vendor_name: body.vendor_name,
      label: body.label,
      ext: extensionFromAttachment_(receipt)
    });
    driveInfo = uploadFactureFile_(blob, { fileName: standardName });
    driveInfo.file_name = driveInfo.file_name || standardName;
  }

  var facture = {
    id: id,
    reference: reference,
    demand_reference: '',
    entry_source: 'direct',
    created_at: validatedAt,
    expense_date: body.expense_date,
    submitter_email: session.email,
    project: OPERATING_EXPENSE_PROJECT,
    category: body.category,
    amount_pen: amounts.amount_pen,
    amount_eur: amounts.amount_eur,
    currency: amounts.currency,
    exchange_rate: rateInfo.rate,
    exchange_source: rateInfo.source + ' · ' + rateInfo.date,
    payment_type: body.payment_type,
    payment_method: body.payment_method,
    paid_by: 'AKUU',
    vendor_name: String(body.vendor_name).trim(),
    receipt_number: body.receipt_number || '',
    location: body.location || 'France',
    label: String(body.label).trim(),
    status: 'validated',
    drive_file_id: driveInfo.drive_file_id,
    drive_file_url: driveInfo.drive_file_url,
    file_name: driveInfo.file_name || '',
    treasurer_email: session.email,
    validated_at: validatedAt,
    reject_reason: '',
    resubmission_of: '',
    reimbursement_status: 'not_applicable',
    reimbursed_at: '',
    reimbursed_by: ''
  };

  appendRow_('Factures', facture);
  appendJournalFromFacture_(facture, session.email, validatedAt);
  appendAudit_(session.email, 'direct_expense_created', 'facture', id, { reference: reference, category: body.category });

  notifyTreasurersAndAdminMail_(buildFraisFonctionnementEmail_({
    reference: reference,
    submitter: session.email,
    label: facture.label,
    currency: amounts.currency,
    amount_pen: amounts.amount_pen,
    amount_eur: amounts.amount_eur
  }));

  return facture;
}

function reimburseFacture_(session, reference) {
  var f = findByReference_('Factures', reference);
  if (!f) throw apiError_('DEMAND_NOT_FOUND', 'Facture introuvable');
  if (f.payment_type !== 'avance_benevole') {
    throw apiError_('VALIDATION_FAILED', 'Remboursement réservé aux avances bénévoles');
  }
  if (f.status !== 'validated') {
    throw apiError_('VALIDATION_FAILED', 'La facture doit être validée avant remboursement');
  }
  var reimb = String(f.reimbursement_status || '').toLowerCase();
  if (reimb === 'paid') throw apiError_('VALIDATION_FAILED', 'Déjà remboursé');
  var paidAt = new Date().toISOString();
  updateRowByReference_('Factures', reference, {
    reimbursement_status: 'paid',
    reimbursed_at: paidAt,
    reimbursed_by: session.email
  });
  appendAudit_(session.email, 'facture_reimbursed', 'facture', f.id, { reference: reference });
  f.reimbursement_status = 'paid';
  f.reimbursed_at = paidAt;
  f.reimbursed_by = session.email;
  return f;
}

function getReimbursementsPending_() {
  return readAll_('Factures').filter(function (f) {
    if (f.payment_type !== 'avance_benevole' || f.status !== 'validated') return false;
    var s = String(f.reimbursement_status || '').toLowerCase();
    return !s || s === 'to_pay';
  });
}

function rejectFacture_(session, reference, reason) {
  if (!reason || !String(reason).trim()) throw apiError_('REJECT_REASON_REQUIRED', 'Motif obligatoire');
  var f = findByReference_('Factures', reference);
  if (!f) throw apiError_('DEMAND_NOT_FOUND', 'Facture introuvable');
  if (f.status !== 'pending') throw apiError_('CONFLICT', 'Facture déjà traitée (' + f.status + ')', 409);
  reason = clip_(reason, 1000);
  updateRowByReference_('Factures', reference, {
    status: 'rejected',
    reject_reason: String(reason).trim(),
    treasurer_email: session.email
  });
  appendAudit_(session.email, 'facture_rejected', 'facture', f.id, { reference: reference });
  sendUserMail_(f.submitter_email, buildFactureRejectedEmail_({
    reference: reference,
    demand_reference: f.demand_reference,
    reason: reason
  }));
  if (f.demand_reference) maybeReopenDemandeInvoicing_(f.demand_reference);
  return findByReference_('Factures', reference);
}

function historyAccessAll_(session) {
  return isTreasurerRole_(session.role) ||
    String(session.email || '').toLowerCase() === getAdminEmail_();
}

/** Dates Sheet → ISO string (évite les réponses JSON illisibles côté navigateur). */
function sanitizeHistoryRows_(rows) {
  return (rows || []).map(function (r) {
    var o = {};
    Object.keys(r).forEach(function (k) {
      var v = r[k];
      if (v instanceof Date) {
        o[k] = Utilities.formatDate(v, 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss");
      } else if (v === null || v === undefined) {
        o[k] = '';
      } else {
        o[k] = v;
      }
    });
    return o;
  });
}

function listAllDemandes_(session) {
  var rows = readAll_('Demandes').map(rowToDemande_);
  if (!historyAccessAll_(session)) {
    var mine = normTxt_(session.email);
    rows = rows.filter(function (d) { return normTxt_(d.submitter_email) === mine; });
  }
  rows.sort(function (a, b) {
    return String(b.created_at || '').localeCompare(String(a.created_at || ''));
  });
  return sanitizeHistoryRows_(rows);
}

function listAllFactures_(session) {
  var rows = readAll_('Factures');
  if (!historyAccessAll_(session)) {
    var mine = normTxt_(session.email);
    rows = rows.filter(function (f) { return normTxt_(f.submitter_email) === mine; });
  }
  rows.sort(function (a, b) {
    return String(b.created_at || b.expense_date || '').localeCompare(String(a.created_at || a.expense_date || ''));
  });
  return sanitizeHistoryRows_(rows);
}

function listAuditLog_(session) {
  var rows = readAll_('Audit');
  if (!historyAccessAll_(session)) {
    var mine = normTxt_(session.email);
    rows = rows.filter(function (a) { return normTxt_(a.actor_email) === mine; });
  }
  rows.sort(function (a, b) {
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
  return sanitizeHistoryRows_(rows);
}

function getHistory_(session) {
  return {
    demandes: listAllDemandes_(session),
    factures: listAllFactures_(session),
    audit: listAuditLog_(session)
  };
}

function getCompta_(session) {
  requireTreasurer_(session);
  var deleted = deletedReferences_();
  var journal = readAll_('Journal').filter(function (r) { return !deleted[r.reference]; });
  journal.sort(function (a, b) {
    return String(b.expense_date || b.journal_at).localeCompare(String(a.expense_date || a.journal_at));
  });
  return { journal: journal, summary: buildComptaSummary_(journal) };
}

function buildComptaSummary_(journal) {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var ytdPen = 0;
  var ytdEur = 0;
  var monthPen = 0;
  var monthEur = 0;
  var byProject = {};

  journal.forEach(function (r) {
    var pen = Number(r.amount_pen) || 0;
    var eur = Number(r.amount_eur) || 0;
    var raw = r.expense_date || r.journal_at;
    var d = raw ? new Date(raw) : null;

    if (d && !isNaN(d.getTime())) {
      if (d.getFullYear() === year) {
        ytdPen += pen;
        ytdEur += eur;
        if (d.getMonth() === month) {
          monthPen += pen;
          monthEur += eur;
        }
      }
    } else {
      ytdPen += pen;
      ytdEur += eur;
    }

    var p = String(r.project || 'divers');
    if (!byProject[p]) byProject[p] = { project: p, amount_pen: 0, amount_eur: 0, count: 0 };
    byProject[p].amount_pen += pen;
    byProject[p].amount_eur += eur;
    byProject[p].count += 1;
  });

  var round2 = function (n) { return Math.round(n * 100) / 100; };
  var projects = Object.keys(byProject).map(function (k) { return byProject[k]; });
  projects.sort(function (a, b) { return b.amount_pen - a.amount_pen; });

  return {
    year: year,
    month: month + 1,
    total_pen_ytd: round2(ytdPen),
    total_eur_ytd: round2(ytdEur),
    total_pen_month: round2(monthPen),
    total_eur_month: round2(monthEur),
    entry_count: journal.length,
    by_project: projects
  };
}


/** Séparation des tâches : trésorier ≠ sa propre dépense · admin / mode test autorisés (audit). */
function assertNotSelf_(session, ownerEmail, action) {
  if (String(ownerEmail || '').toLowerCase() !== String(session.email || '').toLowerCase()) return;
  if (allowSelfValidation_(session)) {
    appendAudit_(session.email, 'self_decision_admin', 'controle', ownerEmail, { action: action });
    return;
  }
  throw apiError_('FORBIDDEN', 'Vous ne pouvez pas ' + action + ' : un autre trésorier doit le faire.', 403);
}

function trashUploaded_(list) {
  (list || []).forEach(function (x) {
    if (x && x.drive_file_id) { try { DriveApp.getFileById(x.drive_file_id).setTrashed(true); } catch (e) { /* ignore */ } }
  });
}
