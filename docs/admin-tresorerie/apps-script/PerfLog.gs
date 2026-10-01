/** Mesure des durées de route (Phase perf AKUU). Feuille PerfLog optionnelle. */

var PERF_LOG_SLOW_MS_ = 200;

function logPerfIfSlow_(path, durationMs, actorEmail) {
  if (durationMs < PERF_LOG_SLOW_MS_) return;
  try {
    var sheet = getSheet_('PerfLog');
    if (!sheet) return;
    appendRow_('PerfLog', {
      id: uuid_(),
      timestamp: new Date().toISOString(),
      path: String(path || ''),
      duration_ms: durationMs,
      actor_email: String(actorEmail || '')
    });
  } catch (e) {
    Logger.log('[PerfLog] ' + path + ' ' + durationMs + 'ms · ' + e.message);
  }
}
