# Méthode caisse espèces Pérou — solde et suivi par retrait

## Problème

Deux flux distincts alimentent la caisse au Pérou :

| Flux | Onglet | Devise | Exemple |
|------|--------|--------|---------|
| **Entrées** | `Journal` (banque) | EUR débité en France | DAB `−186,32 €`, Western Union `−155 €` |
| **Sorties** | `Detail_PM` (terrain) | PEN dépensés sur place | Ticket `−85 S/`, `−700 S/` |

Le solde caisse **n’est pas** le solde bancaire AKUU. C’est l’espèce physique (plus Yape/Plin comptés comme caisse) encore disponible au Pérou après les dépenses.

## Formule officielle

```
Solde caisse (S/.) = Ouverture + Σ entrées PEN − Σ sorties caisse
```

- **Ouverture** : clé `caisse_pen_ouverture` (onglet Cloture du journal annuel).
- **Entrées** : retraits DAB / Western Union du journal banque, **en soles reçus** (pas seulement en euros).
- **Sorties** : lignes `Detail_PM` avec `payment_method` = `especes` ou `yape_plin`.
- **Hors caisse** : `avance`, `cb`, `virement` — ne passent pas par la caisse espèces.

## Règle d’or : enregistrer les soles reçus au retrait

Le relevé bancaire ne connaît que l’**euro débité**. Le distributeur remet un montant **rond en soles** (souvent **700 S/.**).

| Champ | Où | Contenu |
|-------|-----|---------|
| `amount_eur` | Journal | Montant relevé bancaire (automatique) |
| `amount_pen` | Journal | **Soles réellement reçus** (à saisir par le trésorier) |
| `notes` | Journal | `pen_recu=700; benevole=Prénom` si `amount_pen` vide |

Sans `amount_pen` ni `pen_recu=…`, le système **estime** les soles au taux du jour de l’écriture (indicatif, pas la compta officielle).

## Méthode « lots de retrait » (suivi bénévole)

Chaque retrait crée un **lot** :

```
Lot = { date, ref banque, EUR débité, PEN reçu, dépenses rattachées, reste }
```

**Allocation FIFO** : les dépenses espèces (`Detail_PM`) consomment les lots du **plus ancien** au plus récent.

Exemple :

| Lot | Date | PEN reçu | Dépenses | Reste |
|-----|------|----------|----------|-------|
| Ouverture | 01/01 | 120 | — | 120 |
| IMP-2026-0078 | 28/09 | 700 | 85 + 23 + … | ? |
| **Total caisse** | | | | **solde** |

API : `GET /caisse-perou?year=2026` renvoie `lots[]` avec cette ventilation.

## Standard opérationnel recommandé

1. **Montant cible** : retirer **700 S/.** (ou 500 / 1 000 si besoin exceptionnel — toujours un montant rond).
2. **Au distributeur** : noter sur le reçu ou WhatsApp trésorier : date, montant PEN reçu, frais ATM visibles.
3. **Saisie trésorier** (dans les 48 h) :
   - Remplir `amount_pen` sur la ligne Journal du retrait, **ou**
   - Ajouter dans `notes` : `pen_recu=700; benevole=Yoann`
4. **Dépenses terrain** : chaque ticket en `Detail_PM`, mode **Espèces (caisse Pérou)** si payé en cash de ce lot.
5. **Contrôle mensuel** : onglet Compta → **Caisse Pérou** — vérifier que chaque lot a un reste cohérent et qu’aucune ligne n’est « non classée ».

## Taux de change et frais

| Élément | Traitement |
|---------|------------|
| Débit EUR banque | Comptabilisé au journal banque (dépense AKUU) |
| PEN reçus au DAB | Entrée caisse (`amount_pen` ou `pen_recu`) |
| Écart EUR↔PEN | Normal (taux banque + commission DAB) — **ne pas** forcer 700 en convertissant l’EUR |
| Affichage site « ≈ 723 S/ » | Conversion **indicative** au taux ECB du jour de l’écriture |

## Vérification des retraits 2026

**Sur le site** (après déploiement Apps Script + frontend) :

1. Compta → **Caisse Pérou** → année 2026
2. Vérifier la section **Retraits** : colonne « Source PEN » = `amount_pen` ou `notes`, pas `(estimé)` partout
3. Section **Lots FIFO** : aucun lot en rouge (reste négatif)

**API** (trésorier connecté) : `GET /caisse-perou?year=2026` → inspecter `retraits_sans_pen`, `lots[]`.

Le script liste :

- tous les retraits DAB / WU (EUR) ;
- les `amount_pen` / `pen_recu` enregistrés ;
- la distribution des montants PEN (700, 500, …) ;
- les lots FIFO et le solde caisse recalculé.

## Limites connues

- Pas de lien automatique retrait ↔ ticket (FIFO chronologique seulement).
- Yape/Plin comptés comme sortie caisse même si l’argent ne sort pas du même billet.
- Ouverture annuelle non reportée automatiquement (saisie manuelle `caisse_pen_ouverture`).
- UI « Caisse Pérou » dans Compta — nécessite `CaissePerou.gs` déployé sur Apps Script.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `apps-script/CaissePerou.gs` | Calcul solde + lots |
| `src/components/admin/AdminCaissePerouPanel.vue` | Interface trésorier |
| `RELEVES/outils/analyser_lots_caisse.py` | Audit offline |
