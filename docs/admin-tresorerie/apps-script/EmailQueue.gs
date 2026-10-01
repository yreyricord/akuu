/**
 * File d'attente email — écriture HTTP immédiate, envoi via trigger time-driven.
 * Déployer le trigger : exécuter setupEmailQueueTrigger() une fois dans l'éditeur.
 */

function useAsyncEmail_() {
  return String(getProp_('ASYNC_EMAIL', 'true')).toLowerCase() !== 'false';
}

function enqueueMail_(recipients, content) {
  var list = (recipients || []).filter(function (e) { return String(e || '').trim(); });
  if (!list.length) return;
  var c = typeof content === 'string'
    ? { subject: '[AKUU]', plain: content, html: '' }
    : (content || { subject: '[AKUU]', plain: '', html: '' });
  try {
    appendRow_('EmailQueue', {
      id: uuid_(),
      created_at: new Date().toISOString(),
      recipients_json: JSON.stringify(list),
      subject: c.subject || '[AKUU]',
      plain: c.plain || '',
      html: c.html || '',
      status: 'pending',
      sent_at: '',
      error: ''
    });
  } catch (e) {
    Logger.log('[EmailQueue] enqueue failed, sync fallback: ' + e.message);
    list.forEach(function (email) { sendMailContent_(email, c); });
  }
}

function dispatchMail_(recipients, content) {
  if (useAsyncEmail_()) {
    enqueueMail_(recipients, content);
    return;
  }
  (recipients || []).forEach(function (email) {
    sendMailContent_(email, content);
  });
}

function processEmailQueue_() {
  var rows = readAll_('EmailQueue').filter(function (r) {
    return String(r.status || '').toLowerCase() === 'pending';
  });
  if (!rows.length) return { processed: 0 };
  var done = 0;
  rows.slice(0, 30).forEach(function (row) {
    var recipients = [];
    try { recipients = JSON.parse(row.recipients_json || '[]'); } catch (e) { /* ignore */ }
    var content = { subject: row.subject, plain: row.plain, html: row.html };
    var ok = true;
    var errMsg = '';
    recipients.forEach(function (email) {
      if (!sendMailContent_(email, content)) {
        ok = false;
        errMsg = 'send failed';
      }
    });
    updateRowById_('EmailQueue', row.id, {
      status: ok ? 'sent' : 'error',
      sent_at: new Date().toISOString(),
      error: errMsg
    });
    done++;
  });
  return { processed: done };
}

/** À exécuter une fois : trigger toutes les minutes. */
function setupEmailQueueTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processEmailQueue_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processEmailQueue_').timeBased().everyMinutes(1).create();
  Logger.log('Trigger processEmailQueue_ créé (1 min)');
}
