# Réponses fondateur validées — Admin trésorerie

> Septembre 2026 · Spec figée pour implémentation

---

## Q1 · Accès
**Adhérents AKUU** (whitelist email).

## Q2 · Comptes trésorier
**2 comptes** co-trésoriers, mêmes droits (`treasurer`).

## Q3 · Création comptes
**Whitelist email** (liste en config · le plus simple).

## Q4 · Authentification
**Les deux :** email/mot de passe **et** Google Sign-In (compte Google autorisé si dans whitelist).

## Q5 · Flux
**Deux flux distincts :**
1. **Demande de dépense** (avant achat) → validation trésorier
2. **Facture** (après achat) → pièce justificative + comptabilisation

## Q6 · Validation amont (facture)
**Obligatoire.** L’adhérent doit saisir la **référence de la demande** générée lors de l’acceptation par le trésorier (envoyée par **email** à l’acceptation).

Sans référence valide → soumission facture bloquée.

## Q7 · Devises
- Saisie **soles (PEN) uniquement**
- Le site calcule **automatiquement l’EUR** avec le **taux du jour** (API taux · ex. BCE / exchangerate)
- Les deux montants sont écrits dans Google Sheets

## Q8 · Mode de paiement (typologie)
Distinction obligatoire :
| Code | Libellé |
|------|---------|
| `avance_benevole` | Avance personnelle du bénévole → **remboursement** |
| `avance_asso` | Avance de trésorerie asso (espèces/virement asso) |
| `carte_asso` | Paiement direct **carte bancaire association** |

## Q9 · Catégories
**Bonnes pratiques SI / ONG mission Amazonie** (pas seulement l’Excel historique).  
Voir `05-plan-comptable-categories.md`.

## Q10 · Ventilation multi-projets
**Décision v1 : une dépense = un seul projet.**  
(Pas de répartition 50/50 en v1 · voir explication dans le guide fondateur.)

## Q11 · Champs audit
**Bonnes pratiques pro ONG** · voir `05-plan-comptable-categories.md` § Pièces justificatives.

## Q12 · Google Drive racine
Dossier existant : [2026_NEW_Protocol](https://drive.google.com/drive/folders/1hAisydbVLOWUztBxi6XRCeGlrb8vBeSX?usp=drive_link)

**ID dossier :** `1hAisydbVLOWUztBxi6XRCeGlrb8vBeSX`

Liberté d’organisation **à l’intérieur** de ce dossier.

## Q13 · Arborescence Drive (à créer)

```
2026_NEW_Protocol/                    (existant)
├── Factures/                         (upload photos/PDF)
│   └── 2026/
│       └── 2026-09-28_DEM-0042_150PEN.jpg
├── Relevés de compte/                (imports manuels trésorier)
│   └── 2026/
└── Comptes/                          (Google Sheets master)
    └── AKUU_Comptes_Depenses_2026.gsheet
```

## Q14 · Tableur
**Google Sheets** (pas xlsx fixe) · onglets multiples (voir `03-spec-api.md`).

## Q15 · Compte Google technique
**akuu.asso@gmail.com** · Apps Script déployé sous ce compte.

## Q16 · Notifications
**Email** à chaque nouvelle demande / facture en attente (trésoriers).

## Q17 · Relances
**Oui · toutes les 24 h** si statut `awaiting_approval` ou `pending` (Apps Script trigger).

## Q18 · Refus
**Motif obligatoire** · **resoumission** possible (nouvelle version liée à l’historique).

## Q19 · Historique
**OUI** · journal d’audit complet (qui, quand, quoi · versions).

## Q20 · Périmètre v1
**Tout** (MVP complet) :
- Login admin (dual auth)
- Facture + demande
- Dashboard trésorier
- Drive + Sheets
- Historique + resoumission
- Relances 24h
- Export · lien comptes AG (pipeline export JSON si possible)
- Mobile-first

---

## Emails trésoriers [À COMPLÉTER]

```
TRESORIER_1_EMAIL=
TRESORIER_2_EMAIL=
```

## Whitelist adhérents [À COMPLÉTER]

```
# docs/admin-tresorerie/config/whitelist-emails.example.txt
```
