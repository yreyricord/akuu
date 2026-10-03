/**
 * Caisse espèces au Pérou — reste en cash après retraits/WU et dépenses Detail_PM.
 * Entrées = retraits DAB / Western Union (journal EUR → PEN au taux indicatif).
 * Sorties = tickets Detail_PM payés en espèces uniquement (hors carte / catalogue journal).
 * Ouverture = clé Cloture « caisse_pen_ouverture ».
 */

function isDetailPmCaisseCash_(row) {
  if (normTxt_(row.entry_type) !== 'depense') return false;
  if (!(num_(row.amount_pen) > 0)) return false;
  var method = readPaymentMethod_(row);
  if (!method) return false;
  return isPaymentMethodCaisse_(method);
}

/** Ligne Detail_PM en PEN sans mode de paiement renseigné (ne doit pas alimenter la caisse). */
function isDetailPmUnclassified_(row) {
  if (normTxt_(row.entry_type) !== 'depense') return false;
  if (!(num_(row.amount_pen) > 0)) return false;
  return !normTxt_(row.payment_method) && !readPaymentMethod_(row);
}

/** Abonnements / achats CB France ou SaaS — jamais des retraits caisse Pérou. */
function isRetraitExcludedMerchant_(txt) {
  return /greengeeks|google one|la guilde|bitwarden|wix|adobe|weglot|ovh|apple|skype|paypal|vm\*comercial/.test(txt);
}

/** DAB / WU au Pérou sur le relevé Crédit Coop (CB … N.5770100 … ou catégorie transfert). */
function isRetraitTerrain_(row) {
  var cat = normTxt_(row.category);
  if (cat.indexOf('retrait') >= 0 || cat.indexOf('transfert') >= 0) return true;
  var txt = normTxt_(String(row.label || '') + ' ' + String(row.notes || ''));
  if (isRetraitExcludedMerchant_(txt)) return false;
  if (/western union|disposicion|\bwu\b/.test(txt)) return true;
  if (/atm red unicard|red unicard/.test(txt)) return true;
  if (txt.indexOf('dab') >= 0 || /\batm\b/.test(txt)) return true;
  // CB au Pérou : « CB AV. MARISCAL CA | N.5770100 M REY RICORD » (sans le mot ATM)
  if (/\bcb\b/.test(txt) && /5770100|n\.5770100/.test(txt)) {
    if (/mariscal|junin|yavari|condamine|iquitos|red unicard|\batm\b/.test(txt)) return true;
  }
  return false;
}

/** Grille indicative EUR débité → PEN reçus (DAB Pérou, d’après suivi bénévoles). */
function suggestPenFromEurRetrait_(eur) {
  eur = Number(eur);
  if (!eur) return 0;
  if (eur >= 175 && eur <= 195) return 700;
  if (eur >= 128 && eur <= 145) return 1000;
  if (eur >= 78 && eur <= 88) return 400;
  if (eur >= 98 && eur <= 115) return 800;
  if (eur >= 38 && eur <= 48) return 175;
  return 0;
}

/** Référence bénévoles 2026 (onglet « Retrait atm » du compte des dépenses) — 16 DAB, 12 700 S/. */
var RETRAITS_PEN_REFERENCE_2026_ = [
  { date: '2026-01-13', pen: 800 }, { date: '2026-01-14', pen: 400 }, { date: '2026-01-31', pen: 800 },
  { date: '2026-02-11', pen: 800 }, { date: '2026-02-18', pen: 800 }, { date: '2026-02-20', pen: 800 },
  { date: '2026-02-21', pen: 800 }, { date: '2026-03-04', pen: 800 }, { date: '2026-03-17', pen: 800 },
  { date: '2026-04-25', pen: 400 }, { date: '2026-05-03', pen: 800 }, { date: '2026-05-21', pen: 1000 },
  { date: '2026-05-24', pen: 1400 }, { date: '2026-06-22', pen: 800 }, { date: '2026-08-20', pen: 800 },
  { date: '2026-09-29', pen: 700 }
];

function retraitReferenceForYear_(year) {
  if (Number(year) === 2026) return RETRAITS_PEN_REFERENCE_2026_;
  return null;
}

/**
 * Rapproche chaque écriture journal du retrait bénévole le plus proche (±3 j),
 * puis affiche 1 ligne par date de référence (12 700 S/. en 2026).
 */
function consolidateRetraitsFromReference_(rawRetraits, refList, penToEur) {
  if (!refList || !refList.length) return null;
  var buckets = {};
  refList.forEach(function (ref) { buckets[ref.date] = { ref: ref, lines: [] }; });
  var extras = [];

  rawRetraits.forEach(function (rt) {
    var bestRef = null;
    var bestD = 999;
    refList.forEach(function (ref) {
      var d = Math.abs(daysBetween_(rt.date, ref.date));
      if (d <= 3 && d < bestD) {
        bestD = d;
        bestRef = ref;
      }
    });
    if (bestRef) buckets[bestRef.date].lines.push(rt);
    else extras.push(rt);
  });

  var out = refList.map(function (ref) {
    var lines = buckets[ref.date].lines;
    var eur = 0;
    var refs = [];
    lines.forEach(function (ln) {
      eur += num_(ln.amount_eur) || 0;
      refs.push(String(ln.reference));
    });
    return {
      reference: refs[0] || ('REF-' + ref.date),
      references: refs,
      date: ref.date,
      journal_date: refs.length ? lines[0].date : ref.date,
      label: refs.length > 1
        ? ('DAB · ' + refs.length + ' écritures journal')
        : (refs.length ? String(lines[0].label || '') : 'Retrait DAB · suivi bénévole'),
      amount_eur: r2_(eur),
      amount_pen: r2_(ref.pen),
      pen_source: 'reference_benevoles',
      pen_estimated: false,
      pen_editable: refs.length > 0,
      consolidated: refs.length > 1,
      no_journal: refs.length === 0
    };
  });

  extras.forEach(function (rt) {
    var ent = retraitPenEntree_(rt, penToEur, 0);
    var isWu = /western union|disposicion|\bwu\b/.test(normTxt_(String(rt.label || '') + ' ' + String(rt.notes || '')));
    out.push({
      reference: String(rt.reference),
      references: [String(rt.reference)],
      date: rt.date,
      journal_date: rt.date,
      label: String(rt.label || ''),
      amount_eur: r2_(rt.amount_eur),
      amount_pen: ent.pen,
      pen_source: ent.source,
      pen_estimated: ent.estimated,
      rate_date: ent.rate_date || null,
      pen_editable: true,
      consolidated: false,
      extra_journal: true,
      counts_in_reference: isWu
    });
  });

  out.sort(function (a, b) {
    return String(a.date || '').localeCompare(String(b.date || '')) ||
      String(a.reference || '').localeCompare(String(b.reference || ''));
  });
  return out;
}

function buildRetraitPenRefPool_(year) {
  if (Number(year) !== 2026) return [];
  return RETRAITS_PEN_REFERENCE_2026_.map(function (x) {
    return { date: x.date, pen: x.pen, used: false };
  });
}

function takeRefPenForDate_(pool, isoDate) {
  if (!isoDate || !pool.length) return 0;
  var best = null, bestD = 999, i, d;
  for (i = 0; i < pool.length; i++) {
    if (pool[i].used) continue;
    d = Math.abs(daysBetween_(isoDate, pool[i].date));
    if (d <= 3 && d < bestD) { bestD = d; best = pool[i]; }
  }
  if (best) { best.used = true; return best.pen; }
  return 0;
}

function daysBetween_(a, b) {
  try {
    var da = new Date(String(a).substring(0, 10));
    var db = new Date(String(b).substring(0, 10));
    return Math.round((da - db) / 86400000);
  } catch (e) { return 999; }
}

function rowYear_(dateVal) {
  var iso = isoDate_(dateVal);
  return iso ? Number(iso.substring(0, 4)) : null;
}

/** 1 PEN = penToEur EUR → montant EUR converti en PEN. */
function eurToPen_(eur, penToEur) {
  if (!penToEur || !eur) return 0;
  return r2_(Number(eur) / Number(penToEur));
}

/** PEN réellement reçus au DAB / WU — notes « pen_recu=700 » ou « 700 S/ recu ». */
function parsePenRecuFromNotes_(notes) {
  var s = String(notes || '');
  var m = s.match(/pen[_\s-]?recu\s*[=:]\s*(\d+(?:[.,]\d+)?)/i) ||
    s.match(/retrait\s*[=:]\s*(\d+(?:[.,]\d+)?)\s*pen/i) ||
    s.match(/(\d+(?:[.,]\d+)?)\s*s\/?\.?\s*recu/i);
  if (!m) return 0;
  return r2_(Number(String(m[1]).replace(',', '.')));
}

function getExchangeRateForDate_(isoDate) {
  if (!isoDate) return getExchangeRate_();
  var cache = CacheService.getScriptCache();
  var key = 'pen_eur_' + String(isoDate).substring(0, 10);
  var cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  try {
    var res = UrlFetchApp.fetch('https://api.frankfurter.app/' + key + '?from=PEN&to=EUR', { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());
    var payload = { rate: data.rates.EUR, source: 'Frankfurter/ECB', date: key, requestedDate: key };
    cache.put(key, JSON.stringify(payload), 604800);
    return payload;
  } catch (e) {
    return getExchangeRate_();
  }
}

/** Entrée caisse en PEN : amount_pen journal > notes pen_recu > conversion EUR à la date. */
function retraitPenEntree_(row, fallbackPenToEur, refPenHint) {
  var penCol = num_(row.amount_pen);
  if (penCol > 0) {
    return { pen: r2_(penCol), source: 'amount_pen', estimated: false };
  }
  var fromNotes = parsePenRecuFromNotes_(row.notes);
  if (fromNotes > 0) {
    return { pen: fromNotes, source: 'notes', estimated: false };
  }
  if (refPenHint > 0) {
    return { pen: r2_(refPenHint), source: 'reference_benevoles', estimated: true };
  }
  var eur = num_(row.amount_eur) || 0;
  var suggested = suggestPenFromEurRetrait_(eur);
  if (suggested > 0) {
    return { pen: suggested, source: 'grille_eur_pen', estimated: true };
  }
  var iso = isoDate_(row.expense_date || row.date);
  var rateInfo = iso ? getExchangeRateForDate_(iso) : getExchangeRate_();
  var penToEur = rateInfo && rateInfo.rate ? Number(rateInfo.rate) : fallbackPenToEur;
  return {
    pen: eurToPen_(eur, penToEur),
    source: 'eur_converti',
    estimated: true,
    rate_date: rateInfo ? rateInfo.date : null
  };
}

/** Lots FIFO : chaque retrait = lot ; dépenses espèces consomment du plus ancien au plus récent. */
function buildLotsCaisse_(ouverturePen, retraits, especes) {
  var lots = [];
  if (ouverturePen > 0.001) {
    lots.push({
      id: 'ouverture',
      reference: 'ouverture',
      date: '',
      label: 'Caisse au 1er janvier',
      amount_eur: 0,
      pen_recu: r2_(ouverturePen),
      pen_source: 'caisse_pen_ouverture',
      pen_estimated: false,
      depenses_pen: 0,
      reste_pen: r2_(ouverturePen),
      depenses: []
    });
  }
  retraits.slice().sort(function (a, b) {
    return String(a.date || '').localeCompare(String(b.date || ''));
  }).forEach(function (rt) {
    lots.push({
      id: rt.reference,
      reference: rt.reference,
      date: rt.date,
      label: rt.label,
      amount_eur: rt.amount_eur,
      pen_recu: rt.amount_pen,
      pen_source: rt.pen_source || 'eur_converti',
      pen_estimated: !!rt.pen_estimated,
      rate_date: rt.rate_date || null,
      depenses_pen: 0,
      reste_pen: rt.amount_pen,
      depenses: []
    });
  });
  var poolIdx = 0;
  especes.slice().sort(function (a, b) {
    return String(a.date || '').localeCompare(String(b.date || ''));
  }).forEach(function (exp) {
    var remaining = num_(exp.amount_pen) || 0;
    while (remaining > 0.001 && poolIdx < lots.length) {
      var lot = lots[poolIdx];
      var room = r2_(lot.pen_recu - lot.depenses_pen);
      if (room <= 0.001) {
        poolIdx += 1;
        continue;
      }
      var take = Math.min(room, remaining);
      lot.depenses.push({
        reference: exp.reference,
        date: exp.date,
        label: exp.label,
        amount_pen: r2_(take)
      });
      lot.depenses_pen = r2_(lot.depenses_pen + take);
      lot.reste_pen = r2_(lot.pen_recu - lot.depenses_pen);
      remaining = r2_(remaining - take);
      if (lot.reste_pen <= 0.001) poolIdx += 1;
    }
  });
  return lots;
}

function getCaissePerou_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  var ss = openYearJournal_(year);
  if (!ss) {
    return { year: year, live: false };
  }

  var cloture = clotureMap_(ss);
  var ouverturePen = clotureNum_(cloture, 'caisse_pen_ouverture') || 0;

  var retraits = [];
  var journal = ss.getSheetByName('Journal');
  (journal ? tabRows_(journal).rows : []).forEach(function (r) {
    if (normTxt_(r.entry_type) !== 'depense') return;
    if (rowYear_(r.expense_date) !== year) return;
    if (!isRetraitTerrain_(r)) return;
    var eur = num_(r.amount_eur) || 0;
    if (!eur) return;
    retraits.push({
      reference: String(r.reference),
      date: isoDate_(r.expense_date),
      label: String(r.label || ''),
      amount_eur: r2_(eur),
      amount_pen: num_(r.amount_pen) || 0,
      notes: String(r.notes || '')
    });
  });

  var especes = [];
  var nonClasses = [];
  var depensesTerrain = [];
  var totalsByMode = { especes: 0, avance: 0, cb: 0, yape_plin: 0, virement: 0, autre: 0, non_classe: 0 };
  var pm = ss.getSheetByName('Detail_PM');
  (pm ? tabRows_(pm).rows : []).forEach(function (r) {
    if (rowYear_(r.expense_date) !== year) return;
    if (normTxt_(r.entry_type) !== 'depense') return;
    var pen = num_(r.amount_pen) || 0;
    if (!pen) return;
    var explicit = normTxt_(r.payment_method);
    var method = readPaymentMethod_(r);
    var item = {
      reference: String(r.reference),
      date: isoDate_(r.expense_date),
      label: String(r.label || ''),
      project: String(r.project || ''),
      amount_pen: r2_(pen),
      payment_method: method,
      payment_method_explicit: explicit,
      drive_file_url: String(r.drive_file_url || ''),
      piece_filename: String(r.piece_filename || ''),
      caisse_cash: isDetailPmCaisseCash_(r)
    };
    if (!method) {
      totalsByMode.non_classe += pen;
      nonClasses.push(item);
      depensesTerrain.push(item);
    } else if (isPaymentMethodCaisse_(method)) {
      totalsByMode[method] += pen;
      depensesTerrain.push(item);
    } else if (totalsByMode[method] != null) {
      totalsByMode[method] += pen;
    } else {
      totalsByMode.autre += pen;
    }
    if (isDetailPmUnclassified_(r)) return;
    if (!isDetailPmCaisseCash_(r)) return;
    especes.push({
      reference: item.reference,
      date: item.date,
      label: item.label,
      project: item.project,
      amount_pen: item.amount_pen
    });
  });
  depensesTerrain.sort(function (a, b) { return (b.date + b.reference).localeCompare(a.date + a.reference); });
  Object.keys(totalsByMode).forEach(function (k) { totalsByMode[k] = r2_(totalsByMode[k]); });
  var horsCaissePen = r2_((totalsByMode.avance || 0) + (totalsByMode.cb || 0) +
    (totalsByMode.virement || 0) + (totalsByMode.autre || 0));
  var caisseDepensesPen = r2_((totalsByMode.especes || 0) + (totalsByMode.yape_plin || 0));

  var rateInfo = getExchangeRate_();
  var penToEur = rateInfo && rateInfo.rate ? Number(rateInfo.rate) : null;
  var penPerEur = penToEur ? r2_(1 / penToEur) : null;

  retraits.sort(function (a, b) {
    return String(a.date || '').localeCompare(String(b.date || '')) ||
      String(a.reference || '').localeCompare(String(b.reference || ''));
  });

  var retraitsJournalCount = retraits.length;
  var refList = retraitReferenceForYear_(year);
  var retraitsDisplay = consolidateRetraitsFromReference_(retraits, refList, penToEur);
  if (!retraitsDisplay) {
    var refPool = buildRetraitPenRefPool_(year);
    retraits.forEach(function (rt) {
      var hint = takeRefPenForDate_(refPool, rt.date);
      var ent = retraitPenEntree_(rt, penToEur, hint);
      rt.amount_pen = ent.pen;
      rt.pen_source = ent.source;
      rt.pen_estimated = ent.estimated;
      rt.rate_date = ent.rate_date || null;
      rt.pen_editable = true;
      rt.references = [rt.reference];
      rt.consolidated = false;
    });
    retraitsDisplay = retraits;
  }

  var entreesPen = 0;
  var retraitsSansPen = 0;
  retraitsDisplay.forEach(function (rt) {
    if (rt.pen_estimated) retraitsSansPen += 1;
    if (rt.extra_journal && !rt.counts_in_reference) return;
    entreesPen += num_(rt.amount_pen) || 0;
  });
  entreesPen = r2_(entreesPen);

  var lots = buildLotsCaisse_(ouverturePen, retraitsDisplay, especes);
  var sortiesPen = r2_(especes.reduce(function (s, x) { return s + x.amount_pen; }, 0));
  var totalEur = r2_(retraitsDisplay.reduce(function (s, x) { return s + x.amount_eur; }, 0));
  var soldePen = r2_(ouverturePen + entreesPen - sortiesPen);
  var soldeEur = penToEur ? r2_(soldePen * penToEur) : null;

  var nonClassesPen = r2_(nonClasses.reduce(function (s, x) { return s + x.amount_pen; }, 0));
  var alerte = null;
  if (nonClasses.length > 0) {
    alerte = nonClasses.length + ' dépense(s) terrain (' + nonClassesPen + ' PEN) sans mode de paiement — exclues du solde. ' +
      'Corrigez le mode dans Écritures ou Suivi terrain (Espèces / Avance / Carte).';
  }
  if (retraitsSansPen > 0) {
    alerte = (alerte ? alerte + ' ' : '') +
      retraitsSansPen + ' retrait(s) avec PEN indicatif — validez ou corrigez la colonne S/. reçus puis OK.';
  }
  if (horsCaissePen > 0.01 && sortiesPen > 0.01) {
    var impliedSpend = r2_(entreesPen + ouverturePen - 1300);
    if (impliedSpend > sortiesPen + 500 && impliedSpend < sortiesPen + horsCaissePen) {
      alerte = (alerte ? alerte + ' ' : '') +
        'Écart possible : ' + r2_(horsCaissePen) + ' S/. en « avance/carte » — si payé en cash caisse, repassez en Espèces (onglet Écritures).';
    }
  }
  if (soldePen < -0.01) {
    alerte = (alerte ? alerte + ' ' : '') +
      'Solde négatif : retraits WU/DAB insuffisants dans le journal banque, ou caisse_pen_ouverture manquant (onglet Cloture). ' +
      'Les avances bénévoles et paiements carte ne passent pas par la caisse espèces.';
  } else if (!ouverturePen && sortiesPen > entreesPen + 0.01 && !nonClasses.length) {
    alerte = (alerte ? alerte + ' ' : '') +
      'Les paiements espèces dépassent les retraits convertis : renseignez caisse_pen_ouverture (espèces au 1er janvier).';
  }

  return {
    year: year,
    live: true,
    caisse_pen_ouverture: r2_(ouverturePen),
    caisse_pen_entrees: entreesPen,
    caisse_pen_sorties: sortiesPen,
    caisse_pen_solde: soldePen,
    caisse_eur_equiv: soldeEur,
    retraits_eur: totalEur,
    retraits_count: retraitsDisplay.length,
    retraits_journal_count: retraitsJournalCount,
    retraits_pen_reference: refList ? r2_(refList.reduce(function (s, x) { return s + x.pen; }, 0)) : null,
    especes_pen: sortiesPen,
    especes_count: especes.length,
    non_classes_count: nonClasses.length,
    non_classes_pen: nonClassesPen,
    non_classes: nonClasses.slice(0, 50),
    depenses_terrain: depensesTerrain,
    depenses_terrain_count: depensesTerrain.length,
    totals_by_mode: totalsByMode,
    depenses_caisse_pen: caisseDepensesPen,
    depenses_hors_caisse_pen: horsCaissePen,
    pen_to_eur: penToEur,
    pen_per_eur: penPerEur,
    taux_date: rateInfo ? rateInfo.date : null,
    retraits: retraitsDisplay,
    especes: especes,
    lots: lots,
    retraits_sans_pen: retraitsSansPen,
    retraits_dupliques_ignores: 0,
    montant_pen_standard: 700,
    alerte: alerte,
    note: 'Retraits DAB / Western Union (journal) et paiements espèces au Pérou (Detail_PM terrain). ' +
      'Priorité : amount_pen ou notes pen_recu=700 sur chaque retrait ; sinon conversion EUR au taux du jour de l\'écriture. ' +
      'Lots FIFO : chaque retrait = lot ; dépenses espèces consommées du plus ancien au plus récent. ' +
      'Ouverture : onglet Cloture → caisse_pen_ouverture.'
  };
}
