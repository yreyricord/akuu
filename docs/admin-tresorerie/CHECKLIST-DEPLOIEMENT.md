# Checklist avant déploiement — Trésorerie & Caisse Pérou

> **Source de vérité unique** : journal Google Sheets `Journal_AKUU_<année>` sur le Drive AKUU.  
> Les xlsx locaux (`RELEVES/`) ne sont plus utilisés pour l’exploitation ni la compta du site.

---

## 1. Apps Script — fichiers à recopier et redéployer ✅ (fait le 03/10/2026)

Dans l’éditeur Apps Script du projet trésorerie, mettre à jour puis **Déployer → Nouvelle version** :

| Fichier | Pourquoi |
|---------|----------|
| `JournalAnnee.gs` | Fix « Carte fantôme » sur imports catalogue ; lecture `payment_method` corrigée |
| `CaissePerou.gs` | API caisse : lots FIFO, `amount_pen` / `pen_recu=`, taux historique Frankfurter |
| `App.gs` | Route `GET /caisse-perou` (si pas déjà déployée) |

**Vérification post-déploiement** (connecté trésorier sur le site) :

- [ ] Compta → Écritures : les dépenses terrain importées n’affichent plus « Carte » par défaut
- [ ] Compta → Caisse Pérou : l’onglet charge sans « Route inconnue »
- [ ] Réponse API `caisse-perou?year=2026` contient `lots[]`, `retraits_sans_pen`, `montant_pen_standard`

---

## 2. Frontend — commit & push Netlify ✅ (fait le 03/10/2026 · `1fa7a0c`)

Fichiers poussés sur `main` :

| Fichier | Contenu |
|---------|---------|
| `AdminComptaHub.vue` | Onglet **Caisse Pérou** dans la nav Compta |
| `AdminCaissePerouPanel.vue` | Panneau v1 (solde, lots FIFO, retraits, dépenses) |
| `docs/admin-tresorerie/METHODE-CAISSE-PEROU.md` | Méthode officielle caisse |

**Après push** :

- [ ] Compta → onglet **Caisse Pérou** visible
- [ ] Modifier un mode de paiement dans Caisse → reflété dans Écritures après refresh

---

## 3. Données journal Google — saisies trésorier

À faire **directement dans le Google Sheet** (ou via Compta → Écritures / Caisse Pérou) :

### Caisse Pérou

- [ ] Renseigner `caisse_pen_ouverture` dans l’onglet **Cloture** du journal 2026 (espèces au 1/1)
- [ ] Sur **chaque retrait DAB/WU** (onglet Journal) : saisir `amount_pen` = soles reçus (cible **700 S/.**) ou `notes` = `pen_recu=700;benevole=Prénom`
- [ ] Vérifier les **doublons** de lignes retrait (même date, même libellé CB)
- [ ] Synchroniser les **modes de paiement** Detail_PM depuis le Compte des dépenses (espèces / avance — pas carte pour le cash terrain)

### Carte = Banque

- [ ] Dépenses payées **carte AKUU** : ligne **Journal** (IMP) = charge EUR ; Detail_PM = « Facture cataloguée » si justificatif terrain
- [ ] Rattacher les PDF via **Compta → Factures → À une écriture existante** sur la ligne **IMP**, pas PM

---

## 4. Contrôles métier avant clôture 2026

- [ ] Solde caisse Caisse Pérou cohérent avec l’espèce estimée en poche au Pérou
- [ ] Aucun lot FIFO en négatif (alerte rouge dans l’onglet)
- [ ] `retraits_sans_pen` = 0 (tous les retraits ont un PEN enregistré)
- [ ] Rapprochement bancaire Bilan : écart ≤ 1 € ou explication dans Cloture

---

## 5. Ordre recommandé le jour J

```
1. Apps Script : JournalAnnee.gs + CaissePerou.gs → Nouvelle version
2. Tester API caisse-perou + Écritures (carte fantôme)
3. Git push frontend (onglet Caisse Pérou)
4. Saisies données : ouverture caisse + pen_recu sur retraits 2026
5. Contrôle visuel Compta → Caisse Pérou
```

---

## Historique des correctifs en attente

| Date | Sujet | Statut |
|------|-------|--------|
| 2026-10-03 | Fix `readPaymentMethod_` — imports catalogue ≠ carte | **Apps Script déployé** ✅ |
| 2026-10-03 | API caisse lots FIFO (`CaissePerou.gs`) | **Apps Script déployé** ✅ · frontend poussé ✅ |
| 2026-10-03 | Avances hors total caisse + saisie PEN retraits | Frontend poussé ✅ (`fe700cb`) · **redéployer Apps Script** : `JournalAnnee.gs`, `Corrections.gs`, `CaissePerou.gs` |
| 2026-10-03 | Design v2 Caisse Pérou (spec) | Voir `docs/superpowers/specs/2026-10-03-caisse-perou-design.md` |
| 2026-10-04 | File tâches background (Écritures, validations, relevés…) | Frontend `18a8057`+ · **Apps Script** : redéployer `JournalAnnee.gs` (fix `driveInfo` → erreur interne à l’ajout écriture+PDF) |
