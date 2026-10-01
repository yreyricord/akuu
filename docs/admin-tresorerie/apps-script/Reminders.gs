/** Trigger horaire · relances trésoriers > 24h */

function sendPendingReminders() {
  var now = Date.now();
  var dayMs = 24 * 60 * 60 * 1000;

  var pendingDem = readAll_('Demandes').filter(function (d) {
    return d.status === 'awaiting_approval' && (now - new Date(d.created_at).getTime()) > dayMs;
  });
  var pendingFac = readAll_('Factures').filter(function (f) {
    return f.status === 'pending' && (now - new Date(f.created_at).getTime()) > dayMs;
  });

  if (!pendingDem.length && !pendingFac.length) return;

  notifyTreasurersMail_(buildReminderEmail_({
    demandes: pendingDem.map(function (d) { return d.reference; }),
    factures: pendingFac.map(function (f) { return f.reference; })
  }));
}

function installReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendPendingReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendPendingReminders').timeBased().everyHours(24).create();
  Logger.log('Trigger relance 24h installé');
}

// installAllTriggers · installNewYearTrigger · setupNewYear → voir Setup.gs
