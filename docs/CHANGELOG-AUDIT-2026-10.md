# Changelog — audit design mobile & uploads — oct. 2026

Branche `audit/design-mobile-uploads-2026-10` (base `main@2fbb4ed`).
Rapport : `docs/RAPPORT-AUDIT-DESIGN-MOBILE-2026-10.md` · Spec : `docs/SPEC-UPLOAD-BACKGROUND-2026-10.md`.

## Uploads

| Commit | Changement | Effet mesuré |
|--------|------------|--------------|
| `perf(upload)` compresser et redresser les photos | Photos ≤ 2200 px, JPEG 0,82, orientation EXIF appliquée, fond blanc pour les PNG ; avertissement au-delà de 4 Mo ; tailles en Mo | Photo 2,5 Mo → PDF 280 Ko (−89 %) ; JSON envoyé 3,3 Mo → 0,37 Mo ; conversion PNG 3,3 s → 0,5 s (CPU ×4) |
| `feat(upload)` file d'envoi non bloquante | `store/uploadQueue.js`, `AdminUploadTray.vue`, `onProgress` + `signal` dans l'API, annulation, réessai, ETA, toasts, `beforeunload` ; démo : réseau simulé + journal de l'année courante | Barre visible en 0,4 s ; navigation libre pendant l'envoi |
| `fix(upload)` factures compta et lot bénévole en arrière-plan | `AdminComptaFactures.send` et `AdminFactureForm.onSubmit` passent par la file ; `submitFacturesBatch(…, { background })` ne touche plus `store.loading` ; erreur partielle détaillée et réessai partiel | Les boutons de validation trésorier ne sont plus gelés par un envoi bénévole |

## Mobile / design

| Commit | Changement |
|--------|------------|
| `fix(mobile)` état désactivé lisible | `.btn-primary:disabled` gris, sans ombre ni animation |
| `fix(mobile)` footer | Champ newsletter 16 px / 44 px sous 640 px (fin du zoom iOS) + `aria-label` ; liens et e-mail 44 px de haut sur mobile |
| `fix(mobile)` Compta 320 px | Onglets en défilement horizontal, sans retour à la ligne, 44 px ; filtres 44 px ; « Cumul » abrégé |
| `fix(mobile)` contact / connexion / « Plus » | Icônes réseaux 40 → 44 px ; « Mot de passe oublié ? » 44 px ; feuille « Plus » : focus à l'ouverture + Échap |

## Démo / QA

| Commit | Changement |
|--------|------------|
| `fix(mock)` contexte du mock | `mockCall` garde `this` : la file de validation et le lot de factures fonctionnent en démo |

## Indicateurs (Playwright, 22 écrans × 3 viewports)

| Mesure | Avant | Après |
|--------|------:|------:|
| Éléments interactifs < 44 px | 411 | 201 |
| Champs de saisie < 16 px | 30 | 10 (tablette/desktop) |
| Pages avec scroll horizontal | 0 | 0 |
| `npm test` | 20/20 | 20/20 |
| `npm run build` | OK | OK |

## Non traité (backlog sprint 4, voir le rapport)

Demande + devis, dépense directe et relevés encore sur `store.loading` ; timeout adaptatif ; microcopy et contrastes de /soutenir ; textes de 10–11 px du footer ; curseurs range ; Worker HEIC.
