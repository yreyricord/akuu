/**
 * Exercices comptables 2017 → année en cours — lecture directe depuis les Google Sheets.
 * Remplace bilan-comptable.json / compta-historique.json pour les chiffres live.
 */

var EXERCICES_FIRST_YEAR_ = 2017;
var EXERCICES_CACHE_TTL_ = 600;
var RELEVE_FIRST_MONTH_2017_ = 2; // compte ouvert 23/02/2017 — relevés n°1–4 (fév.–mai) existent sur papier

var MOIS_LABELS_FR_ = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

/** Valeurs de contrôle (tableau trésorier) — soldes banque au 31/12 et ouvertures. */
var CONTROLE_EXERCICES_ = {
  2017: { produits: 8722.46, charges: 6455.68, resultat: 2266.78, solde_ouverture: 0, solde_cloture: 2266.78 },
  2018: { produits: 14681.30, charges: 9534.83, resultat: 5146.47, solde_ouverture: 2266.78, solde_cloture: 7413.25 },
  2019: { produits: 18023.89, charges: 10227.78, resultat: 7796.11, solde_ouverture: 7413.25, solde_cloture: 15209.36 },
  2020: { produits: 4602.42, charges: 5032.81, resultat: -430.39, solde_ouverture: 15209.36, solde_cloture: 14778.97 },
  2021: { produits: 1680.00, charges: 684.02, resultat: 995.98, solde_ouverture: 14778.97, solde_cloture: 15774.95 },
  2022: { produits: 899.07, charges: 1446.69, resultat: -547.62, solde_ouverture: 15774.95, solde_cloture: 15227.33 },
  2023: { produits: 1075.31, charges: 2905.09, resultat: -1829.78, solde_ouverture: 15227.33, solde_cloture: 13397.55 },
  2024: { produits: 9743.04, charges: 21215.24, resultat: -11472.20, solde_ouverture: 13397.55, solde_cloture: 1925.35 },
  2025: { produits: 6582.26, charges: 7193.75, resultat: -611.49, solde_ouverture: 1925.35, solde_cloture: 1313.86 },
  2026: { solde_ouverture: 1313.86 }
};

function r2_(v) { return Math.round(Number(v) * 100) / 100; }

function clotureMap_(ss) {
  var sh = ss.getSheetByName('Cloture');
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  tabRowsAny_(sh).forEach(function (r) {
    if (r.cle) out[String(r.cle)] = r.valeur;
  });
  return out;
}

function clotureNum_(map, key) {
  var v = map[key];
  if (v === '' || v === null || v === undefined) return null;
  return num_(v);
}

function clotureStr_(map, key) {
  return map[key] === undefined || map[key] === null ? '' : String(map[key]);
}

/** Écrit ou remplace une clé de l'onglet Cloture. */
function setClotureKeyForce_(ss, key, value) {
  var sh = ss.getSheetByName('Cloture') || ss.insertSheet('Cloture');
  if (sh.getLastRow() === 0) sh.appendRow(['cle', 'valeur']);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sh.appendRow([key, value]);
}

/** Idempotent : complète l'onglet Cloture avec les soldes de référence (à lancer une fois depuis l'éditeur). */
function completerOngletsCloture() {
  var current = new Date().getFullYear();
  var done = [];
  for (var year = EXERCICES_FIRST_YEAR_; year <= current; year++) {
    var ss = openYearJournal_(year);
    if (!ss) continue;
    var ctrl = CONTROLE_EXERCICES_[year] || {};
    var sh = ss.getSheetByName('Cloture') || ss.insertSheet('Cloture');
    if (sh.getLastRow() === 0) sh.appendRow(['cle', 'valeur']);
    var map = clotureMap_(ss);
    function setKey(k, v) {
      if (v === undefined || v === null || v === '') return;
      if (map[k] !== undefined && String(map[k]) !== '') return;
      var data = sh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === k) {
          sh.getRange(i + 1, 2).setValue(v);
          map[k] = v;
          return;
        }
      }
      sh.appendRow([k, v]);
      map[k] = v;
    }
    if (year === current) {
      setKey('statut', map.statut || 'ouvert');
    }
    if (ctrl.solde_ouverture !== undefined) setKey('solde_ouverture', ctrl.solde_ouverture);
    if (ctrl.solde_cloture !== undefined) setKey('solde_cloture', ctrl.solde_cloture);
    setKey('date_ag', map.date_ag || '');
    setKey('ecart_explication', map.ecart_explication || '');
    done.push(year);
  }
  Logger.log('Cloture complétée pour : ' + done.join(', '));
  invalidateExercicesCache_();
  done.forEach(function (y) { invalidateExerciceSnapshot_(y); });
  return { years: done };
}

/**
 * Purge les caches d'exercices.
 * `year` : purge ciblée (snapshot persistant + cache du journal de l'année) — à utiliser dès
 * qu'un exercice change d'état (réouverture, reclôture, import de relevé).
 * Sans année : seuls les caches memoire (CacheService) sont vidés ; les snapshots sont conservés
 * car ils sont validés à la lecture par exerciceSnapshotStillValid_.
 */
function invalidateExercicesCache_(year) {
  var cache = CacheService.getScriptCache();
  cache.remove('exercices_all');
  cache.remove('finances_publiques');
  for (var y = EXERCICES_FIRST_YEAR_; y <= new Date().getFullYear() + 1; y++) {
    cache.remove('exercice_' + y);
  }
  if (year) {
    invalidateExerciceSnapshot_(year);
    if (typeof invalidateJournalApiCache_ === 'function') invalidateJournalApiCache_(Number(year));
  }
}

function exerciceStatut_(cloture, year) {
  var s = clotureStr_(cloture, 'statut') || (year === new Date().getFullYear() ? 'ouvert' : 'clos');
  if (s === 'rouvert') return 'rouvert';
  if (s === 'ouvert') return 'ouvert';
  return 'clos';
}

/** Statut d'un exercice (onglet Cloture du Sheet, ou clos par défaut pour les années passées sans Sheet). */
function exerciceStatutFromYear_(year) {
  year = Number(year);
  var ss = openYearJournal_(year);
  if (!ss) return year < new Date().getFullYear() ? 'clos' : 'ouvert';
  return exerciceStatut_(clotureMap_(ss), year);
}

function isExerciceClos_(year) {
  return exerciceStatutFromYear_(year) === 'clos';
}

/** Refuse toute modification du journal (montant, date, catégorie, projet, suppression). Pièce jointe et notes : voir attachInYearJournal_. */
function assertExerciceModifiable_(year) {
  year = Number(year);
  if (isExerciceClos_(year)) {
    throw apiError_('FORBIDDEN', 'Exercice ' + year + ' clos : demandez sa réouverture à l\'administrateur.', 403);
  }
}

var PROTECTION_DESC_PREFIX_ = 'AKUU exercice ';

function removeAkuuProtections_(sheet) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (String(p.getDescription()).indexOf(PROTECTION_DESC_PREFIX_) >= 0) p.remove();
  });
}

/** Protège tous les onglets du journal (seul le propriétaire du script peut éditer). */
function protectYearJournal_(year) {
  var ss = openYearJournal_(year);
  if (!ss) return { year: year, protected: false, reason: 'no_sheet' };
  var owner = '';
  try { owner = Session.getEffectiveUser().getEmail(); } catch (e) { /* éditeur */ }
  var n = 0;
  ss.getSheets().forEach(function (sh) {
    removeAkuuProtections_(sh);
    var prot = sh.protect().setDescription(PROTECTION_DESC_PREFIX_ + year + ' clos');
    prot.removeEditors(prot.getEditors());
    if (owner) try { prot.addEditor(owner); } catch (e2) { /* ignore */ }
    prot.setWarningOnly(false);
    n++;
  });
  return { year: year, protected: true, sheets: n };
}

/** Lève la protection (réouverture — étape C). */
function unprotectYearJournal_(year) {
  var ss = openYearJournal_(year);
  if (!ss) return { year: year, unprotected: false };
  ss.getSheets().forEach(removeAkuuProtections_);
  return { year: year, unprotected: true };
}

/** Idempotent : protège les Sheets des exercices dont le statut est « clos ». À lancer une fois depuis l'éditeur. */
function verrouillerFeuillesExercicesClos() {
  var current = new Date().getFullYear();
  var done = [];
  for (var year = EXERCICES_FIRST_YEAR_; year < current; year++) {
    if (exerciceStatutFromYear_(year) !== 'clos') continue;
    var r = protectYearJournal_(year);
    if (r.protected) done.push(year);
  }
  Logger.log('Protection Sheets appliquée pour : ' + done.join(', '));
  return { years: done };
}

function expectedReleveMonths_(year) {
  var now = new Date();
  var y = Number(year);
  var start = 1;
  var end = 12;
  if (y === 2017) start = RELEVE_FIRST_MONTH_2017_;
  // Mois écoulés seulement : pas le mois en cours (aligné releves_bancaires.py)
  if (y === now.getFullYear()) end = now.getMonth();
  var out = [];
  for (var m = start; m <= end; m++) out.push(m);
  return out;
}

/** Fusion onglet Releves + PDF Drive (liens cliquables mois par mois sur le site). */
function relevesByMonthMap_(year, ss) {
  var byMonth = {};
  if (ss) {
    relevesOf_(ss).forEach(function (r) {
      var m = Number(String(r.mois || '').slice(5));
      if (m >= 1 && m <= 12) {
        byMonth[m] = {
          url: String(r.url || '').trim(),
          solde_fin: r.solde_fin,
          date_fin: r.date_fin,
          file_name: ''
        };
      }
    });
  }
  var drive = listDriveReleveMonths_(year);
  Object.keys(drive).forEach(function (k) {
    var m = Number(k);
    var d = drive[m];
    if (!byMonth[m]) {
      byMonth[m] = { url: d.url, file_name: d.file_name, solde_fin: null, date_fin: '' };
    } else if (!byMonth[m].url) {
      byMonth[m].url = d.url;
      byMonth[m].file_name = d.file_name;
    }
  });
  return byMonth;
}

function enrichRelevesWithDrive_(year, releves) {
  var drive = listDriveReleveMonths_(year);
  var out = releves.map(function (r) {
    var copy = {
      mois: r.mois, date_fin: r.date_fin, solde_debut: r.solde_debut,
      solde_fin: r.solde_fin, url: String(r.url || ''), operations_ajoutees: r.operations_ajoutees
    };
    var m = Number(String(copy.mois || '').slice(5));
    if (m >= 1 && m <= 12 && !copy.url && drive[m]) copy.url = drive[m].url;
    return copy;
  });
  Object.keys(drive).forEach(function (k) {
    var m = Number(k);
    var moisStr = year + '-' + (m < 10 ? '0' : '') + m;
    var found = out.some(function (r) { return String(r.mois || '').substring(0, 7) === moisStr; });
    if (!found) {
      out.push({
        mois: moisStr, date_fin: '', solde_debut: null, solde_fin: null,
        url: drive[m].url, operations_ajoutees: 0
      });
    }
  });
  return out.sort(function (a, b) {
    var da = String(a.date_fin || a.mois || '');
    var db = String(b.date_fin || b.mois || '');
    return db.localeCompare(da);
  });
}

function relevesStatusForYear_(year, ss) {
  var expected = expectedReleveMonths_(year);
  var present = {};
  if (ss) {
    relevesOf_(ss).forEach(function (r) {
      var m = Number(String(r.mois || '').slice(5));
      // Onglet Releves : compte seulement si une URL PDF est renseignée (évite les lignes métadonnées sans fichier)
      if (m >= 1 && m <= 12 && String(r.url || '').trim()) present[m] = true;
    });
  }
  var drive = listDriveReleveMonths_(year);
  Object.keys(drive).forEach(function (k) { present[Number(k)] = true; });

  var missing = [];
  expected.forEach(function (m) {
    if (!present[m]) {
      missing.push({
        month: m,
        year: year,
        label: MOIS_LABELS_FR_[m - 1] + ' ' + year,
        suggested_filename: year + '_' + (m < 10 ? '0' : '') + m + '_RELEVE_PRO_AKUU.pdf'
      });
    }
  });

  var monthsPresent = Object.keys(present).map(Number).filter(function (m) {
    return expected.indexOf(m) >= 0;
  }).sort(function (a, b) { return a - b; });

  var note = '';
  if (year === 2017) {
    note = 'Compte pro ouvert le 23/02/2017. Le relevé de juin porte le n°5 : les relevés n°1 à 4 (février à mai) existent sur papier mais ne sont pas encore numérisés. Relevés attendus : février à décembre (11 mois).';
  } else if (year === 2018) {
    note = 'Relevés PDF complets à partir de mai 2018 ; janvier–avril reposent sur le journal comptable (relevés papier non numérisés).';
  }

  var byMonth = relevesByMonthMap_(year, ss);
  var relevesLinks = monthsPresent.map(function (m) {
    var info = byMonth[m] || {};
    return {
      month: m,
      url: String(info.url || ''),
      solde_fin: info.solde_fin != null ? info.solde_fin : null,
      file_name: info.file_name || standardReleveFileName_(year, m)
    };
  });

  return {
    year: year,
    status: missing.length ? 'incomplete' : 'complete',
    label: missing.length
      ? (year === 2017
        ? missing.length + ' relevé(s) Crédit Coop manquant(s) (depuis février 2017)'
        : missing.length + ' relevé(s) bancaire(s) manquant(s)')
      : monthsPresent.length + ' relevé(s) présents',
    count: monthsPresent.length,
    months_present: monthsPresent,
    expected: expected.length,
    missing: missing,
    upload_enabled: true,
    historique_note: note || null,
    releves_by_month: byMonth,
    releves_links: relevesLinks
  };
}

function computeComptaFromJournal_(ss) {
  var journal = ss.getSheetByName('Journal');
  var rows = journal ? tabRows_(journal).rows : [];
  var produits = 0, charges = 0, postesP = {}, postesC = {}, groupes = {}, projets = {};
  var releves = relevesOf_(ss);
  var dateReleve = releves.length ? releves[0].date_fin : '';
  var rap = { recettes_au_releve: 0, depenses_au_releve: 0, apres_releve_nb: 0, apres_releve_net: 0 };
  var add = function (o, k, v) { o[k] = r2_((o[k] || 0) + v); };
  rows.forEach(function (r) {
    var type = normTxt_(r.entry_type);
    var eur = num_(r.amount_eur) || 0;
    if (!eur || (type !== 'recette' && type !== 'depense')) return;
    var d = isoDate_(r.expense_date);
    if (dateReleve && d <= dateReleve) {
      if (type === 'recette') rap.recettes_au_releve += eur; else rap.depenses_au_releve += eur;
    } else if (dateReleve) {
      rap.apres_releve_nb += 1;
      rap.apres_releve_net += type === 'recette' ? eur : -eur;
    }
    var cat = normTxt_(r.category);
    var proj = String(r.project || '').toUpperCase();
    if (type === 'recette') {
      produits += eur;
      var p = RECETTE_POSTES_[cat] || 'P6';
      add(postesP, p, eur);
      var g = RECETTE_GROUPES_[p];
      if (p === 'P4') {
        var txt = normTxt_(String(r.label || '') + ' ' + String(r.notes || ''));
        g = (txt.indexOf('week-end de cohesion') >= 0 || (' ' + txt).indexOf(' wec') >= 0) ? 'Week-end de cohésion' : 'Loyers maison communautaire';
      }
      add(groupes, g, eur);
    } else {
      charges += eur;
      if (BANK_FEES_.indexOf(cat) >= 0) { add(postesC, 'C3', eur); add(projets, 'Frais bancaires', eur); }
      else if (proj === 'FONCTIONNEMENT') { add(postesC, 'C2', eur); add(projets, 'Fonctionnement', eur); }
      else if (NON_MISSION_.indexOf(proj) >= 0 || !PROJECT_LABELS_[proj]) { add(postesC, 'C4', eur); add(projets, 'Autres / non affecté', eur); }
      else { add(postesC, 'C1', eur); add(projets, PROJECT_LABELS_[proj].replace(' (Casa AKUU)', ''), eur); }
    }
  });
  var terrain = {};
  var pm = journalTabSheet_(ss, DETAIL_PM_TAB);
  (pm ? tabRows_(pm).rows : []).forEach(function (r) {
    if (String(r.category) === 'Facture cataloguée' || normTxt_(r.entry_type) === 'recette') return;
    var pen = num_(r.amount_pen);
    if (pen) add(terrain, PROJECT_LABELS_[String(r.project || '').toUpperCase()] || 'Divers / non affecté', pen);
  });
  return {
    produits_eur: r2_(produits), charges_eur: r2_(charges), resultat_eur: r2_(produits - charges),
    produits_postes: postesP, charges_postes: postesC,
    recettes_groupes: groupes, loyers_maison_eur: groupes['Loyers maison communautaire'] || 0,
    charges_projets: projets, terrain_pen: terrain,
    releves: releves, dernier_releve: releves[0] || null,
    rapprochement: {
      date_releve: dateReleve,
      recettes_au_releve: r2_(rap.recettes_au_releve),
      depenses_au_releve: r2_(rap.depenses_au_releve),
      apres_releve_nb: rap.apres_releve_nb,
      apres_releve_net: r2_(rap.apres_releve_net)
    }
  };
}

function buildTresorerie_(year, cloture, compta) {
  var ouv = clotureNum_(cloture, 'solde_ouverture');
  if (ouv === null && CONTROLE_EXERCICES_[year]) ouv = CONTROLE_EXERCICES_[year].solde_ouverture;
  if (ouv === null) ouv = 0;
  var calc = r2_(ouv + compta.resultat_eur);
  var releveFin = clotureNum_(cloture, 'solde_cloture');
  if (releveFin === null && compta.dernier_releve && compta.dernier_releve.solde_fin != null) {
    releveFin = compta.dernier_releve.solde_fin;
  }
  var ecart = releveFin === null ? null : r2_(calc - releveFin);
  var statut = 'ok';
  if (ecart !== null && Math.abs(ecart) >= 0.01) {
    statut = clotureStr_(cloture, 'ecart_explication') ? 'documente' : 'ecart';
  }
  return {
    solde_ouverture_eur: ouv,
    solde_calcule_eur: calc,
    solde_releve_eur: releveFin,
    ecart_rapprochement_eur: ecart === null ? 0 : ecart,
    statut_rapprochement: statut
  };
}

function buildExercicePayload_(year, ss) {
  var cloture = clotureMap_(ss);
  var compta = computeComptaFromJournal_(ss);
  var releves = enrichRelevesWithDrive_(year, compta.releves);
  compta.releves = releves;
  compta.dernier_releve = releves.length ? releves[0] : null;
  var statut = exerciceStatut_(cloture, year);
  var version = Number(clotureStr_(cloture, 'version') || 1);
  var treso = buildTresorerie_(year, cloture, compta);
  var relevesStatus = relevesStatusForYear_(year, ss);
  return {
    year: year,
    live: true,
    statut: statut,
    version: version,
    provisoire: statut === 'ouvert',
    approuve_en_ag: clotureStr_(cloture, 'approuve_en_ag') || (statut === 'clos' ? 'oui' : 'non'),
    updated_at: new Date().toISOString(),
    sheet_url: ss.getUrl(),
    produits_eur: compta.produits_eur,
    charges_eur: compta.charges_eur,
    resultat_eur: compta.resultat_eur,
    produits_postes: compta.produits_postes,
    charges_postes: compta.charges_postes,
    recettes_groupes: compta.recettes_groupes,
    loyers_maison_eur: compta.loyers_maison_eur,
    charges_projets: compta.charges_projets,
    terrain_pen: compta.terrain_pen,
    tresorerie: treso,
    releves: compta.releves,
    dernier_releve: compta.dernier_releve,
    rapprochement: compta.rapprochement,
    releves_status: relevesStatus,
    cloture_meta: {
      date_ag: clotureStr_(cloture, 'date_ag'),
      ecart_explication: clotureStr_(cloture, 'ecart_explication'),
      bascule_le: clotureStr_(cloture, 'bascule_le'),
      bascule_par: clotureStr_(cloture, 'bascule_par'),
      rouvert_le: clotureStr_(cloture, 'rouvert_le'),
      rouvert_par: clotureStr_(cloture, 'rouvert_par'),
      rouvert_motif: clotureStr_(cloture, 'rouvert_motif')
    }
  };
}

function exerciceSnapshotKey_(year) {
  return 'EXERCICE_SNAPSHOT_' + year;
}

/** Supprime le snapshot persistant d'un exercice (il prime sur le contenu réel du Sheet). */
function invalidateExerciceSnapshot_(year) {
  year = Number(year);
  if (!year) return;
  try {
    PropertiesService.getScriptProperties().deleteProperty(exerciceSnapshotKey_(year));
  } catch (e) {
    Logger.log('exercice snapshot delete ' + year + ': ' + e);
  }
}

/**
 * Un snapshot n'est valable que si l'onglet Cloture n'a pas bougé depuis sa construction.
 * Lire cet onglet coûte quelques appels, reconstruire tout le payload en coûte des milliers
 * (Journal + Detail_PM + Releves + Drive) : c'est ce contrôle qui évite qu'un exercice rouvert
 * continue d'être servi comme « clos ».
 */
function exerciceSnapshotStillValid_(year, snap) {
  var ss = openYearJournal_(year);
  if (!ss) return false;
  var map = clotureMap_(ss);
  var statut = exerciceStatut_(map, year);
  var version = Number(clotureStr_(map, 'version') || 1);
  return String(snap.statut || '') === statut && Number(snap.version || 1) === version;
}

function readExercice_(year) {
  year = Number(year);
  var cache = CacheService.getScriptCache();
  var key = 'exercice_' + year;
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* recalc */ }
  }
  var props = PropertiesService.getScriptProperties();
  var snapKey = exerciceSnapshotKey_(year);
  if (year < new Date().getFullYear()) {
    var snap = props.getProperty(snapKey);
    if (snap) {
      try {
        var parsed = JSON.parse(snap);
        if (exerciceSnapshotStillValid_(year, parsed)) {
          cache.put(key, snap, EXERCICES_CACHE_TTL_);
          return parsed;
        }
        // Statut ou version modifiés (réouverture, reclôture…) : le snapshot est périmé.
        try { props.deleteProperty(snapKey); } catch (e2) { /* ignore */ }
      } catch (e) { /* recalc */ }
    }
  }
  var ss = openYearJournal_(year);
  if (!ss) return { year: year, live: false };
  var payload = buildExercicePayload_(year, ss);
  var json = JSON.stringify(payload);
  cache.put(key, json, EXERCICES_CACHE_TTL_);
  // Seul un exercice clos est figé : un exercice ouvert ou rouvert doit rester relu en direct.
  if (payload.statut === 'clos') {
    try { props.setProperty(snapKey, json); } catch (e) { Logger.log('exercice snapshot ' + year + ': ' + e); }
  }
  return payload;
}

function getExercice_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  return readExercice_(year);
}

function getExercices_(session) {
  requireTreasurer_(session);
  var cache = CacheService.getScriptCache();
  var cached = cache.get('exercices_all');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* recalc */ }
  }
  var current = new Date().getFullYear();
  var years = [];
  for (var y = EXERCICES_FIRST_YEAR_; y <= current; y++) {
    var ex = readExercice_(y);
    if (ex.live) years.push(ex);
  }
  var out = {
    generated_at: new Date().toISOString(),
    source: 'google_sheets',
    years: years
  };
  cache.put('exercices_all', JSON.stringify(out), EXERCICES_CACHE_TTL_);
  return out;
}

/** Contrôle admin : compare les totaux journal aux valeurs de référence 2017–2025. */
function verifierExercicesControle_(session) {
  requireAdmin_(session);
  var rows = [];
  for (var y = EXERCICES_FIRST_YEAR_; y <= 2025; y++) {
    var ref = CONTROLE_EXERCICES_[y];
    if (!ref || !ref.produits) continue;
    var ex = readExercice_(y);
    if (!ex.live) {
      rows.push({ year: y, ok: false, detail: 'Journal Google absent' });
      continue;
    }
    var ok = Math.abs(ex.produits_eur - ref.produits) < 0.01 &&
      Math.abs(ex.charges_eur - ref.charges) < 0.01 &&
      Math.abs(ex.resultat_eur - ref.resultat) < 0.01 &&
      Math.abs((ex.tresorerie.solde_releve_eur || 0) - ref.solde_cloture) < 0.01;
    rows.push({
      year: y, ok: ok,
      produits: ex.produits_eur, charges: ex.charges_eur, resultat: ex.resultat_eur,
      banque: ex.tresorerie.solde_releve_eur,
      ecart: ex.tresorerie.ecart_rapprochement_eur,
      detail: ok ? 'OK' : 'Écart détecté — ne pas corriger le journal sans réouverture'
    });
  }
  return { ok: rows.every(function (r) { return r.ok; }), rows: rows };
}
