# Design — Onglet Caisse Pérou (v2)

**Date** : 2026-10-03  
**Statut** : Spec proposée — en attente validation  
**Source de données** : journal Google Sheets live uniquement (`GET /caisse-perou`, `GET /journal-annee`)

---

## 1. Objectif produit

Permettre au trésorier et aux bénévoles responsables de **voir en un coup d’œil** :

1. Combien il reste en **espèces** au Pérou (soles)
2. **Qui** a retiré combien et **combien il lui reste** (lots FIFO)
3. Quelles dépenses ont consommé quel lot
4. Ce qui manque encore comme saisie (`amount_pen`, modes de paiement)

**Succès** : plus besoin d’Excel « Compte des dépenses » pour le suivi caisse — tout passe par Compta → Caisse Pérou.

---

## 2. État actuel (v1 — déjà codé, non déployé)

- Onglet **Caisse Pérou** câblé dans `AdminComptaHub.vue`
- `AdminCaissePerouPanel.vue` : solde, chips filtres, table lots FIFO, retraits, dépenses terrain
- Backend `CaissePerou.gs` : formule + FIFO + alertes

**Limites v1** :

- Mise en page fonctionnelle mais **sans identité visuelle** dédiée (réutilise tables génériques)
- Pas de lien cliquable retrait → lot → dépenses
- Pas d’édition inline `pen_recu` depuis l’onglet
- Pas de vue « bénévole » (filtre par personne)
- Pas d’intégration avec la checklist déploiement / état de complétude

---

## 3. Direction esthétique (v2)

**Concept** : *« Carnet de caisse terrain »* — chaleureux, lisible sur mobile au Pérou, crédible pour l’AG.

| Dimension | Choix |
|-----------|--------|
| Ton | Organique / mission — ochre + leaf + terracotta (palette AKUU existante) |
| Hiérarchie | **Hero solde** en haut → flux visuel entrées/sorties → détail lots |
| Mémorable | Jauge circulaire « reste en caisse » + timeline des retraits |
| Mobile | Stacks verticaux, tables → cartes sur `< md` |

**Référence interne** : même langage que l’en-tête gradient Compta (`AdminComptaHub`) + cartes chiffres clés de `AdminComptaOverview`.

---

## 4. Architecture UI — 5 zones

```
┌─────────────────────────────────────────────────────────┐
│  HERO · Solde caisse S/. + équivalent EUR + statut       │
│  [Ouverture] [+ Retraits] [− Espèces] = Solde            │
└─────────────────────────────────────────────────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Retraits     │ │ Dépenses     │ │ À compléter  │
│ sans PEN     │ │ caisse mois  │ │ (alertes)    │
└──────────────┘ └──────────────┘ └──────────────┘
┌─────────────────────────────────────────────────────────┐
│  TIMELINE LOTS (FIFO) — cartes expansibles              │
│  Lot IMP-0078 · Yoann · +700 S/. · reste 412 S/.        │
│    └ dépenses rattachées (85, 23, …)                    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  RETRAITS (entrées) · table compacte + saisie PEN       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  DÉPENSES TERRAIN · filtres + reclasser mode paiement    │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Composants à créer / refactorer

| Composant | Rôle |
|-----------|------|
| `AdminCaissePerouPanel.vue` | Orchestrateur — refactor en sous-composants |
| `CaissePerouHero.vue` | Solde + formule dépliante + jauge |
| `CaissePerouAlerts.vue` | Bandeau alertes (`retraits_sans_pen`, lots négatifs, non classés) |
| `CaisseLotTimeline.vue` | Cartes lots FIFO avec expand dépenses |
| `CaisseRetraitTable.vue` | Retraits + inline edit `amount_pen` / notes |
| `CaisseDepensesTable.vue` | Extrait de v1 — mode paiement éditable |

**API additions (Apps Script)** — phase 2 :

| Endpoint / champ | Usage |
|------------------|--------|
| `PATCH journal line` avec `amount_pen`, `notes` | Saisie PEN depuis l’onglet retraits |
| `lot.depenses[]` enrichi | Liste refs PM consommées par lot (déjà partiellement dans FIFO) |
| `benevole` parsed from notes | Filtre par bénévole |

---

## 6. Interactions clés

### 6.1 Saisie PEN sur un retrait (priorité haute)

Depuis la ligne retrait :

- Champ **Soles reçus** (number, step 50, placeholder 700)
- Bouton **Enregistrer** → `updateJournalLine({ reference, year, amount_pen })`  
  *(étendre `Corrections.gs` / `updateJournalLine_` si `amount_pen` pas encore patchable)*

### 6.2 Lien lot ↔ dépenses

Clic sur un lot → scroll / filtre les dépenses terrain consommées (même période FIFO).

### 6.3 Cross-navigation

- Lien « Voir dans Écritures » sur un retrait IMP
- Lien « Ouvrir journal Google » (déjà sur hub Compta)

### 6.4 Refresh live

- Écouter `@journal-updated` depuis Écritures (déjà `caisseRefreshKey` sur hub)
- Badge « Données live » quand `data.live === true`

---

## 7. Backend — compléments nécessaires

### Déjà prêt (`CaissePerou.gs`)

- `buildLotsCaisse_`, `retraitPenEntree_`, `parsePenRecuFromNotes_`
- `montant_pen_standard: 700`, `retraits_sans_pen`, `alerte`

### À ajouter (v2)

1. **`updateJournalLine_`** : autoriser patch `amount_pen` + `notes` sur onglet **Journal** (retraits)
2. **`lots[].depenses_detail[]`** : `{ reference, date, label, amount_pen }` pour l’expand UI
3. **`stats`** : `{ retraits_sans_pen, lots_negatifs, depenses_non_classees, completude_pct }`

### Fix déjà codé (`JournalAnnee.gs`)

- `readPaymentMethod_` : Detail_PM en PEN = espèces par défaut (plus « Carte » sur import catalogue)

---

## 8. Plan d’implémentation (3 phases)

### Phase A — Déploiement v1 (1 session, ~2 h)

**But** : onglet utilisable en production.

- [ ] Redéployer Apps Script (`JournalAnnee.gs`, `CaissePerou.gs`)
- [ ] Push frontend (`AdminComptaHub`, `AdminCaissePerouPanel`)
- [ ] Saisir `caisse_pen_ouverture` + premiers `pen_recu` sur retraits 2026
- [ ] QA : solde, lots, pas d’erreur API

### Phase B — Design v2 hero + alertes (1 session, ~3 h)

- [ ] Extraire `CaissePerouHero` + `CaissePerouAlerts`
- [ ] Jauge solde + 3 mini-KPIs
- [ ] Bandeau « X retraits sans PEN » avec CTA scroll vers table retraits
- [ ] Responsive mobile (cartes lots)

### Phase C — Saisie PEN inline + détail lots (1 session, ~3 h)

- [ ] API patch `amount_pen` sur Journal
- [ ] Inline edit retraits dans l’onglet
- [ ] Expand lot → dépenses FIFO
- [ ] Filtre bénévole (parse `benevole=` dans notes)

### Phase D — Polish (optionnel)

- [ ] Animation entrée hero (stagger)
- [ ] Export PDF récap caisse pour AG
- [ ] Rappel procédure 700 S/. (collapsible, lien METHODE-CAISSE-PEROU.md)

---

## 9. Hors scope

- Scripts Python locaux / xlsx — **deprecated** pour l’exploitation
- Double comptage carte/banque (documenté dans checklist, pas dans l’UI caisse)
- Multi-devises hors PEN/EUR

---

## 10. Critères d’acceptation v2

- [ ] Trésorier voit le solde caisse en < 3 s après ouverture onglet
- [ ] Chaque retrait sans PEN est visible et corrigeable sans ouvrir Google Sheets
- [ ] Lots FIFO : reste par retrait = somme cohérente avec solde global
- [ ] Design cohérent Compta hub (gradient, serif chiffres, tokens Tailwind AKUU)
- [ ] Utilisable sur téléphone (bénévole au Pérou)

---

## 11. Validation

**Approuver cette spec** pour lancer Phase B/C (design v2).  
**Phase A** peut partir immédiatement (v1 déjà codée).
