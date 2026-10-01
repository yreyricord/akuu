/** Convertit un exercice live (API /exercices) au format attendu par les vues bilan / compta. */
export function mapExerciceToBilanYear(ex, jsonYear = null) {
  const treso = ex.tresorerie || {}
  const provisoire = Boolean(ex.provisoire ?? ex.statut === 'ouvert')
  return {
    year: ex.year,
    live: ex.live,
    sheet_url: ex.sheet_url,
    cloture: {
      provisoire,
      clos: ex.statut === 'clos',
      rouvert: ex.statut === 'rouvert',
      version: ex.version || 1,
      status: ex.statut === 'clos' ? 'pret' : undefined,
      compte_resultat: {
        produits_eur: ex.produits_eur,
        charges_eur: ex.charges_eur,
        resultat_eur: ex.resultat_eur,
        postes: { produits: ex.produits_postes, charges: ex.charges_postes }
      },
      tresorerie: {
        debut_eur: treso.solde_ouverture_eur,
        fin_eur: treso.solde_calcule_eur,
        releve_fin_eur: treso.solde_releve_eur,
        ecart_rapprochement_eur: treso.ecart_rapprochement_eur ?? 0,
        explication_ecart: ex.cloture_meta?.ecart_explication || ''
      },
      rouvert_le: ex.cloture_meta?.rouvert_le || '',
      rouvert_par: ex.cloture_meta?.rouvert_par || '',
      rouvert_motif: ex.cloture_meta?.rouvert_motif || ''
    },
    releves_status: ex.releves_status,
    downloads: jsonYear?.downloads ?? [],
    download_releves: jsonYear?.download_releves,
    download_cloture: jsonYear?.download_cloture ?? {
      label: `Pack clôture AG ${ex.year}`,
      filename: `Pack_Cloture_${ex.year}.zip`,
      path: `${ex.year}/Cloture/Pack_Cloture_${ex.year}.zip`,
      pdf: `${ex.year}/Cloture/06_Synthese_AG.pdf`
    }
  }
}

export function mapExerciceToComptaYear(ex) {
  const treso = ex.tresorerie || {}
  const provisoire = Boolean(ex.provisoire ?? ex.statut === 'ouvert')
  return {
    year: ex.year,
    live: ex.live,
    provisoire,
    produits_eur: ex.produits_eur,
    charges_eur: ex.charges_eur,
    resultat_eur: ex.resultat_eur,
    produits_postes: ex.produits_postes,
    charges_postes: ex.charges_postes,
    recettes_groupes: ex.recettes_groupes,
    loyers_maison_eur: ex.loyers_maison_eur,
    charges_projets: ex.charges_projets,
    terrain_pen: ex.terrain_pen,
    tresorerie: {
      debut_eur: treso.solde_ouverture_eur,
      fin_eur: provisoire ? treso.solde_calcule_eur : (treso.solde_releve_eur ?? treso.solde_calcule_eur),
      ecart_eur: treso.ecart_rapprochement_eur ?? 0,
      statut: treso.statut_rapprochement,
      calcule: provisoire
    }
  }
}
