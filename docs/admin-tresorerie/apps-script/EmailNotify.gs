/** Notifications email — admin, trésoriers (MailApp · quota ~100/j en compte gratuit) */

function getStaffEmails_(includeAdmin) {
  var seen = {};
  var out = [];
  function add(email) {
    var e = String(email || '').toLowerCase().trim();
    if (!e || seen[e]) return;
    seen[e] = true;
    out.push(e);
  }
  getTreasurerEmails_().forEach(add);
  if (includeAdmin) add(getAdminEmail_());
  return out;
}

/** @param {string} email @param {string} subject @param {string} plainBody @param {string=} htmlBody */
function sendMailSafe_(email, subject, plainBody, htmlBody) {
  try {
    var opts = {};
    if (htmlBody) opts.htmlBody = htmlBody;
    MailApp.sendEmail(email, subject, plainBody, opts);
    Logger.log('[AKUU mail] OK → ' + email + ' · ' + subject);
    return true;
  } catch (e) {
    Logger.log('[AKUU mail] ERREUR → ' + email + ' · ' + e.message);
    return false;
  }
}

/** Envoie un objet { subject, plain, html } ou texte brut (rétrocompat). */
function sendMailContent_(email, content) {
  if (typeof content === 'string') {
    return sendMailSafe_(email, '[AKUU]', content);
  }
  return sendMailSafe_(email, content.subject, content.plain, content.html);
}

function notifyAdmin_(subject, body) {
  notifyAdminMail_(subject, body);
}

function notifyTreasurers_(subject, body) {
  notifyTreasurersMail_(subject, body);
}

function notifyTreasurersAndAdmin_(subject, body) {
  notifyTreasurersAndAdminMail_(subject, body);
}

function notifyAdminMail_(subjectOrContent, plainBody, htmlBody) {
  var admin = getAdminEmail_();
  if (!admin) {
    Logger.log('[AKUU mail] ADMIN_EMAIL non configuré');
    return;
  }
  var content = resolveMailContent_(subjectOrContent, plainBody, htmlBody);
  sendMailContent_(admin, content);
}

function notifyTreasurersMail_(subjectOrContent, plainBody, htmlBody) {
  var content = resolveMailContent_(subjectOrContent, plainBody, htmlBody);
  getTreasurerEmails_().forEach(function (email) {
    sendMailContent_(email, content);
  });
}

function notifyTreasurersAndAdminMail_(subjectOrContent, plainBody, htmlBody) {
  var content = resolveMailContent_(subjectOrContent, plainBody, htmlBody);
  getStaffEmails_(true).forEach(function (email) {
    sendMailContent_(email, content);
  });
}

function sendUserMail_(email, subjectOrContent, plainBody, htmlBody) {
  var content = resolveMailContent_(subjectOrContent, plainBody, htmlBody);
  sendMailContent_(email, content);
}

function resolveMailContent_(subjectOrContent, plainBody, htmlBody) {
  if (subjectOrContent && typeof subjectOrContent === 'object' && subjectOrContent.plain) {
    return subjectOrContent;
  }
  return { subject: subjectOrContent, plain: plainBody || subjectOrContent, html: htmlBody || '' };
}

/** Exécuter depuis l'éditeur Apps Script pour vérifier la réception des emails */
function testEmailNotifications() {
  var admin = getAdminEmail_();
  var treasurers = getTreasurerEmails_();
  Logger.log('=== Test notifications AKUU ===');
  Logger.log('ADMIN_EMAIL : ' + (admin || '(vide)'));
  Logger.log('Trésoriers : ' + (treasurers.length ? treasurers.join(', ') : '(aucun)'));
  Logger.log('SITE_URL : ' + getSiteUrl_());

  notifyAdminMail_(buildAccessRequestEmail_({
    name: 'Test Adhérent',
    email: 'test@example.com',
    requested_role: 'benevole',
    message: 'Email de test · demande d\'accès.'
  }));

  notifyTreasurersAndAdminMail_(buildDevisValidationEmail_({
    reference: 'AKUU-DEM-2026-TEST',
    submitter: 'test@example.com',
    project: 'musee',
    category: 'materiel',
    currency: 'PEN',
    amount_pen: 1200,
    amount_eur: 288,
    devis_count: 2,
    description: 'Email de test · validation devis.',
    devis: [{ name: 'devis-test.pdf', drive_file_url: getSiteUrl_() }]
  }));

  notifyTreasurersAndAdminMail_(buildNouvelleFactureEmail_({
    reference: 'AKUU-FAC-2026-TEST',
    submitter: 'test@example.com',
    demand_reference: 'AKUU-DEM-2026-TEST',
    currency: 'PEN',
    amount_pen: 1150,
    amount_eur: 276
  }));

  Logger.log('=== Fin test · vérifiez vos boîtes mail (HTML + lien direct) ===');
}
