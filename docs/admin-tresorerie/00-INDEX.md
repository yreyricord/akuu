# Espace admin trésorerie AKUU — Dossier de cadrage

**Statut :** Phase A OK · Phase B code prêt (`apps-script/`) · déploiement Google en cours  
**Repo :** `/Users/yreyricord/akuu/akuu`

---

## Fichiers

| Fichier | Contenu |
|---------|---------|
| [`PROMPT-CLAUDE.md`](./PROMPT-CLAUDE.md) | **Prompt maître · VALIDÉ · prêt à exécuter** |
| [`04-reponses-fondateur-validees.md`](./04-reponses-fondateur-validees.md) | Vos 20 réponses · spec figée |
| [`03-spec-api.md`](./03-spec-api.md) | API Apps Script · Sheets · workflow · Drive |
| [`GUIDE-TRESORIER.md`](./GUIDE-TRESORIER.md) | **Guide déploiement + usage trésorier** |
| [`apps-script/`](./apps-script/) | **Code Google Apps Script (Phase B)** |
| [`05-plan-comptable-categories.md`](./05-plan-comptable-categories.md) | Catégories SI Amazonie · champs audit |
| [`QUESTIONS-REFINEMENT.md`](./QUESTIONS-REFINEMENT.md) | 20 questions (répondues → voir doc 04) |
| [`01-contexte-existant.md`](./01-contexte-existant.md) | État actuel du site et des comptes AG |
| [`02-architecture-cible.md`](./02-architecture-cible.md) | Options techniques Drive + Excel + auth |

---

## Workflow recommandé

1. **Vous répondez** aux 20 questions (`QUESTIONS-REFINEMENT.md`)
2. **On complète** le prompt maître avec vos réponses
3. **Claude implémente** en 2 phases :
   - Phase A : spec + auth + UI (sans Google)
   - Phase B : intégration Google Drive + Google Sheets
4. **Test** avec le trésorier sur 2–3 factures réelles

---

## Point important

Le site actuel est un **frontend Vue statique (Vite SSG)** sans backend ni login.  
Une page admin avec upload Drive + Excel **nécessite un backend** ou **Google Apps Script**. Voir `02-architecture-cible.md`.
