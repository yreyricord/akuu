/**
 * Chiffres et exports de l'année en cours, calculés en direct depuis le journal Google.
 * Mêmes règles que les clôtures Python (RELEVES/outils/cloture_mapping.py, exporter_compta_site.py).
 */

var RECETTE_POSTES_ = {
  'dons directs': 'P1', 'helloasso - dons et campagnes': 'P1', 'helloasso': 'P1', 'dons': 'P1',
  'subventions et prix': 'P2', 'subventions': 'P2',
  'adhesions': 'P3', 'adhesions directes': 'P3', 'adhesions via helloasso': 'P3', 'cotisations': 'P3',
  'loyers et logement': 'P4', 'loyers directs': 'P4', 'loyers via helloasso': 'P4',
  'ventes et prestations': 'P5',
  'autres produits': 'P6', 'remboursements / annulations': 'P6', 'prets / avances': 'P6', 'recette a qualifier': 'P6'
};
var RECETTE_GROUPES_ = { P1: 'Dons', P2: 'Subventions et prix', P3: 'Cotisations', P5: 'Ventes et prestations', P6: 'Autres recettes' };
var BANK_FEES_ = ['frais bancaires', 'frais bancaires et change'];
var NON_MISSION_ = ['FONCTIONNEMENT', 'DIVERS', 'AUTRE_PONCTUEL', 'AUTRE_A_CONFIRMER', ''];

function normTxt_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function getComptaAnnee_(session, year) {
  var ex = getExercice_(session, year);
  if (!ex.live) return { year: Number(year) || new Date().getFullYear(), live: false };
  return {
    year: ex.year, live: true, provisoire: ex.provisoire, updated_at: ex.updated_at, sheet_url: ex.sheet_url,
    produits_eur: ex.produits_eur, charges_eur: ex.charges_eur, resultat_eur: ex.resultat_eur,
    produits_postes: ex.produits_postes, charges_postes: ex.charges_postes,
    recettes_groupes: ex.recettes_groupes, loyers_maison_eur: ex.loyers_maison_eur,
    charges_projets: ex.charges_projets, terrain_pen: ex.terrain_pen,
    dernier_releve: ex.dernier_releve, releves: ex.releves, rapprochement: ex.rapprochement
  };
}

/** Export Excel du journal (onglets Journal + Detail_PM), toujours à jour. */
function exportJournalXlsx_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  var ss = openYearJournal_(year);
  if (!ss) throw apiError_('NOT_FOUND', 'Pas de journal Google pour ' + year, 404);
  return { file_name: 'Journal_AKUU_' + year + '.xlsx', base64: xlsxOf_(ss.getId()) };
}

/** Registre des dépenses (banque + terrain) de l'année, généré à la demande. */
function exportRegistreXlsx_(session, year) {
  requireTreasurer_(session);
  year = Number(year) || new Date().getFullYear();
  var data = getJournalAnnee_(session, year);
  if (!data.live) throw apiError_('NOT_FOUND', 'Pas de journal Google pour ' + year, 404);
  var tmp = SpreadsheetApp.create('Registre_Depenses_' + year + '_tmp');
  try {
    var sh = tmp.getSheets()[0];
    sh.setName('Registre');
    var head = ['Date', 'Référence', 'Origine', 'Projet', 'Catégorie', 'Libellé', 'Fournisseur', 'Montant EUR', 'Montant PEN', 'Facture'];
    var out = [head];
    data.rows.filter(function (r) { return r.type === 'depense'; }).reverse().forEach(function (r) {
      out.push([r.date, r.ref, r.source === 'banque' ? 'Banque' : 'Terrain', r.project, r.category, r.label, r.vendor,
        r.eur === null ? '' : r.eur, r.pen === null ? '' : r.pen, r.url]);
    });
    sh.getRange(1, 1, out.length, head.length).setValues(out);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    SpreadsheetApp.flush();
    return { file_name: 'Registre_Depenses_' + year + '.xlsx', base64: xlsxOf_(tmp.getId()) };
  } finally {
    DriveApp.getFileById(tmp.getId()).setTrashed(true);
  }
}

function xlsxOf_(id) {
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';
  var res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  return Utilities.base64Encode(res.getBlob().getBytes());
}
