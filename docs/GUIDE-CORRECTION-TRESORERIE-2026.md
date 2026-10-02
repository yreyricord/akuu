# Guide de correction — Trésorerie 2026

> **Mode d'emploi** : exécute **une seule étape**, note le résultat, reviens dans le chat avec ce que tu observes. On valide avant de passer à la suivante.

**Dernière mise à jour** : 2026-10-02 · Agent Cursor

---

## État d'avancement

| Étape | Statut | Ton retour |
|-------|--------|------------|
| 0 — Contexte lu | ⬜ | |
| 1 — Onglet Releves (Google Sheet) | 🔄 | Export live = Excel fourni ; onglet Releves absent de l'export |
| 1B — Retour utilisateur | ✅ | Journal sept. **12 lignes** · PDF fin **30/09/2026 · 1 205,49 €** |
| 1.5 — Supprimer provisoires + re-import | ⬜ | `remplacerSeptembreProvisoire2026` |
| 2 — Re-audit journal | ⬜ | |
| 3 — Déploiement frontend | ⬜ | |
| 4 — Test relevé septembre | ⬜ | |
| 5 — Vérification Bilan | ⬜ | |
| 6 — Nettoyage doublons (optionnel) | ⬜ | |
| 7 — Clôture / prochaines actions | ⬜ | |

Légende : ⬜ à faire · 🔄 en cours · ✅ OK · ❌ bloqué

---

## Ce qu'on corrige (rappel)

1. **Messages trompeurs** — « Banque 2 809 € » = journal calculé, pas le compte bancaire.
2. **Rapprochement vide** — onglet `Releves` du Google Sheet doit être rempli + cache API rafraîchi.
3. **Import relevé silencieux** — erreurs maintenant visibles sous le bouton (après déploiement).
4. **Doublons banque** — 15 paires dans le journal (imports en double).
5. **Écritures** — septembre = surtout terrain (Pérou) ; banque = onglet `Journal` uniquement.

---

## Étape 0 — Lire (2 min)

Rien à exécuter. Vérifie que tu as accès à :

- [ ] Éditeur **Apps Script** (compte `akuu.asso@gmail.com`)
- [ ] Google Sheet **[Journal_AKUU_2026](https://docs.google.com/spreadsheets/d/1l82ar_jkQggglpxozLcmkkzIOHi4UMvqjRJNyhYQAeU/edit)**
- [ ] Site admin **https://www.akuu.org/admin** (trésorier connecté)

**→ Dis-moi « OK étape 0 » quand c'est bon.**

---

## Analyse de ton Excel (2026-10-02)

Fichier : `Journal_AKUU_2026 (1).xlsx`

| Onglet | Contenu septembre |
|--------|-------------------|
| **Journal** (banque) | **8 lignes**, toutes datées **2026-09-01** uniquement (0067→0074) |
| **Detail_PM** (terrain) | 16 lignes sept. (achats Pérou — normal) |
| **Releves** | ❌ absent de l'export Excel |

**Conclusion** : les 8 lignes banque de septembre ne viennent **pas** du parseur PDF — ce sont des **dates provisoires** (toutes au **01/09**) saisies en CSV le 30/09. L'import relevé les a **ignorées comme doublons** au lieu de les remplacer par les vraies dates.

---

## Étape 1.5 — Supprimer les dates provisoires (OBLIGATOIRE avant re-import)

1. Apps Script → copie `Diagnostic.gs` à jour depuis le Mac
2. Exécute **`remplacerSeptembreProvisoire2026`**
3. Journal d'exécution : `8 supprimée(s)` attendu (refs 0067→0074)

Puis **re-dépose le relevé PDF septembre** sur le site (étape 4).

---

## Étape 1 — Remplir l'onglet Releves (Google Sheet)

### 1a. Ouvrir le journal 2026

1. Ouvre [Journal_AKUU_2026](https://docs.google.com/spreadsheets/d/1l82ar_jkQggglpxozLcmkkzIOHi4UMvqjRJNyhYQAeU/edit)
2. Regarde s'il existe un onglet **`Releves`**

### 1b. Si l'onglet Releves est vide ou incomplet

1. Apps Script → projet Trésorerie AKUU
2. Vérifie que `Releves.gs` est à jour (copie depuis le Mac si besoin)
3. Menu déroulant fonctions → **`initRelevesDejaImportes2026`**
4. ▶ Exécuter
5. Journal d'exécution : tu dois voir `8 relevé(s) 2026 inscrit(s)` (ou `0` si déjà faits)

### 1c. Contrôle manuel

Dans l'onglet **Releves**, tu dois voir **au moins** :

| mois | solde_fin (approx.) |
|------|---------------------|
| 2026-01 | 971,65 € |
| … | … |
| 2026-08 | 1 341,17 € |
| 2026-09 | *(solde fin sept. de ton PDF)* |

### 1d. Ce qu'on attend de toi

Copie-colle ou décris :

- Nombre de **lignes** dans l'onglet Releves (hors en-tête)
- La **dernière ligne** (mois + solde_fin)
- Si septembre **2026-09** est présent ou non

**→ Attends ma validation avant l'étape 2.**

### Retour étape 1B (2026-10-02)

| Donnée | Valeur |
|--------|--------|
| Source | Export live Google Sheet (Excel) |
| Journal banque sept. | **12 lignes** (était 8 au 01/09 seul — à vérifier : dates étalées ou toujours 01/09 ?) |
| PDF septembre | Fin **30/09/2026** · solde **+1 205,49 €** |
| Onglet Releves dans export | **Absent** (normal : export site ≠ onglet Releves) |

**Solde août (dernier relevé)** : 1 341,17 € → **solde sept.** : 1 205,49 € = variation **−135,68 €** (cohérent).

---

## Étape 2 — Re-audit du journal

1. Apps Script → assure-toi que `Diagnostic.gs` contient `auditJournal2026` (copie depuis le Mac)
2. Exécute **`auditJournal2026`**
3. Affichage → Journaux

### Ce qu'on attend

- **Relevés bancaires** : plus « Aucun relevé » (si étape 1 OK)
- **Journal** : ~74 lignes (peut varier)
- **Doublons contenu** : ~15 paires (normal pour l'instant)

**→ Colle le journal d'exécution (ou les 10 dernières lignes + section Relevés).**

---

## Étape 3 — Déployer le correctif frontend

> **Qui** : toi me demandes « déploie », ou je commit + push Netlify.

Changements prévus :

- Libellés « Banque relevé » vs « journal calculé »
- Erreurs relevé visibles sous le bouton
- Refresh cache après import
- Écritures = source unique Google Sheet

### Après déploiement

1. **Ctrl+Shift+R** sur https://www.akuu.org/admin
2. Bilan → exercice **2026**

**→ Dis-moi si le déploiement est fait et ce que tu vois en en-tête Bilan (Banque + rapprochement).**

---

## Étape 4 — Relevé de septembre (si pas déjà bon)

1. Bilan → 2026 → bloc **Relevés bancaires**
2. Mois : **Septembre 2026**
3. Choisis le PDF du Crédit Coop
4. Vérifie le bandeau vert « le calcul tombe juste »
5. Si lignes **grisées** → normal (déjà au journal) → clique **« Enregistrer le relevé (PDF uniquement) »**
6. Si lignes **non grisées** → corrige catégories → **« Ajouter X opération(s) »**
7. Message **vert** ou **rouge** sous le bouton ?

**→ Dis-moi : message affiché, combien d'opérations ajoutées / ignorées.**

---

## Étape 5 — Vérification Bilan + Écritures

### Bilan 2026

- [ ] **Banque (dernier relevé)** ≈ solde fin sept. (pas 2 809 €)
- [ ] Sous-texte mentionne « journal calculé » à part
- [ ] **Rapprochement** : tableau avec solde début + recettes − dépenses
- [ ] Pastilles janv…sept toutes ✓

### Compta → Écritures → 2026

- [ ] Filtre mois **09** → lignes **Banque** (origine bleue) = opérations compte Crédit Coop
- [ ] Lignes **Terrain** = achats Pérou (soles) — normal, autre onglet

**→ Copie les 4 KPI du Bilan + nombre d'écritures Banque en septembre.**

---

## Étape 6 — Nettoyage des 15 doublons (optionnel, recommandé)

Chaque paire = **même opération importée deux fois** (refs consécutives, ex. 0004 + 0005).

### Option A — Via le site (prudent)

Compta → Écritures → supprimer la **2ᵉ** ref de chaque paire, motif : `doublon import relevé`.

### Option B — Script GAS (à demander)

Je peux ajouter `dedupeJournal2026()` qui liste et supprime les secondes refs.

**→ Dis-moi si tu veux A, B, ou reporter.**

---

## Étape 7 — Clôture

- [ ] Rapprochement septembre OK (écart 0 € ou expliqué)
- [ ] Doublons traités ou planifiés
- [ ] Apps Script : **Déployer → Nouvelle version** si tu as modifié des `.gs`

---

## Où j'en suis (agent)

| Fichier | Statut local |
|---------|----------------|
| `AdminReleveImport.vue` | ✅ erreurs visibles + PDF seul |
| `AdminBilanHub.vue` | ✅ libellés banque + cache |
| `AdminComptaEcritures.vue` | ✅ source unique journal |
| `client.js` | ✅ invalidate cache import |
| `Diagnostic.gs` | ✅ `auditJournal2026` |
| **Commit / Netlify** | ⬜ en attente de ton feu vert |
| `dedupeJournal2026()` | ⬜ sur demande |

---

## Prochaine action pour toi

**→ Commence par l'étape 1** et reviens avec :

1. Nombre de lignes onglet **Releves**
2. Dernière ligne (mois + solde)
3. Septembre présent ? oui/non
