/**
 * Diagnostic du dépôt de relevé archivé (Bilan → « Déposer le relevé PDF »).
 * À lancer depuis l'éditeur : sélectionner diagnosticDepotReleve puis ▶ Exécuter.
 * Rejoue chaque étape du dépôt avec un petit PDF de test (2017, mois 9), affiche
 * l'étape qui échoue, puis supprime tout ce qu'il a créé (fichier + ligne).
 */
function diagnosticDepotReleve() {
  var year = 2017, month = 9, fileName = '2017_09_RELEVE_PRO_AKUU_TEST_DIAGNOSTIC.pdf';
  var created = null, rowId = null;
  function step(name, fn) {
    try {
      var r = fn();
      Logger.log('✅ ' + name);
      return r;
    } catch (e) {
      Logger.log('❌ ' + name + ' → ' + (e && e.message) + (e && e.code ? ' [' + e.code + ']' : ''));
      Logger.log(String(e && e.stack || e));
      throw e;
    }
  }
  try {
    step('1. Constantes chargées (Releves.gs, Security.gs)', function () {
      if (typeof RELEVES_ARCHIVES_HEADERS === 'undefined') throw new Error('RELEVES_ARCHIVES_HEADERS absent : Releves.gs non à jour');
      if (typeof MAX_UPLOAD_BYTES === 'undefined') throw new Error('MAX_UPLOAD_BYTES absent : Security.gs non à jour');
    });
    var b64 = Utilities.base64Encode(Utilities.newBlob('%PDF-1.4\n%diagnostic AKUU\n').getBytes());
    var blob = step('2. Contrôle du fichier PDF (checkedBlob_)', function () {
      return checkedBlob_({ base64: b64, name: fileName }, fileName, ['pdf']);
    });
    var folder = step('3. Dossier Drive 3_Trésorerie/2017/Documents/Releves_bancaires', function () {
      var f = getYearDocumentsSubfolder_(year, 'Releves_bancaires');
      Logger.log('   dossier : ' + f.getUrl());
      return f;
    });
    created = step('4. Création du fichier sur le Drive', function () { return folder.createFile(blob); });
    var sheet = step('5. Onglet RelevesArchives', function () { return relevesArchivesSheet_(); });
    step('6. Lecture de l\'onglet', function () { return sheet.getDataRange().getValues(); });
    rowId = uuid_();
    step('7. Écriture de la ligne', function () {
      appendRow_('RelevesArchives', { id: rowId, year: year, month: month, file_name: fileName,
        drive_file_id: created.getId(), url: created.getUrl(), uploaded_at: new Date().toISOString(),
        uploaded_by: 'diagnostic', status: 'test' }, RELEVES_ARCHIVES_HEADERS);
    });
    step('8. Journal d\'audit', function () {
      appendAudit_('diagnostic', 'releve_archive_diagnostic', 'releve', year + '-09', { file: fileName });
    });
    Logger.log('🎉 Toutes les étapes passent : le problème vient du déploiement (version web non mise à jour).');
  } finally {
    try { if (created) created.setTrashed(true); } catch (e) { /* ignore */ }
    try {
      if (rowId) {
        var sh = getSheet_('RelevesArchives'), data = sh.getDataRange().getValues();
        for (var i = data.length - 1; i >= 1; i--) if (data[i][0] === rowId) sh.deleteRow(i + 1);
      }
    } catch (e) { /* ignore */ }
    Logger.log('Nettoyage terminé (fichier de test à la corbeille, ligne de test supprimée).');
  }
}


/**
 * Vérifie que chaque fichier .gs du projet Google est à jour (fonctions récentes présentes).
 * À lancer depuis l'éditeur : diagnosticFichiers puis ▶ Exécuter.
 */
/**
 * Test génération Cloture pour une année (éditeur Apps Script → Exécuter).
 * Affiche l'erreur exacte dans Journal d'exécution si échec.
 */
/** Liste les propriétés JOURNAL_SHEET_YYYY (éditeur Apps Script). */
function diagnosticJournaux() {
  var current = new Date().getFullYear();
  var rows = [];
  for (var y = 2017; y <= current; y++) {
    var id = PropertiesService.getScriptProperties().getProperty('JOURNAL_SHEET_' + y);
    rows.push({ year: y, sheet_id: id || null, ok: Boolean(id) });
    Logger.log(y + ' → ' + (id || 'ABSENT'));
  }
  return { rows: rows, ok: rows.every(function (r) { return r.ok; }) };
}

/**
 * Audit du journal Google 2026 — compteurs, doublons, relevés, legacy « Appli ».
 * Éditeur Apps Script → sélectionner auditJournal2026 puis ▶ Exécuter.
 * Résultat : Affichage → Journaux (ou Exécutions → dernière ligne).
 */
function auditJournal2026() {
  return auditJournalAnnee_(2026);
}

/**
 * Supprime les 8 écritures banque de septembre 2026 saisies en provisoire (toutes datées 2026-09-01).
 * Documenté dans REGULARISATION_AKUU.md · refs AKUU-IMP-2026-0067 → 0074.
 *
 * Après exécution : redéposer le relevé PDF de septembre sur le site (Bilan → Import relevé).
 * Les vraies dates seront lues depuis le PDF.
 *
 * Éditeur Apps Script → remplacerSeptembreProvisoire2026 → ▶ Exécuter.
 */
function remplacerSeptembreProvisoire2026() {
  var year = 2026;
  var refs = [];
  for (var n = 67; n <= 74; n++) refs.push('AKUU-IMP-' + year + '-' + ('0000' + n).slice(-4));
  var actor = Session.getEffectiveUser().getEmail() || 'script';
  var removed = [], missing = [], errors = [];
  refs.forEach(function (ref) {
    try {
      var hit = findJournalRow_(openYearJournal_(year), ref);
      if (!hit) { missing.push(ref); return; }
      var d = isoDate_(hit.row.expense_date);
      if (deleteFromYearJournal_(year, ref, actor, 'Remplacement saisie provisoire sept. 2026 — avant re-import relevé PDF')) {
        removed.push({ ref: ref, date: d, label: String(hit.row.label || '').substring(0, 60) });
        Logger.log('✅ supprimé ' + ref + ' (' + d + ')');
      } else {
        errors.push(ref + ' : suppression refusée');
      }
    } catch (e) {
      errors.push(ref + ' : ' + (e && e.message || e));
      Logger.log('❌ ' + ref + ' → ' + (e && e.message || e));
    }
  });
  if (typeof invalidateJournalCaches_ === 'function') invalidateJournalCaches_(openYearJournal_(year));
  if (typeof invalidateExercicesCache_ === 'function') invalidateExercicesCache_();
  Logger.log('');
  Logger.log('Résumé : ' + removed.length + ' supprimée(s), ' + missing.length + ' absente(s), ' + errors.length + ' erreur(s).');
  Logger.log('➡️ Maintenant : site admin → Bilan 2026 → Import relevé → PDF septembre → Ajouter au journal.');
  return { year: year, removed: removed, missing: missing, errors: errors };
}

/**
 * Audit d'une année (2017 → année en cours).
 * @param {number} year ex. 2026
 */
function auditJournalAnnee_(year) {
  year = Number(year) || new Date().getFullYear();
  var out = {
    year: year, ok: true, generated_at: new Date().toISOString(), sheet_url: null,
    tabs: {}, releves: [], duplicates: { by_reference: [], by_content: [] },
    retraits_dab: { legitimes: [], suspects: [], total_lignes: 0 },
    legacy_app_journal: { rows_in_year: 0, refs_only_in_app: [], refs_in_both: [] },
    corrections_delete: [], warnings: []
  };

  var ss = openYearJournal_(year);
  if (!ss) {
    Logger.log('❌ Journal_AKUU_' + year + ' introuvable — exécutez initJournalAnnee_(' + year + ')');
    return { year: year, ok: false, error: 'JOURNAL_ABSENT' };
  }
  out.sheet_url = ss.getUrl();
  Logger.log('📊 Audit Journal_AKUU_' + year);
  Logger.log('   ' + ss.getUrl());

  var yearPrefix = String(year);
  var yearJournalRefs = {};

  JOURNAL_TABS.forEach(function (tabName) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) {
      out.warnings.push('Onglet ' + tabName + ' absent');
      Logger.log('⚠️ Onglet ' + tabName + ' absent');
      return;
    }
    var tr = tabRows_(sh);
    var rows = tr.rows;
    if (tabName === 'Journal') {
      rows.forEach(function (r) {
        if (r.reference) yearJournalRefs[String(r.reference)] = true;
      });
    }
    var stats = auditTabRows_(tabName, rows, yearPrefix);
    out.tabs[tabName] = stats;
    Logger.log('');
    Logger.log('── ' + tabName + ' ──');
    Logger.log('   Lignes avec référence : ' + stats.lines);
    Logger.log('   Recettes : ' + stats.recettes + ' · Dépenses : ' + stats.depenses);
    if (stats.needs_review) Logger.log('   À revoir (needs_review) : ' + stats.needs_review);
    if (stats.by_month && Object.keys(stats.by_month).length) {
      Logger.log('   Par mois : ' + Object.keys(stats.by_month).sort().map(function (m) {
        return m + '=' + stats.by_month[m];
      }).join(', '));
    }
    var dupRef = findDuplicateReferences_(rows);
    var dupContent = tabName === 'Journal'
      ? findDuplicateContent_(rows, 'banque')
      : findDuplicateContent_(rows, 'terrain');
    dupRef.forEach(function (d) {
      out.duplicates.by_reference.push({ tab: tabName, reference: d.reference, count: d.count, rows: d.rows });
    });
    dupContent.forEach(function (d) {
      out.duplicates.by_content.push({ tab: tabName, key: d.key, count: d.count, samples: d.samples });
    });
    if (dupRef.length) {
      out.ok = false;
      Logger.log('   ❌ Références en double : ' + dupRef.length);
      dupRef.forEach(function (d) {
        Logger.log('      ' + d.reference + ' ×' + d.count + ' (lignes ' + d.rows.join(', ') + ')');
      });
    }
    if (tabName === 'Journal' && dupContent.length) {
      var dab = analyzeDabDuplicateGroups_(rows, dupContent);
      out.retraits_dab = dab;
      Logger.log('');
      Logger.log('── Retraits DAB (même date + EUR + libellé) ──');
      Logger.log('   ✅ Légitimes (refs IMP distinctes = 2 DAB le même jour) : ' + dab.legitimes.length);
      dab.legitimes.forEach(function (g) {
        Logger.log('      ' + g.date + ' · ' + g.eur + ' € · ' + g.refs.join(' + '));
      });
      if (dab.suspects.length) {
        Logger.log('   ⚠️ À vérifier (pas DAB ou refs identiques) : ' + dab.suspects.length);
        dab.suspects.slice(0, 8).forEach(function (g) {
          Logger.log('      ' + g.key + ' · ' + g.refs.join(', '));
        });
      }
      var otherDup = dupContent.length - dab.legitimes.length - dab.suspects.length;
      if (otherDup > 0) Logger.log('   ℹ️ Autres paires banque (hors DAB) : ' + otherDup);
    } else if (dupContent.length) {
      Logger.log('   ⚠️ Doublons contenu : ' + dupContent.length);
    }
    if (!dupRef.length && !dupContent.length) Logger.log('   ✅ Pas de doublon détecté');
  });

  if (typeof relevesOf_ === 'function') {
    out.releves = relevesOf_(ss);
    Logger.log('');
    Logger.log('── Relevés bancaires ──');
    if (!out.releves.length) {
      Logger.log('   ⚠️ Aucun relevé enregistré dans l\'onglet Releves');
      out.warnings.push('Aucun relevé dans l\'onglet Releves');
    } else {
      out.releves.forEach(function (r) {
        Logger.log('   ' + r.mois + ' · fin ' + r.date_fin + ' · solde ' + r.solde_fin + ' € · +' + (r.operations_ajoutees || 0) + ' op.');
      });
      var last = out.releves[0];
      Logger.log('   Dernier relevé : ' + last.mois + ' · solde fin ' + last.solde_fin + ' €');
    }
  }

  if (typeof readAll_ === 'function' && getSheet_('Journal')) {
    var appRows = readAll_('Journal').filter(function (r) {
      var raw = r.expense_date || r.journal_at || '';
      return String(raw).indexOf(yearPrefix) === 0 || String(raw).slice(0, 4) === yearPrefix;
    });
    var onlyApp = [], both = [];
    appRows.forEach(function (r) {
      var ref = String(r.reference || '');
      if (!ref) return;
      if (yearJournalRefs[ref]) both.push(ref);
      else onlyApp.push(ref);
    });
    out.legacy_app_journal = {
      rows_in_year: appRows.length,
      refs_only_in_app: onlyApp,
      refs_in_both: both
    };
    Logger.log('');
    Logger.log('── Tableur Apps Script · onglet Journal (legacy) ──');
    Logger.log('   Lignes ' + year + ' : ' + appRows.length);
    Logger.log('   Références aussi dans Journal_AKUU_' + year + ' : ' + both.length);
    Logger.log('   Références UNIQUEMENT dans l\'appli (fantômes UI) : ' + onlyApp.length);
    if (onlyApp.length) {
      Logger.log('   Exemples appli seule : ' + onlyApp.slice(0, 10).join(', ') +
        (onlyApp.length > 10 ? ' …' : ''));
      out.warnings.push(onlyApp.length + ' ligne(s) legacy dans le tableur Apps Script absentes du journal Google');
    }
  }

  if (typeof readAll_ === 'function' && getSheet_('Corrections')) {
    readAll_('Corrections').forEach(function (c) {
      if (c.type === 'delete' && Number(c.year) === year && c.status !== 'cancelled') {
        out.corrections_delete.push({ reference: c.reference, status: c.status, reason: c.reason });
      }
    });
    if (out.corrections_delete.length) {
      Logger.log('');
      Logger.log('── Suppressions enregistrées (Corrections) ──');
      Logger.log('   ' + out.corrections_delete.length + ' suppression(s) pour ' + year);
    }
  }

  out.corrections_delete.forEach(function (c) {
    if (auditJournalAnnee_refStillPresent_(ss, c.reference)) {
      out.warnings.push('Suppression demandée mais ligne encore présente : ' + c.reference);
      Logger.log('⚠️ ' + c.reference + ' marquée supprimée mais encore dans le journal Google');
    }
  });

  Logger.log('');
  Logger.log(out.ok && !out.warnings.length
    ? '🎉 Audit ' + year + ' OK — journal cohérent'
    : '➡️ Audit ' + year + ' terminé — voir ⚠️ / ❌ ci-dessus');
  return out;
}

function auditJournalAnnee_refStillPresent_(ss, reference) {
  var hit = findJournalRow_(ss, reference);
  return Boolean(hit);
}

function auditTabRows_(tabName, rows, yearPrefix) {
  var stats = { lines: rows.length, recettes: 0, depenses: 0, needs_review: 0, by_month: {} };
  rows.forEach(function (r) {
    var type = String(r.entry_type || '').toLowerCase();
    if (type === 'recette') stats.recettes++;
    else if (type === 'depense') stats.depenses++;
    if (String(r.needs_review || '').toLowerCase() === 'oui') stats.needs_review++;
    var d = isoDate_(r.expense_date);
    if (d.indexOf(yearPrefix) === 0) {
      var m = d.slice(5, 7);
      stats.by_month[m] = (stats.by_month[m] || 0) + 1;
    }
  });
  return stats;
}

function findDuplicateReferences_(rows) {
  var byRef = {};
  rows.forEach(function (r) {
    var ref = String(r.reference || '').trim();
    if (!ref) return;
    if (!byRef[ref]) byRef[ref] = [];
    byRef[ref].push(r._row);
  });
  var out = [];
  Object.keys(byRef).forEach(function (ref) {
    if (byRef[ref].length > 1) out.push({ reference: ref, count: byRef[ref].length, rows: byRef[ref] });
  });
  return out.sort(function (a, b) { return b.count - a.count; });
}

/** DAB / WU Pérou (aligné CaissePerou.gs). */
function isDabJournalRow_(r) {
  if (typeof isRetraitTerrain_ === 'function') return isRetraitTerrain_(r);
  var txt = normTxt_(String(r.label || '') + ' ' + String(r.notes || ''));
  return /\bcb\b/.test(txt) && /5770100|n\.5770100/.test(txt);
}

/**
 * Paires date+EUR+libellé : refs IMP toutes différentes + ligne DAB → 2 retraits le même jour (OK).
 * Même ref en double ou non-DAB → suspect.
 */
function analyzeDabDuplicateGroups_(rows, dupContent) {
  var rowByRef = {};
  rows.forEach(function (r) {
    var ref = String(r.reference || '').trim();
    if (ref) rowByRef[ref] = r;
  });
  var legitimes = [], suspects = [], totalLignes = 0;
  (dupContent || []).forEach(function (d) {
    var samples = d.samples || [];
    var refs = samples.map(function (s) { return String(s.reference || '').trim(); }).filter(Boolean);
    var uniq = {};
    refs.forEach(function (ref) { uniq[ref] = true; });
    var uniqRefs = Object.keys(uniq);
    var dab = samples.length > 0 && samples.every(function (s) {
      var row = rowByRef[s.reference] || { label: s.label, notes: '', category: '', entry_type: 'depense' };
      return isDabJournalRow_(row);
    });
    var eur = samples[0] && d.key ? String(d.key).split('|')[1] : '';
    if (dab && uniqRefs.length === refs.length && refs.length > 1) {
      legitimes.push({
        date: samples[0].date,
        eur: eur ? Number(eur) / 100 : num_(rowByRef[refs[0]] && rowByRef[refs[0]].amount_eur),
        count: d.count,
        refs: uniqRefs.sort(),
        key: d.key
      });
      totalLignes += d.count;
    } else {
      suspects.push({ key: d.key, count: d.count, refs: uniqRefs, dab: dab, label: samples[0] ? samples[0].label : '' });
    }
  });
  legitimes.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  return { legitimes: legitimes, suspects: suspects, total_lignes: totalLignes };
}

function findDuplicateContent_(rows, mode) {
  var byKey = {};
  rows.forEach(function (r) {
    var date = isoDate_(r.expense_date);
    var amount = mode === 'terrain' ? num_(r.amount_pen) : num_(r.amount_eur);
    if (!date || amount == null) return;
    var key = typeof releveKey_ === 'function'
      ? releveKey_(date, amount, r.label)
      : date + '|' + amount + '|' + String(r.label || '').slice(0, 18);
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push({
      reference: String(r.reference || ''),
      date: date,
      label: String(r.label || '').substring(0, 60),
      row: r._row
    });
  });
  var out = [];
  Object.keys(byKey).forEach(function (key) {
    if (byKey[key].length > 1) {
      out.push({ key: key, count: byKey[key].length, samples: byKey[key] });
    }
  });
  return out.sort(function (a, b) { return b.count - a.count; });
}

function diagnosticGenererCloture(year) {
  year = Number(year) || 2017;
  var session = { email: Session.getEffectiveUser().getEmail() || 'diagnostic', role: 'admin' };
  var r = genererClotureAnnee_({ email: session.email, role: 'tresorier' }, { year: year, force: true });
  Logger.log(JSON.stringify(r, null, 2));
  return r;
}

/**
 * Connexion / tableur — à lancer depuis l'éditeur Apps Script (▶ Exécuter).
 * Affiche dans « Exécutions » la cause si login renvoie « Erreur interne ».
 */
function diagnosticConnexion() {
  var out = { ok: true, checks: [] };
  var requiredFiles = [
    ['Config.gs', function () { return typeof getJwtSecret_ === 'function'; }],
    ['UserProfile.gs', function () { return typeof normalizeUserProfile_ === 'function'; }],
    ['SheetsRepo.gs', function () { return typeof getSpreadsheet_ === 'function'; }],
    ['Security.gs', function () { return typeof assertLoginAllowed_ === 'function'; }],
    ['Auth.gs', function () { return typeof authLogin_ === 'function'; }],
    ['App.gs', function () { return typeof handleRequest === 'function'; }]
  ];
  requiredFiles.forEach(function (entry) {
    var label = entry[0];
    if (!entry[1]()) {
      out.ok = false;
      out.checks.push({ name: label, ok: false, detail: 'Fichier absent — copiez-le depuis docs/admin-tresorerie/apps-script/' + label });
      Logger.log('❌ ' + label + ' — manquant dans le projet Apps Script');
    } else {
      Logger.log('✅ ' + label);
    }
  });
  if (!out.ok) {
    Logger.log('➡️ Copiez tous les .gs du Mac (voir liste ci-dessous dans le chat / GUIDE), puis relancez diagnosticConnexion');
    return out;
  }
  function check(name, fn) {
    try {
      var detail = fn();
      out.checks.push({ name: name, ok: true, detail: detail || "OK" });
      Logger.log("✅ " + name + (detail ? " — " + detail : ""));
    } catch (e) {
      out.ok = false;
      var msg = (e && e.message) || String(e);
      var code = e && e.code;
      out.checks.push({ name: name, ok: false, code: code || "", detail: msg });
      Logger.log("❌ " + name + " — " + msg + (code ? " [" + code + "]" : ""));
    }
  }
  check("JWT_SECRET", function () {
    getJwtSecret_();
    return "présent";
  });
  check("ADMIN_EMAIL", function () {
    return getAdminEmail_();
  });
  check("SPREADSHEET_ID", function () {
    return getSpreadsheetId_();
  });
  check("Ouverture tableur", function () {
    invalidateSheetCache_();
    _ssCache_ = null;
    var ss = getSpreadsheet_();
    return ss.getName() + " (" + ss.getUrl() + ")";
  });
  check("Onglet Users", function () {
    var sh = getSheet_("Users");
    if (!sh) throw new Error("Onglet Users absent — exécutez setupTresorerieSheets puis setupUsersFromWhitelist");
    var n = Math.max(0, sh.getLastRow() - 1);
    return n + " compte(s)";
  });
  check("Route auth/login (mot de passe faux → INVALID_CREDENTIALS)", function () {
    try {
      authLogin_({ email: getAdminEmail_(), password: "__diagnostic_wrong__" });
      throw new Error("Le login aurait dû échouer");
    } catch (e) {
      if (e && e.code === "INVALID_CREDENTIALS") return "route auth OK";
      throw e;
    }
  });
  Logger.log(out.ok ? "🎉 diagnosticConnexion OK" : "➡️ Corrigez les ❌ ci-dessus, puis Déployer → Nouvelle version");
  return out;
}

function diagnosticFichiers() {
  var files = [
    ['App.gs', { 'safeJsonReviver_': function () { return typeof safeJsonReviver_; }, 'route_': function () { return typeof route_; } }],
    ['Auth.gs', { 'authLoginGoogle_': function () { return typeof authLoginGoogle_; }, 'requireTreasurer_': function () { return typeof requireTreasurer_; } }],
    ['Security.gs', { 'publicError_': function () { return typeof publicError_; }, 'changePassword_': function () { return typeof changePassword_; }, 'checkedBlob_': function () { return typeof checkedBlob_; }, 'withWriteLock_': function () { return typeof withWriteLock_; } }],
    ['Config.gs', { 'getYearDocumentsSubfolder_': function () { return typeof getYearDocumentsSubfolder_; } }],
    ['SheetsRepo.gs', { 'appendAudit_': function () { return typeof appendAudit_; } }],
    ['Business.gs', { 'reimburseFacture_': function () { return typeof reimburseFacture_; }, 'createDirectExpense_': function () { return typeof createDirectExpense_; } }],
    ['AccessRequests.gs', { 'ensureUserAccount_': function () { return typeof ensureUserAccount_; } }],
    ['DriveService.gs', { 'blobFromAttachment_': function () { return typeof blobFromAttachment_; } }],
    ['FileNaming.gs', { 'buildStandardFilename_': function () { return typeof buildStandardFilename_; } }],
    ['JournalAnnee.gs', { 'attachInYearJournal_': function () { return typeof attachInYearJournal_; }, 'deleteFromYearJournal_': function () { return typeof deleteFromYearJournal_; } }],
    ['ComptaAnnee.gs', { 'exportRegistreXlsx_': function () { return typeof exportRegistreXlsx_; } }],
    ['Releves.gs', { 'uploadReleveArchive_': function () { return typeof uploadReleveArchive_; }, 'markReleveArchiveSynced_': function () { return typeof markReleveArchiveSynced_; }, 'importReleve_': function () { return typeof importReleve_; } }],
    ['Corrections.gs', { 'attachInvoice_': function () { return typeof attachInvoice_; }, 'requestDeletion_': function () { return typeof requestDeletion_; } }],
    ['SiteData.gs', { 'zipArchive_': function () { return typeof zipArchive_; }, 'getSiteData_': function () { return typeof getSiteData_; } }],
    ['Setup.gs', { 'remplacerMotsDePasseCommuns': function () { return typeof remplacerMotsDePasseCommuns; }, 'rotationSecretEtMotsDePasse': function () { return typeof rotationSecretEtMotsDePasse; } }],
    ['Bascule.gs', { 'basculeAnnee_': function () { return typeof basculeAnnee_; } }],
    ['GenererCloture.gs', { 'genererClotureAnnee_': function () { return typeof genererClotureAnnee_; }, 'getFinancesPubliques_': function () { return typeof getFinancesPubliques_; }, 'verifierGenerationCloture_': function () { return typeof verifierGenerationCloture_; } }],
    ['ExerciceCloture.gs', { 'recloturerExercice_': function () { return typeof recloturerExercice_; }, 'rouvrirExercice_': function () { return typeof rouvrirExercice_; } }],
  ];
  var vars = { RELEVES_ARCHIVES_HEADERS: function () { return typeof RELEVES_ARCHIVES_HEADERS; },
    MAX_UPLOAD_BYTES: function () { return typeof MAX_UPLOAD_BYTES; } };
  var aRemplacer = [];
  files.forEach(function (entry) {
    var missing = [];
    Object.keys(entry[1]).forEach(function (n) {
      var t; try { t = entry[1][n](); } catch (e) { t = 'undefined'; }
      if (t !== 'function') missing.push(n);
    });
    if (missing.length) aRemplacer.push(entry[0]);
    Logger.log((missing.length ? '❌ ' : '✅ ') + entry[0] + (missing.length ? ' — manque : ' + missing.join(', ') : ''));
  });
  Object.keys(vars).forEach(function (n) {
    var t; try { t = vars[n](); } catch (e) { t = 'undefined'; }
    if (t === 'undefined') Logger.log('❌ variable ' + n + ' absente');
  });
  Logger.log(aRemplacer.length
    ? '➡️ Fichiers à remplacer par la version du Mac : ' + aRemplacer.join(', ') + ' — puis Déployer → Gérer les déploiements → ✏️ → Nouvelle version.'
    : '🎉 Tous les fichiers sont à jour. Pensez à publier une nouvelle version du déploiement.');
}
