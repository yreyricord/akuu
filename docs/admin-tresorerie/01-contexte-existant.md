# Contexte existant — Site AKUU

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | Vue 3 + Vite SSG + Tailwind + Pinia + vue-i18n |
| Hébergement | Site statique (pas de serveur Node en prod) |
| Données comptes AG | `src/data/finances-ag.json` (export consolidé) |
| Page comptes | `/comptes-ag` → `ComptesAgView.vue` (adhérents, noIndex) |
| Auth | **Aucune** aujourd'hui |
| Backend API | **Aucun** |

## Comptabilité existante

- Workbook source référencé : `Synthese_financiere_AKUU_2017_2026.xlsx` (hors repo git)
- Pipeline consolidation → `finances-ag.json`
- Catégories déjà utilisées dans les bilans :
  - **Projets :** Musée, Maison communautaire, AKUUVision, Cours d'anglais, Hydrama, Low Tech, Gestion déchets, Divers…
  - **Frais :** Frais de fonctionnement, logistique, site web, banque…
- Trésorerie : compte Crédit Coopératif (€) · dépenses Pérou parfois en **soles (PEN)**

## Ce qui n'existe pas encore

- Espace `/admin` ou login
- Rôles utilisateur (bénévole, trésorier, admin)
- Upload de factures
- Workflow demande → validation → écriture comptable
- Lien live Google Drive / Google Sheets

## Contraintes probables

- Association loi 1901 · comptabilité associative française
- Trésoriers co-trésoriers (cf. i18n équipe)
- Bénévoles en mission au Pérou (mobile, photo facture)
- Données sensibles · accès restreint adhérents / bureau
