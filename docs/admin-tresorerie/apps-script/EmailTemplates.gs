/** Templates HTML emails AKUU — branding + liens directs espace adhérent */

var EMAIL_BRAND_ = {
  green: '#2D6915',
  greenDark: '#1f4810',
  cream: '#f7f5f0',
  night: '#1c1917',
  muted: '#78716c',
  blue: '#1d4ed8',
  border: '#e7e5e4'
};

var PROJECT_LABELS_ = {
  musee: 'Musée Shapishiko',
  maison: 'Projet Maison communautaire',
  akuuvision: 'AKUUVision',
  anglais: "Cours d'anglais",
  hydrama: 'Hydrama',
  lowtech: 'Low Tech',
  dechets: 'Gestion des déchets',
  sensibilisation: 'Sensibilisation',
  fonctionnement: 'Frais de fonctionnement',
  divers: 'Divers / non affecté'
};

var CATEGORY_LABELS_ = {
  transport: 'Transport & logistique',
  hebergement_resto: 'Hébergement & restauration mission',
  materiel: 'Matériel & fournitures',
  equipement: 'Équipement durable',
  communication: 'Communication',
  services_locaux: 'Services locaux & main-d\'œuvre',
  sante: 'Santé & pharmacie',
  batiment_travaux: 'Bâtiment & travaux',
  formation: 'Formation & animation',
  banque_frais: 'Frais bancaires & change',
  admin_assurance: 'Administratif & assurance',
  autre: 'Autre'
};

function getSiteUrl_() {
  return String(getProp_('SITE_URL', 'https://www.akuu.org')).replace(/\/+$/, '');
}

function getLogoUrl_() {
  return getSiteUrl_() + '/images/LOGOAKUU.png';
}

/** Lien direct espace admin (redirection login automatique si non connecté). */
function getAdminUrl_(module, tab, extra) {
  extra = extra || {};
  var params = [];
  if (module) params.push('module=' + encodeURIComponent(module));
  if (tab) params.push('tab=' + encodeURIComponent(tab));
  if (extra.ref) params.push('ref=' + encodeURIComponent(extra.ref));
  return getSiteUrl_() + '/admin' + (params.length ? '?' + params.join('&') : '');
}

function escapeHtml_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelProject_(code) {
  return PROJECT_LABELS_[String(code || '')] || String(code || '—');
}

function labelCategory_(code) {
  return CATEGORY_LABELS_[String(code || '')] || String(code || '—');
}

function formatAmountLabel_(currency, amountPen, amountEur) {
  if (String(currency || '').toUpperCase() === 'EUR') {
    return amountEur + ' EUR (~' + amountPen + ' PEN)';
  }
  return amountPen + ' PEN (~' + amountEur + ' EUR)';
}

function buildDetailRowsHtml_(rows) {
  return (rows || []).map(function (row) {
    return '<tr>' +
      '<td style="padding:8px 0;color:' + EMAIL_BRAND_.muted + ';font-size:14px;width:38%;vertical-align:top;">' +
      escapeHtml_(row.label) + '</td>' +
      '<td style="padding:8px 0;color:' + EMAIL_BRAND_.night + ';font-size:14px;font-weight:600;vertical-align:top;">' +
      (row.html || escapeHtml_(row.value)) + '</td>' +
      '</tr>';
  }).join('');
}

function buildDevisLinksHtml_(devisList) {
  if (!devisList || !devisList.length) return '';
  var items = devisList.map(function (d, i) {
    var name = escapeHtml_(d.name || ('Devis ' + (i + 1)));
    if (d.drive_file_url) {
      return '<li style="margin:0 0 8px;"><a href="' + escapeHtml_(d.drive_file_url) + '" style="color:' +
        EMAIL_BRAND_.blue + ';text-decoration:none;font-weight:600;">' + name + '</a></li>';
    }
    return '<li style="margin:0 0 8px;color:' + EMAIL_BRAND_.night + ';">' + name + '</li>';
  }).join('');
  return '<div style="margin-top:20px;padding:16px;background:#f0f7ff;border-radius:12px;border:1px solid #dbeafe;">' +
    '<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:' + EMAIL_BRAND_.night + ';">Devis joints</p>' +
    '<ul style="margin:0;padding-left:18px;font-size:14px;">' + items + '</ul></div>';
}

function buildDevisLinksPlain_(devisList) {
  if (!devisList || !devisList.length) return '';
  var lines = ['Devis joints :'];
  devisList.forEach(function (d, i) {
    lines.push('  ' + (i + 1) + '. ' + (d.name || 'devis') + (d.drive_file_url ? '\n     ' + d.drive_file_url : ''));
  });
  return lines.join('\n');
}

function buildEmailLayout_(opts) {
  opts = opts || {};
  var title = escapeHtml_(opts.title || 'AKUU');
  var preheader = escapeHtml_(opts.preheader || '');
  var intro = opts.introHtml || '';
  var details = opts.detailsHtml || '';
  var extra = opts.extraHtml || '';
  var ctaLabel = escapeHtml_(opts.ctaLabel || '');
  var ctaUrl = escapeHtml_(opts.ctaUrl || '');
  var footer = escapeHtml_(opts.footerNote || 'Association AKUU · Trésorerie');

  var ctaBlock = '';
  if (ctaLabel && ctaUrl) {
    ctaBlock =
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">' +
      '<tr><td align="center" style="border-radius:999px;background:' + EMAIL_BRAND_.green + ';">' +
      '<a href="' + ctaUrl + '" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">' +
      ctaLabel + '</a></td></tr></table>' +
      '<p style="margin:12px 0 0;text-align:center;font-size:12px;color:' + EMAIL_BRAND_.muted + ';">' +
      'Ou copiez ce lien dans votre navigateur :<br>' +
      '<a href="' + ctaUrl + '" style="color:' + EMAIL_BRAND_.blue + ';word-break:break-all;">' + ctaUrl + '</a></p>';
  }

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + title + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + EMAIL_BRAND_.cream + ';font-family:Georgia,\'Times New Roman\',serif;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + preheader + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + EMAIL_BRAND_.cream + ';padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ' + EMAIL_BRAND_.border + ';box-shadow:0 8px 24px rgba(28,25,23,0.06);">' +
    '<tr><td style="background:' + EMAIL_BRAND_.green + ';padding:24px 28px;text-align:center;">' +
    '<img src="' + escapeHtml_(getLogoUrl_()) + '" alt="AKUU" width="120" style="display:block;margin:0 auto 12px;border:0;height:auto;">' +
    '<p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-family:Helvetica,Arial,sans-serif;">Espace adhérent</p>' +
    '</td></tr>' +
    '<tr><td style="padding:32px 28px 24px;font-family:Helvetica,Arial,sans-serif;">' +
    '<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:' + EMAIL_BRAND_.night + ';font-family:Georgia,\'Times New Roman\',serif;">' + title + '</h1>' +
    intro +
    (details ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid ' + EMAIL_BRAND_.border + ';border-bottom:1px solid ' + EMAIL_BRAND_.border + ';">' + details + '</table>' : '') +
    extra +
    ctaBlock +
    '</td></tr>' +
    '<tr><td style="padding:20px 28px 28px;background:#fafaf9;border-top:1px solid ' + EMAIL_BRAND_.border + ';font-family:Helvetica,Arial,sans-serif;">' +
    '<p style="margin:0;font-size:12px;line-height:1.5;color:' + EMAIL_BRAND_.muted + ';text-align:center;">' + footer + '</p>' +
    '</td></tr></table></td></tr></table></body></html>';
}

function buildPlainFromLayout_(opts) {
  opts = opts || {};
  var lines = [opts.title || 'AKUU', ''];
  if (opts.introPlain) lines.push(opts.introPlain, '');
  if (opts.detailsPlain) lines.push(opts.detailsPlain, '');
  if (opts.extraPlain) lines.push(opts.extraPlain, '');
  if (opts.ctaLabel && opts.ctaUrl) {
    lines.push(opts.ctaLabel + ' :', opts.ctaUrl, '');
  }
  lines.push(opts.footerNote || 'Association AKUU · Trésorerie');
  return lines.join('\n');
}

/** Photos de devis à valider (trésoriers + admin · demande > seuil). */
function buildDevisValidationEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'validation', { ref: ref });
  var amount = formatAmountLabel_(data.currency, data.amount_pen, data.amount_eur);
  var detailsPlain = [
    'Référence : ' + ref,
    'Demandeur : ' + (data.submitter || ''),
    'Projet : ' + labelProject_(data.project),
    'Nature : ' + labelCategory_(data.category),
    'Montant estimé : ' + amount,
    'Photos/PDF de devis joints : ' + (data.devis_count || 0)
  ].join('\n');

  return {
    subject: '[AKUU] Photos de devis à valider — ' + ref,
    plain: buildPlainFromLayout_({
      title: 'Photos de devis à valider',
      introPlain: 'Une demande inclut des photos de devis fournisseurs à valider avant approbation.',
      detailsPlain: detailsPlain + '\n\n' + buildDevisLinksPlain_(data.devis),
      ctaLabel: 'Valider les photos de devis',
      ctaUrl: url,
      footerNote: 'Validez les pièces de devis avant d\'approuver la demande.'
    }),
    html: buildEmailLayout_({
      title: 'Photos de devis à valider',
      preheader: ref + ' · ' + amount + ' · action requise',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">' +
        'Une demande inclut des <strong>photos de devis fournisseurs</strong> à valider avant approbation.</p>',
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Référence', value: ref },
        { label: 'Demandeur', value: data.submitter },
        { label: 'Projet', value: labelProject_(data.project) },
        { label: 'Nature', value: labelCategory_(data.category) },
        { label: 'Montant estimé', value: amount },
        { label: 'Pièces jointes', value: String(data.devis_count || 0) }
      ]),
      extraHtml: buildDevisLinksHtml_(data.devis) +
        (data.description ? '<p style="margin:20px 0 0;font-size:14px;color:' + EMAIL_BRAND_.muted + ';"><strong style="color:' +
          EMAIL_BRAND_.night + ';">Description :</strong> ' + escapeHtml_(data.description) + '</p>' : ''),
      ctaLabel: 'Valider les photos de devis',
      ctaUrl: url,
      footerNote: 'Validez les pièces de devis avant d\'approuver la demande.'
    })
  };
}

/** Nouvelle demande sans photos de devis jointes (≤ seuil). */
function buildNouvelleDemandeEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'validation', { ref: ref });
  var amount = formatAmountLabel_(data.currency, data.amount_pen, data.amount_eur);

  return {
    subject: '[AKUU] Nouvelle demande — ' + ref,
    plain: buildPlainFromLayout_({
      title: 'Nouvelle demande de dépense',
      introPlain: 'Une demande est en attente de validation trésorier.',
      detailsPlain: [
        'Référence : ' + ref,
        'Demandeur : ' + (data.submitter || ''),
        'Montant : ' + amount
      ].join('\n'),
      ctaLabel: 'Examiner la demande',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Nouvelle demande de dépense',
      preheader: ref + ' · en attente de validation',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Une demande est en attente de validation trésorier.</p>',
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Référence', value: ref },
        { label: 'Demandeur', value: data.submitter },
        { label: 'Montant', value: amount }
      ]),
      ctaLabel: 'Examiner la demande',
      ctaUrl: url
    })
  };
}

/** Nouvelle facture en attente. */
function buildNouvelleFactureEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'validation', { ref: ref });
  var amount = formatAmountLabel_(data.currency, data.amount_pen, data.amount_eur);
  var receiptHtml = data.drive_file_url
    ? '<p style="margin:16px 0 0;"><a href="' + escapeHtml_(data.drive_file_url) + '" style="color:' + EMAIL_BRAND_.blue +
      ';font-weight:600;text-decoration:none;">Voir la pièce justificative</a></p>'
    : '';

  return {
    subject: '[AKUU] Nouvelle facture — ' + ref,
    plain: buildPlainFromLayout_({
      title: 'Nouvelle facture à valider',
      introPlain: 'Une facture est en attente de validation et d\'enregistrement au journal.',
      detailsPlain: [
        'Référence : ' + ref,
        'Par : ' + (data.submitter || ''),
        'Demande liée : ' + (data.demand_reference || '—'),
        'Montant : ' + amount,
        data.drive_file_url ? 'Pièce jointe : ' + data.drive_file_url : ''
      ].filter(Boolean).join('\n'),
      ctaLabel: 'Valider la facture',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Nouvelle facture à valider',
      preheader: ref + ' · ' + amount,
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Une facture est en attente de validation et d\'enregistrement au journal comptable.</p>',
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Référence', value: ref },
        { label: 'Par', value: data.submitter },
        { label: 'Demande liée', value: data.demand_reference || '—' },
        { label: 'Montant', value: amount }
      ]),
      extraHtml: receiptHtml,
      ctaLabel: 'Valider la facture',
      ctaUrl: url
    })
  };
}

/** Frais de fonctionnement saisis directement. */
function buildFraisFonctionnementEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'compta');
  var amount = formatAmountLabel_(data.currency, data.amount_pen, data.amount_eur);

  return {
    subject: '[AKUU] Frais de fonctionnement — ' + ref,
    plain: buildPlainFromLayout_({
      title: 'Frais de fonctionnement comptabilisés',
      detailsPlain: [
        'Référence : ' + ref,
        'Par : ' + (data.submitter || ''),
        'Libellé : ' + (data.label || ''),
        'Montant : ' + amount
      ].join('\n'),
      ctaLabel: 'Voir le journal comptable',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Frais de fonctionnement comptabilisés',
      preheader: ref + ' · ' + amount,
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Référence', value: ref },
        { label: 'Par', value: data.submitter },
        { label: 'Libellé', value: data.label },
        { label: 'Montant', value: amount }
      ]),
      ctaLabel: 'Voir le journal comptable',
      ctaUrl: url
    })
  };
}

/** Demande approuvée (bénévole). */
function buildDemandeApprovedEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'facture');

  return {
    subject: '[' + ref + '] Demande approuvée',
    plain: [
      'Demande approuvée',
      '',
      'Bonjour' + (data.first_name ? ' ' + data.first_name : '') + ',',
      '',
      'Votre demande ' + ref + ' est approuvée.',
      'Utilisez cette référence pour soumettre votre facture dans l\'espace adhérent.',
      '',
      'Soumettre ma facture :',
      url,
      '',
      'Association AKUU · Trésorerie'
    ].join('\n'),
    html: buildEmailLayout_({
      title: 'Demande approuvée',
      preheader: ref + ' · vous pouvez soumettre votre facture',
      introHtml: '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Bonjour' +
        (data.first_name ? ' <strong>' + escapeHtml_(data.first_name) + '</strong>' : '') + ',</p>' +
        '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre demande <strong>' +
        escapeHtml_(ref) + '</strong> est approuvée. Utilisez cette référence pour soumettre votre facture.</p>',
      ctaLabel: 'Soumettre ma facture',
      ctaUrl: url
    })
  };
}

/** Demande refusée (bénévole). */
function buildDemandeRejectedEmail_(data) {
  data = data || {};
  var ref = data.reference || '';

  return {
    subject: 'Demande refusée ' + ref,
    plain: [
      'Demande refusée',
      '',
      'Votre demande ' + ref + ' n\'a pas été retenue.',
      '',
      'Motif :',
      data.reason || '(non précisé)',
      '',
      'Association AKUU · Trésorerie'
    ].join('\n'),
    html: buildEmailLayout_({
      title: 'Demande refusée',
      preheader: ref,
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre demande <strong>' +
        escapeHtml_(ref) + '</strong> n\'a pas été retenue.</p>',
      extraHtml: '<div style="margin-top:20px;padding:16px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">' +
        '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">Motif du refus</p>' +
        '<p style="margin:0;font-size:14px;line-height:1.5;color:#7f1d1d;">' + escapeHtml_(data.reason || '(non précisé)') + '</p></div>'
    })
  };
}

/** Devis refusés — le bénévole doit renvoyer de nouveaux devis (demande toujours ouverte). */
function buildDevisRejectedEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'demande');

  return {
    subject: '[AKUU] Devis à corriger — ' + ref,
    plain: [
      'Devis à corriger',
      '',
      'Votre demande ' + ref + ' reste ouverte, mais les devis joints ne conviennent pas.',
      '',
      'Message du trésorier :',
      data.reason || '(non précisé)',
      '',
      'Renvoyez au moins 2 nouveaux devis depuis l\'onglet Demande.',
      url,
      '',
      'Association AKUU · Trésorerie'
    ].join('\n'),
    html: buildEmailLayout_({
      title: 'Devis à corriger',
      preheader: ref + ' · nouveaux devis requis',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre demande <strong>' +
        escapeHtml_(ref) + '</strong> reste ouverte, mais les devis joints doivent être corrigés.</p>',
      extraHtml: '<div style="margin-top:20px;padding:16px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">' +
        '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">Message du trésorier</p>' +
        '<p style="margin:0;font-size:14px;line-height:1.5;color:#7f1d1d;white-space:pre-wrap;">' +
        escapeHtml_(data.reason || '(non précisé)') + '</p></div>',
      ctaLabel: 'Renvoyer des devis',
      ctaUrl: url
    })
  };
}

/** Lot de factures clôturé par le bénévole — une validation trésorier pour toute la demande. */
function buildFacturesLotEmail_(data) {
  data = data || {};
  var demandRef = data.demand_reference || '';
  var url = getAdminUrl_('tresorerie', 'validation', { ref: demandRef });
  var count = Number(data.facture_count) || 0;
  var refs = (data.facture_references || []).join(', ');
  var amount = formatAmountLabel_(data.currency, data.amount_pen, data.amount_eur);

  return {
    subject: '[AKUU] ' + count + ' facture(s) à valider — ' + demandRef,
    plain: buildPlainFromLayout_({
      title: count + ' facture(s) à valider en une fois',
      introPlain: 'Le bénévole a clôturé le devis. Validez l\'ensemble des justificatifs en une seule action.',
      detailsPlain: [
        'Demande : ' + demandRef,
        'Par : ' + (data.submitter || ''),
        'Factures : ' + refs,
        'Total : ' + amount
      ].join('\n'),
      ctaLabel: 'Valider le lot',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: count + ' facture(s) à valider',
      preheader: demandRef + ' · ' + amount,
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Le bénévole a clôturé le devis. Validez <strong>toutes les factures</strong> en une seule action.</p>',
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Demande', value: demandRef },
        { label: 'Par', value: data.submitter },
        { label: 'Factures', value: refs },
        { label: 'Total', value: amount }
      ]),
      ctaLabel: 'Valider le lot',
      ctaUrl: url
    })
  };
}

/** Lot de factures validé (bénévole). */
function buildFacturesLotValidatedEmail_(data) {
  data = data || {};
  var demandRef = data.demand_reference || '';
  var refs = (data.references || []).join(', ');
  var url = getAdminUrl_('tresorerie', 'historique');

  return {
    subject: 'Factures validées — ' + demandRef,
    plain: buildPlainFromLayout_({
      title: 'Factures comptabilisées',
      introPlain: 'Vos factures (' + refs + ') pour la demande ' + demandRef + ' ont été validées et enregistrées au journal.',
      ctaLabel: 'Voir mon historique',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Factures comptabilisées',
      preheader: demandRef + ' · ' + (data.references || []).length + ' facture(s)',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Vos factures <strong>' +
        escapeHtml_(refs) + '</strong> (demande ' + escapeHtml_(demandRef) + ') ont été comptabilisées au journal AKUU.</p>',
      ctaLabel: 'Voir mon historique',
      ctaUrl: url
    })
  };
}

/** Facture validée (bénévole). */
function buildFactureValidatedEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var url = getAdminUrl_('tresorerie', 'historique');

  return {
    subject: 'Facture validée ' + ref,
    plain: buildPlainFromLayout_({
      title: 'Facture validée',
      introPlain: 'Votre facture ' + ref + ' a été comptabilisée au journal AKUU.',
      ctaLabel: 'Voir mon historique',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Facture validée',
      preheader: ref + ' · comptabilisée',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre facture <strong>' +
        escapeHtml_(ref) + '</strong> a été comptabilisée au journal AKUU.</p>',
      ctaLabel: 'Voir mon historique',
      ctaUrl: url
    })
  };
}

/** Facture refusée (bénévole) — peut soumettre une nouvelle facture sur la même demande. */
function buildFactureRejectedEmail_(data) {
  data = data || {};
  var ref = data.reference || '';
  var demandRef = data.demand_reference || '';
  var url = getAdminUrl_('tresorerie', 'facture', demandRef ? { ref: demandRef } : {});

  return {
    subject: 'Facture refusée ' + ref,
    plain: [
      'Facture refusée',
      '',
      'Votre facture ' + ref + ' n\'a pas été retenue.',
      demandRef ? 'Demande liée : ' + demandRef : '',
      '',
      'Message du trésorier :',
      data.reason || '(non précisé)',
      '',
      'Vous pouvez soumettre une nouvelle facture pour la même demande approuvée.',
      url,
      '',
      'Association AKUU · Trésorerie'
    ].filter(Boolean).join('\n'),
    html: buildEmailLayout_({
      title: 'Facture refusée',
      preheader: ref + ' · vous pouvez renvoyer une facture',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre facture <strong>' +
        escapeHtml_(ref) + '</strong> n\'a pas été retenue.' +
        (demandRef ? ' La demande <strong>' + escapeHtml_(demandRef) + '</strong> reste approuvée.' : '') + '</p>',
      extraHtml: '<div style="margin-top:20px;padding:16px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">' +
        '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">Message du trésorier</p>' +
        '<p style="margin:0;font-size:14px;line-height:1.5;color:#7f1d1d;white-space:pre-wrap;">' +
        escapeHtml_(data.reason || '(non précisé)') + '</p></div>',
      ctaLabel: 'Soumettre une nouvelle facture',
      ctaUrl: url
    })
  };
}

/** Demande d'accès (admin). */
function buildAccessRequestEmail_(data) {
  data = data || {};
  var url = getAdminUrl_('tresorerie', 'acces');

  return {
    subject: '[AKUU] Nouvel adhérent — ' + (data.name || data.email),
    plain: buildPlainFromLayout_({
      title: 'Nouvelle demande d\'accès',
      detailsPlain: [
        'Nom : ' + (data.name || ''),
        'Email : ' + (data.email || ''),
        'Rôle demandé : ' + (data.requested_role || ''),
        '',
        'Message :',
        data.message || '(aucun)'
      ].join('\n'),
      ctaLabel: 'Traiter la demande',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Nouvelle demande d\'accès',
      preheader: (data.name || data.email) + ' · espace adhérent',
      detailsHtml: buildDetailRowsHtml_([
        { label: 'Nom', value: data.name },
        { label: 'Email', value: data.email },
        { label: 'Rôle demandé', value: data.requested_role }
      ]),
      extraHtml: '<div style="margin-top:20px;padding:16px;background:#fafaf9;border-radius:12px;border:1px solid ' + EMAIL_BRAND_.border + ';">' +
        '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:' + EMAIL_BRAND_.night + ';">Message</p>' +
        '<p style="margin:0;font-size:14px;line-height:1.5;color:' + EMAIL_BRAND_.muted + ';white-space:pre-wrap;">' +
        escapeHtml_(data.message || '(aucun)') + '</p></div>',
      ctaLabel: 'Traiter la demande',
      ctaUrl: url
    })
  };
}

/** Accès approuvé (bénévole). */
function buildAccessApprovedEmail_(data) {
  data = data || {};
  var url = getAdminUrl_('tresorerie', 'demande');

  var pwdBlock = data.initial_password
    ? '<div style="margin-top:20px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">' +
      '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:' + EMAIL_BRAND_.greenDark + ';">Mot de passe provisoire</p>' +
      '<p style="margin:0;font-size:18px;font-family:monospace;letter-spacing:0.05em;color:' + EMAIL_BRAND_.night + ';">' +
      escapeHtml_(data.initial_password) + '</p>' +
      '<p style="margin:10px 0 0;font-size:12px;color:' + EMAIL_BRAND_.muted + ';">Changez-le dès votre première connexion (Mon compte → Changer mon mot de passe).</p></div>'
    : '<p style="margin:16px 0 0;font-size:14px;color:' + EMAIL_BRAND_.muted + ';">Votre mot de passe actuel reste valable.</p>';

  var plainPwd = data.initial_password
    ? '\nMot de passe provisoire : ' + data.initial_password + '\nChangez-le dès votre première connexion.'
    : '\nVotre mot de passe actuel reste valable.';

  return {
    subject: '[AKUU] Accès approuvé',
    plain: [
      'Accès approuvé',
      '',
      'Bonjour ' + (data.first_name || '') + ',',
      '',
      'Votre demande d\'accès (' + (data.role || '') + ') a été approuvée.',
      'Email : ' + (data.email || ''),
      plainPwd,
      '',
      'Se connecter :',
      getAdminUrl_('tresorerie', 'demande'),
      '',
      'Association AKUU'
    ].join('\n'),
    html: buildEmailLayout_({
      title: 'Accès approuvé',
      preheader: 'Bienvenue dans l\'espace adhérent AKUU',
      introHtml: '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Bonjour <strong>' +
        escapeHtml_(data.first_name || '') + '</strong>,</p>' +
        '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Votre demande d\'accès (<strong>' +
        escapeHtml_(data.role || '') + '</strong>) a été approuvée.</p>' +
        '<p style="margin:12px 0 0;font-size:14px;color:' + EMAIL_BRAND_.muted + ';">Email de connexion : <strong style="color:' +
        EMAIL_BRAND_.night + ';">' + escapeHtml_(data.email || '') + '</strong></p>' +
        pwdBlock,
      ctaLabel: 'Accéder à l\'espace adhérent',
      ctaUrl: url
    })
  };
}

/** Mot de passe provisoire. */
function buildPasswordEmail_(data) {
  data = data || {};
  var url = getSiteUrl_() + '/admin/login';

  return {
    subject: '[AKUU] Votre mot de passe provisoire',
    plain: [
      'Mot de passe provisoire',
      '',
      'Bonjour ' + (data.first_name || '') + ',',
      '',
      'Voici votre mot de passe provisoire pour l\'espace adhérent AKUU :',
      data.password || '',
      '',
      'Changez-le dès votre première connexion (Mon compte → Changer mon mot de passe).',
      '',
      'Se connecter :',
      url
    ].join('\n'),
    html: buildEmailLayout_({
      title: 'Mot de passe provisoire',
      preheader: 'Espace adhérent AKUU',
      introHtml: '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Bonjour <strong>' +
        escapeHtml_(data.first_name || '') + '</strong>,</p>' +
        '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Voici votre mot de passe provisoire pour l\'espace adhérent AKUU :</p>' +
        '<p style="margin:16px 0 0;font-size:22px;font-family:monospace;letter-spacing:0.06em;color:' + EMAIL_BRAND_.greenDark + ';font-weight:700;">' +
        escapeHtml_(data.password || '') + '</p>' +
        '<p style="margin:12px 0 0;font-size:13px;color:' + EMAIL_BRAND_.muted + ';">Changez-le dès votre première connexion (Mon compte → Changer mon mot de passe).</p>',
      ctaLabel: 'Se connecter',
      ctaUrl: url
    })
  };
}

/** Relance validation > 24h. */
function buildReminderEmail_(data) {
  data = data || {};
  var url = getAdminUrl_('tresorerie', 'validation');
  var dem = data.demandes || [];
  var fac = data.factures || [];

  var demHtml = dem.length
    ? '<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:' + EMAIL_BRAND_.night + ';">Demandes en attente</p>' +
      '<ul style="margin:0 0 16px;padding-left:18px;font-size:14px;color:' + EMAIL_BRAND_.night + ';">' +
      dem.map(function (r) { return '<li>' + escapeHtml_(r) + '</li>'; }).join('') + '</ul>'
    : '';
  var facHtml = fac.length
    ? '<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:' + EMAIL_BRAND_.night + ';">Factures en attente</p>' +
      '<ul style="margin:0;padding-left:18px;font-size:14px;color:' + EMAIL_BRAND_.night + ';">' +
      fac.map(function (r) { return '<li>' + escapeHtml_(r) + '</li>'; }).join('') + '</ul>'
    : '';

  return {
    subject: '[AKUU] Relance validation trésorerie',
    plain: buildPlainFromLayout_({
      title: 'Relance validation trésorerie',
      introPlain: 'Des éléments sont en attente depuis plus de 24 heures.',
      detailsPlain: (dem.length ? 'Demandes : ' + dem.join(', ') + '\n' : '') +
        (fac.length ? 'Factures : ' + fac.join(', ') : ''),
      ctaLabel: 'Ouvrir la file de validation',
      ctaUrl: url
    }),
    html: buildEmailLayout_({
      title: 'Relance validation trésorerie',
      preheader: (dem.length + fac.length) + ' élément(s) en attente',
      introHtml: '<p style="margin:0;font-size:15px;line-height:1.6;color:' + EMAIL_BRAND_.night + ';">Des éléments sont en attente depuis <strong>plus de 24 heures</strong>.</p>',
      extraHtml: demHtml + facHtml,
      ctaLabel: 'Ouvrir la file de validation',
      ctaUrl: url
    })
  };
}

/** Emails de test (éditeur Apps Script). */
function buildTestEmails_() {
  return [
    buildAccessRequestEmail_({ name: 'Marie Dupont', email: 'marie@example.com', requested_role: 'benevole', message: 'Je participe au projet musée.' }),
    buildDevisValidationEmail_({
      reference: 'AKUU-DEM-2026-0001',
      submitter: 'benevole@example.com',
      project: 'musee',
      category: 'materiel',
      currency: 'PEN',
      amount_pen: 1500,
      amount_eur: 360,
      devis_count: 2,
      description: 'Achat matériel exposition',
      devis: [{ name: 'devis-fournisseur-a.pdf', drive_file_url: 'https://drive.google.com/file/d/example/view' }]
    }),
    buildNouvelleFactureEmail_({
      reference: 'AKUU-FAC-2026-0042',
      submitter: 'benevole@example.com',
      demand_reference: 'AKUU-DEM-2026-0001',
      currency: 'PEN',
      amount_pen: 1450,
      amount_eur: 348,
      drive_file_url: 'https://drive.google.com/file/d/example/view'
    })
  ];
}
