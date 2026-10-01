# Passage du journal 2026 dans Google Sheets — mise à jour de l'application

À faire une fois, connecté en **akuu.asso@gmail.com**, dans le tableur de l'application
→ Extensions → Apps Script.

## 1. Remplacer / ajouter les fichiers

Copier le contenu des fichiers de `akuu/docs/admin-tresorerie/apps-script/` :

| Fichier | Action |
|---|---|
| `JournalAnnee.gs` | **nouveau** (+ → Script → nom `JournalAnnee`) |
| `Corrections.gs` | **nouveau** |
| `App.gs`, `Business.gs`, `Config.gs`, `DriveService.gs`, `SheetsRepo.gs`, `Setup.gs`, `ExportHistoriqueDrive.gs` | remplacer tout le contenu |

## 2. Activer le service Drive

Colonne de gauche → **Services (+)** → **Drive API** → Ajouter.

## 3. Créer le journal Google 2026

En haut, choisir la fonction **`initJournalAnneeEnCours`** → Exécuter (autoriser si demandé).
Le journal d'exécution affiche l'adresse du nouveau Google Sheet `Journal_AKUU_2026`
(dans `3_Trésorerie/2026/`). Il contient les 74 lignes banque et les lignes terrain du journal Excel.

## 4. Publier la nouvelle version

Déployer → Gérer les déploiements → crayon → Version : **Nouvelle version** → Déployer.

## 5. (Facultatif) liens des dossiers Factures

Exécuter **`exportHistoriqueDriveIndex`**, télécharger `drive_index.json` → `RELEVES/outils/`.

## Ensuite

- Le journal 2026 se modifie **uniquement** dans le Google Sheet (site, application, ou à la main).
  Le fichier `Journal_AKUU_2026.xlsx` devient une archive au 01/10/2026.
- Au 1er janvier, le Sheet de la nouvelle année est créé automatiquement.

---

# Étape 2 — chiffres 2026 en direct et exports à la demande (01/10/2026)

1. Apps Script : **+ → Script → `ComptaAnnee`**, coller `apps-script/ComptaAnnee.gs`.
2. Remplacer le contenu de **`App.gs`** (3 nouvelles routes : `compta-annee`, `export-journal`, `export-registre`).
3. Déployer → Gérer les déploiements → crayon → **Nouvelle version**.
4. À la première utilisation d'un export, Google peut demander une nouvelle autorisation (accès externe) : accepter.

Résultat : Vue d'ensemble et Bilan 2026 calculés depuis le journal Google ; boutons « Journal » et
« Registre des dépenses » du Bilan 2026 générés au moment du clic.

---

# Étape 3 — relevé bancaire PDF déposé dans le Bilan (01/10/2026)

1. Sur votre Mac, dans le dossier `akuu` : `npm install` (ajoute le lecteur de PDF `pdfjs-dist`).
2. Apps Script : **+ → Script → `Releves`**, coller `apps-script/Releves.gs`.
3. Remplacer le contenu de **`App.gs`** et **`ComptaAnnee.gs`**.
4. Déployer → Gérer les déploiements → crayon → **Nouvelle version**.

Utilisation : Bilan → 2026 → « Déposer le relevé bancaire du mois » → choisir le PDF.
Le site lit le relevé, vérifie que solde début + opérations = solde fin, propose catégorie et projet
pour chaque ligne (modifiables), marque les opérations déjà présentes, puis « Ajouter au journal ».
Le PDF est rangé dans `3_Trésorerie/2026/Documents/Releves_bancaires/2026_MM_RELEVE_PRO_AKUU.pdf`
et le solde du relevé sert au rapprochement affiché dans le Bilan.

---

# Étape 3 bis — rapprochement et relevés des archives (01/10/2026)

1. Remplacer **`Releves.gs`**, **`ComptaAnnee.gs`**, **`App.gs`**.
2. Exécuter une fois **`initRelevesDejaImportes2026`** (inscrit les relevés janvier–août 2026 dans l'onglet Releves).
3. Déployer → **Nouvelle version**.
4. Test : Bilan → 2026 → déposer `2026_08_RELEVE_PRO_AKUU.pdf` → 6 lignes grisées ; encart Rapprochement « ✓ ».

Guides : `RELEVES/outils/GUIDE_TRESORIER_RELEVES.md`, `PROCEDURE_RAPPROCHEMENT.md`.

---

# Sécurité (01/10/2026) — à faire AVANT de mettre le site en ligne

Suivre `RELEVES/outils/CHECKLIST_DURCISSEMENT_PROD.md` (nouveaux fichiers `Security.gs`, `SiteData.gs`,
7 fichiers remplacés, nouvelle version, puis **`rotationSecretEtMotsDePasse`**).
Tests : `node docs/admin-tresorerie/gs-tests/test-securite.cjs` → 55/55.
