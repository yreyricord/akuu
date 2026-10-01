# Clôturer une année depuis le site

Guide court pour le trésorier — sans Mac ni scripts Python.

## Avant de clôturer

1. Tous les relevés bancaires de l'année sont déposés (onglet **Bilan** → alerte relevés).
2. Le rapprochement affiche **écart 0,00 €** ou une explication dans `ecart_explication` (onglet Cloture du journal).
3. Les factures requises sont rattachées (**Compta → Factures**).

## Générer le dossier Cloture

1. **Bilan** → choisir l'année → **Régénérer le dossier Cloture**.
2. Vérifier le message de succès (10 fichiers sur le Drive).
3. Ouvrir `3_Trésorerie/<année>/Cloture/cloture_<année>.json` : `"controle": { "statut": "ok" }`.

## Clôturer l'exercice (admin)

1. **Bilan** → **Statut de l'exercice** → **Reclôturer** (ou **Clôturer** si exercice ouvert).
2. Si l'ouverture de l'année suivante doit changer, confirmer le report du solde.
3. L'exercice repasse en **clos**, le journal est protégé.

## Rouvrir pour corriger

1. Admin → **Rouvrir l'exercice** (motif obligatoire, 10 caractères min.).
2. Corriger le journal Google.
3. **Régénérer le dossier Cloture**, puis **Reclôturer**.

## Nouvelle année (1er janvier)

Le trigger `setupNewYearScheduled` crée automatiquement :

- dossiers Drive `Factures/` et `Documents/` ;
- Google Sheet `Journal_AKUU_<année>` avec onglets Journal, Detail_PM, Releves, Cloture (`statut` = ouvert), Historique ;
- compteurs de références.

Test manuel : exécuter `setupNewYear(2027)` dans Apps Script.

## Déploiement Apps Script

Après chaque modification de fichier `.gs` :

**Déployer → Gérer les déploiements → ✏️ → Nouvelle version**
