# Rapport audit design mobile & uploads — AKUU — oct. 2026

> Branche `audit/design-mobile-uploads-2026-10` · base `main@2fbb4ed` · prompt : `docs/PROMPT-AUDIT-DESIGN-MOBILE-UPLOADS.md`
> Complète `docs/MOBILE-AUDIT-2026.md` (sprints 1–2) — ce qui y est marqué ✅ a été revérifié à l'écran.

## Synthèse exécutive

1. Le « site figé pendant des minutes » vient surtout du **volume envoyé**, pas du calcul local : chaque photo partait **en pleine résolution** dans un PDF, puis en base64 (+33 %). Une photo iPhone de 2,5 Mo pesait **3,3 Mo** sur le réseau, un lot de 5 factures environ 17 Mo dans **une seule requête**.
2. Pendant l'envoi, `store.loading` (un booléen global) **désactivait toute l'interface**, y compris les boutons de validation du trésorier. Rien n'indiquait la progression, on ne pouvait pas annuler, et changer d'onglet **effaçait le résultat** (risque de doublons).
3. Ce qui est livré : compression et redressement des photos (**−89 %** de données), plus une **file d'envoi non bloquante** avec barre de progression, annulation, réessai et toasts. Elle est branchée sur les 2 flux critiques : rattachement d'une facture en Compta, lot de factures bénévole.
4. Le mode démo plantait sur la file de validation : le parcours trésorier n'était pas testable sans API. C'est corrigé.
5. Côté design mobile, les sprints 1–2 tiennent : **aucun scroll horizontal** sur les 3 viewports et 20 routes. Mais il y a **2 régressions** par rapport au statut « corrigé » (icônes contact en 40 px, microcopy de 8 à 10 px sur /soutenir), et 5 défauts transverses dont 4 corrigés : champ newsletter qui fait zoomer iOS, liens du footer de 20 px, bouton désactivé illisible, onglets Compta cassés à 320 px.
6. Cibles tactiles sous 44 px (mesure automatique, 22 écrans × 3 viewports) : **411 → 201** (−51 %). Champs sous 16 px : **30 → 10** (les 10 restants sont en tablette/desktop).
7. Restent ouverts : 4 flux d'upload encore en `store.loading` (demande + devis, dépense directe, relevé, re-dépôt de devis), aucun timeout global, microcopy de /soutenir. Voir le backlog du sprint 4.

## Score santé (0–10)

| Axe | Avant | Après | Commentaire |
|-----|:----:|:----:|-------------|
| Site public mobile | 7 | 7,5 | Pas d'overflow ; footer corrigé ; /soutenir encore dense et peu contrasté |
| Admin mobile | 6 | 7,5 | Compta 320 px corrigée, CTA désactivé lisible, « Plus » au clavier |
| Uploads | 3 | 7 | Non bloquant + progression sur 2/6 flux ; payload ÷9 sur tous les flux photo |
| Accessibilité | 6 | 6,5 | aria-live sur les envois, label newsletter ; restent texte 10–11 px et contrastes /soutenir |

## Méthode

- **Visuel automatisé** : Playwright (Chromium, UA iPhone, tactile) sur **320×568, 390×844 et 768×1024**, 11 routes publiques et 9 onglets admin (trésorier) + 2 onglets bénévole, en mode démo (`VITE_TRESORERIE_API_URL` vide). Pour chaque écran : scroll horizontal, éléments interactifs de moins de 44 px (liens inline exemptés, WCAG 2.5.8), texte sous 12 px, champs sous 16 px, éléments fixed/sticky. Captures dans `docs/audit-2026-10/`.
- **Upload** : temps de conversion, d'encodage et de sérialisation mesurés dans le navigateur (CPU ×1 et ×4 pour simuler un mobile milieu de gamme), longtasks du thread principal, scénarios UP2, UP4 et U4 rejoués de bout en bout en démo.
- **Limites** : pas d'identifiants trésorier, donc **pas de mesure réelle du POST Apps Script**. Les temps réseau ci-dessous sont calculés à partir des tailles mesurées. Pas d'échantillon HEIC dans le bac à sable (heic2any non chronométré : à mesurer sur iPhone). Pas de linter configuré dans le repo (`npm test` + `npm run build` servent de garde-fou).
- Faux positif écarté : le lien d'évitement `sr-only` (1×1 px) compté sur chaque page.

## Top 10 P0 / P1

| # | Prio | Constat | Statut |
|---|------|---------|--------|
| 1 | P0 | Upload : `store.loading` global fige toute l'UI admin | ✅ 2 flux · ⏳ 4 flux |
| 2 | P0 | Photos envoyées en pleine résolution (3,3 Mo / photo, ~17 Mo / lot de 5) | ✅ |
| 3 | P0 | Compta → Factures : bouton « Envoi… » bloqué pendant l'upload **puis** la relecture du journal | ✅ |
| 4 | P0 | Résultat d'envoi perdu au changement d'onglet → renvoi et doublons | ✅ 2 flux |
| 5 | P0 | Pas d'annulation, pas de timeout (sauf import relevé) : une requête pendante fige le bouton indéfiniment | ✅ annulation 2 flux · ⏳ timeout |
| 6 | P0 | Demande + devis multi-fichiers et dépense directe toujours bloquants | ⏳ sprint 4 |
| 7 | P1 | Photos portrait couchées dans le PDF (orientation EXIF ignorée par pdf-lib) | ✅ |
| 8 | P1 | Mode démo : file de validation en erreur (`this` perdu dans `mockCall`) | ✅ |
| 9 | P1 | `.btn-primary:disabled` sans style : CTA inactif identique à un CTA actif | ✅ |
| 10 | P1 | Champ newsletter 12,5 px → zoom iOS au focus, sur toutes les pages | ✅ |

## Inventaire complet

### Uploads

### [P0] L'envoi fige toute l'interface admin
- **Page / composant** : `src/store/tresorerie.js` (`loading`), consommé par `AdminFactureForm`, `AdminDemandeForm`, `AdminDirectExpenseForm`, `AdminValidationQueue`, `AdminReimbursementPanel` — route `/admin?module=tresorerie`
- **Viewport** : tous
- **Comportement actuel** : un seul booléen `loading` pour tous les appels d'écriture. Pendant l'envoi d'une facture, les boutons Valider / Refuser / Rembourser du trésorier sont désactivés ; aucune progression.
- **Comportement attendu** : un statut par envoi ; le reste de l'interface reste utilisable (U1).
- **Repro** : 1. Bénévole → Facture, joindre 3 photos. 2. Enregistrer. 3. Sur un 2ᵉ onglet trésorier, les boutons de validation sont grisés jusqu'à la fin.
- **Fix** : `useUploadQueue` (Pinia) + `submitFacturesBatch(…, { background: true })`. **Fait** pour le lot bénévole et le rattachement Compta.
- **Effort** : M

### [P0] Photos envoyées en pleine résolution
- **Composant** : `src/utils/receiptFile.js` (`imageFileToPdf`), `src/api/tresorerie/filePayload.js`
- **Comportement actuel** : le JPEG est intégré tel quel au PDF puis encodé en base64. Mesuré : photo 2,5 Mo → PDF 2,5 Mo → **3,3 Mo** de JSON. Capture PNG 8,7 Mo → 11,6 Mo.
- **Attendu** : un justificatif lisible d'environ 300 Ko.
- **Fix** : redimensionnement à 2200 px (côté long) et JPEG 0,82 via canvas avant le PDF. **Fait** : 2,5 Mo → **280 Ko** (−89 %), PNG 8,7 Mo → 1,3 Mo.
- **Effort** : S

### [P0] Compta → Factures : bouton bloqué jusqu'à la relecture du journal
- **Composant** : `AdminComptaFactures.vue` (`send()`) — onglet Compta → Factures
- **Viewport** : 390×844 (et desktop)
- **Actuel** : `sending` reste vrai pendant l'upload **puis** pendant `loadLive(year)` (relecture Apps Script, 10 à 25 s). La liste des candidats passe aussi en chargement (`loadingYear`).
- **Attendu** : le panneau est libéré dès l'envoi lancé, et le journal est relu en silence.
- **Repro** : choisir une dépense, joindre un PDF, cliquer « Envoyer la facture » et chronométrer.
- **Fix** : **Fait**. Envoi via la file, sélection libérée tout de suite, ligne masquée pendant l'envoi (anti-doublon), `loadLive(…, { quiet: true })` après succès.
- **Effort** : S

### [P0] Résultat perdu en changeant d'onglet → doublons
- **Composant** : `AdminTresorerieView.vue` (`setTab` → `store.clearMessages()`), `AdminFactureForm.vue` (état local `postSubmitChoice`)
- **Actuel** : le bandeau de succès ou d'erreur est effacé au changement d'onglet. Le formulaire démonté perd son état. Le bénévole ne sait pas si sa facture est partie, et la renvoie.
- **Attendu** : un toast persistant, indépendant de l'onglet (U5).
- **Fix** : **Fait** avec `AdminUploadTray` (succès 8 s, erreur persistante + Réessayer).
- **Effort** : S

### [P0] Ni annulation ni timeout sur les envois
- **Composant** : `client.js` (`remoteRequest` : `timeoutMs` seulement pour `/releves/import`)
- **Actuel** : sur un réseau qui décroche (fréquent en Amazonie), la requête peut rester pendante plusieurs minutes, avec le bouton figé sur « Envoi… ».
- **Attendu** : un bouton Annuler (U4) et un délai maximal annoncé.
- **Fix** : **Fait** : `signal` d'annulation relayé jusqu'au `fetch`, bouton « Annuler » dans la barre. **À faire** : un timeout adaptatif selon la taille (spec §6).
- **Effort** : S

### [P0] Demande + devis, dépense directe, relevé : toujours bloquants
- **Composants** : `AdminDemandeForm.vue` (`submitDemande`, `resubmitDemandeDevis`), `AdminDirectExpenseForm.vue`, `AdminBilanRelevesAlert.vue` (`uploadReleve`), `AdminReleveImport.vue` (`importReleve`)
- **Actuel** : même schéma `loading` / `sending` bloquant. La compression bénéficie déjà aux devis (même `AdminFileCapture`).
- **Fix** : migrer vers `useUploadQueue` (spec §5, étapes 3 à 5). L'API accepte déjà `onProgress` et `signal` pour `createDemande` et `createDirectExpense`.
- **Effort** : M

### [P1] Photos portrait couchées dans le PDF
- **Composant** : `receiptFile.js`. `pdf-lib.embedJpg` ignore l'orientation EXIF des photos iPhone.
- **Fix** : **Fait**. Le passage par `createImageBitmap(…, { imageOrientation: 'from-image' })` + canvas redresse l'image (vérifié : JPEG orientation 6 → 1650×2200 portrait).
- **Effort** : S

### [P1] Lot de factures : un seul POST avec tous les fichiers
- **Composant** : `client.js` (`createFacturesBatch`) → Apps Script `/factures/batch`
- **Actuel** : N fichiers en base64 dans une requête. Au-delà d'environ 50 Mo (limite Apps Script) ou de 6 min d'exécution, **tout** le lot échoue.
- **Fix** : avec la compression, un lot de 10 photos pèse environ 4 Mo. À terme, découper au-delà de 8 Mo (spec §6). Documenté seulement (hors périmètre : migration Apps Script).
- **Effort** : M

### [P1] Pas d'avertissement sur les fichiers lourds (U7)
- **Composant** : `AdminFileCapture.vue`
- **Fix** : **Fait**. Avertissement au-delà de 4 Mo (surtout les PDF scannés, que la compression ne touche pas) ; tailles affichées en Mo au lieu de « 5000 Ko ».
- **Effort** : S

### [P2] Conversion sur le thread principal (U8)
- **Composant** : `receiptFile.js`, `heic2any`
- **Mesuré** : compression 0,2 à 0,7 s (CPU ×4) ; aucune longtask au-delà de 290 ms. heic2any non mesuré (environ 1,3 Mo de JS chargé à la demande).
- **Fix** : `OffscreenCanvas` dans un Worker si les mesures HEIC sur iPhone dépassent 2 s. Spec seulement.
- **Effort** : L

### [P2] Aucune alerte en fermant l'onglet pendant un envoi
- **Fix** : **Fait** (`beforeunload` tant qu'un envoi est actif).
- **Effort** : S

### Admin trésorerie

### [P1] Mode démo : file de validation en erreur
- **Composant** : `client.js` (`mockCall`) — onglet Validation
- **Viewport** : tous
- **Actuel** : « Cannot read properties of undefined (reading 'getDemandesPending') » ; le lot de factures démo plantait aussi.
- **Repro** : sans `.env.local`, se connecter en `tresorier@demo.akuu.fr` → Validation.
- **Fix** : **Fait** (`fn.apply(mockBackend, args)`). Le mode démo simule aussi un journal de l'année courante (3 dépenses sans facture) pour tester UP4.
- **Effort** : S
- Capture : `audit-2026-10/avant-validation-mock-erreur-390.webp`

### [P1] Onglets Compta cassés à 320 px
- **Composant** : `AdminComptaHub.vue` (nav des vues), `AdminComptaOverview.vue` (segments) — Compta
- **Viewport** : 320×568
- **Actuel** : « Vue d'ensemble » sur 2 lignes qui débordent de la pilule, « Réglages » coupé, segments « Par année / Cumul de la période » sur 3 lignes, hauteur 40 px.
- **Fix** : **Fait** : défilement horizontal, `whitespace-nowrap`, 44 px, « Cumul » abrégé sous 640 px.
- **Effort** : S
- Captures : `avant-compta-onglets-320.webp` / `apres-compta-onglets-320.webp`

### [P1] Bouton principal désactivé identique à l'actif
- **Composant** : `main.css` (`.btn-primary`) — Facture bénévole, Compta → Factures, Demande
- **Viewport** : 390×844
- **Actuel** : « Enregistrer la facture (brouillon) » reste vert vif et se soulève au survol alors qu'aucune demande n'est choisie.
- **Fix** : **Fait** (`:disabled` gris, sans ombre ni animation).
- **Effort** : S
- Captures : `avant-cta-desactive-390.webp` / `apres-cta-desactive-390.webp`

### [P1] Bandeau de succès en haut de page, invisible sur mobile
- **Composant** : `AdminTresorerieView.vue` (`store.successMessage`)
- **Actuel** : on soumet en bas d'un long formulaire et le message s'affiche 1 500 px plus haut, hors écran.
- **Fix** : la barre d'envoi le remplace pour les flux migrés. Pour les autres, migrer vers des toasts (backlog).
- **Effort** : S

### [P2] Feuille « Plus » : pas de focus ni Échap
- **Composant** : `AdminTresorerieView.vue`
- **Fix** : **Fait** : focus sur le 1ᵉʳ onglet à l'ouverture, Échap ferme. Reste à faire : piège de focus complet et blocage du scroll de fond.
- **Effort** : S

### [P2] Barre du bas à 6 entrées sur 320 px (trésorier)
- **Viewport** : 320×568
- **Actuel** : « Demande Facture Validation » quasi collés (53 px par onglet, libellés de 12 px).
- **Fix proposé** : sous 360 px, masquer les libellés secondaires ou passer « Guide » dans « Plus ».
- **Effort** : S

### [P2] Libellés de graphiques Compta en 10 px
- **Composant** : `AdminComptaOverview.vue` (`text-[10px]` : « € », « Année », valeurs)
- **Fix proposé** : 12 px minimum ; valeurs hors barres.
- **Effort** : S

### [P3] Historique à 768 px : 18 textes à 11 px
- **Composant** : `AdminHistoryView.vue` (tableau tablette)
- **Fix proposé** : 12 px minimum sur les métadonnées.
- **Effort** : S

### [P2] Connexion : « Mot de passe oublié ? » de 16 px de haut
- **Composant** : `AdminLoginView.vue`
- **Fix** : **Fait** (zone de 44 px, texte de 14 px).
- **Effort** : S

### Site public

### [P1] Champ newsletter : zoom iOS au focus, sur toutes les pages
- **Composant** : `Footer.vue` (`.newsletter-input` 12,5 px, sans label)
- **Viewport** : 320 et 390
- **Fix** : **Fait** : 16 px et 44 px sous 640 px, `aria-label`.
- **Effort** : S

### [P1] Liens du footer de 20 px de haut
- **Composant** : `Footer.vue` (liens rapides, e-mail) — 7 cibles par page
- **Fix** : **Fait** : 44 px sous 640 px, espacement compensé.
- **Effort** : S

### [P1] Contact : icônes réseaux en 40 px (régression)
- **Composant** : `ContactView.vue`. Marqué « corrigé » dans MOBILE-AUDIT-2026, mesuré à 40×40.
- **Fix** : **Fait** (`w-11 h-11`).
- **Effort** : S

### [P1] /soutenir : microcopy de 8 à 10 px (régression)
- **Composant** : `SoutienView.vue` / composants du hero : « Recommandé » **8 px**, « déductible des impôts », « Chaque don compte », « Dernières contributions » à 10 px. Le sprint 2 annonçait un minimum de 12 px.
- **Fix proposé** : `text-xs` (12 px) minimum, badge « Recommandé » à 11–12 px.
- **Effort** : S

### [P2] /soutenir : contraste faible sur le verre vert
- **Viewport** : 320×568
- **Actuel** : « 47 % », « après déduction fiscale » et la carte « frais de fonctionnement » non sélectionnée sont en blanc ou gris translucide sur fond photo vert (environ 2,5:1 estimé).
- **Fix proposé** : opacité du texte ≥ 0,8 ou voile plus sombre derrière la carte objectif.
- **Effort** : S

### [P2] Footer : textes de 10,5 à 11 px
- **Composant** : `Footer.vue` (`.lang-btn` 10,5 px, copyright, RNA, « Amazonie · France » à 11 px), soit 12 occurrences par page
- **Fix proposé** : 12 px minimum ; boutons de langue à 44 px de haut sur mobile.
- **Effort** : S

### [P2] Curseurs (range) à piste fine
- **Composants** : simulateur de don `/soutenir` (`.colibri-slider`, 6 px), `/musee-shapishiko` (8 px)
- **Fix proposé** : zone tactile de 44 px (padding vertical sur l'input, curseur ≥ 28 px).
- **Effort** : S

### [P2] Contact : lien e-mail de 40 px
- **Composant** : `ContactView.vue` (`a.flex.items-center.gap-3`)
- **Fix proposé** : `min-h-[44px]`.
- **Effort** : S

### [P3] Kickers et légendes à 11 px
- **Composants** : `/musee-shapishiko` (`.pg-head__kicker`), `/volontaires` (légendes témoignages), `/formation` (sur-titre)
- **Fix proposé** : 12 px.
- **Effort** : S

## Upload : diagnostic et chiffres

### Mesures dans le navigateur (Chromium, `docs/audit-2026-10`)

| Fichier | Étape | Avant (CPU ×1 / ×4) | Après (CPU ×1 / ×4) |
|---------|-------|------|------|
| Photo type iPhone 4032×3024, 2,5 Mo | conversion PDF | 23 / 85 ms | 227 / 654 ms |
| | PDF produit | 2 498 Ko | **280 Ko** |
| | encodage base64 | 16 / 73 ms | 2 / 8 ms |
| | JSON envoyé | **3 331 Ko** | **373 Ko** |
| Capture PNG 1170×2532, 8,7 Mo | conversion | 749 / 3 312 ms | 139 / 465 ms |
| | JSON envoyé | 11 577 Ko | 1 675 Ko |
| Longtask max (thread principal) | | 89–287 ms | 0 ms mesuré |

La conversion prend environ 0,5 s de plus, mais le volume est divisé par 9. Le goulot était le réseau.

### Temps d'envoi calculés (débit montant ; Apps Script non mesuré, environ 4 à 12 s en plus)

| Scénario | Volume avant | 1 Mbit/s (4G Loreto) | 3 Mbit/s | Volume après | 1 Mbit/s | 3 Mbit/s |
|----------|------|------|------|------|------|------|
| UP1 / UP4 : 1 photo | 3,3 Mo | 27 s | 9 s | 0,37 Mo | **3 s** | 1 s |
| UP2 : lot de 3 photos | 10 Mo | 80 s | 27 s | 1,1 Mo | **9 s** | 3 s |
| Lot de 5 photos | 16,7 Mo | 2 min 13 | 44 s | 1,9 Mo | **15 s** | 5 s |
| UP5 : relevé PDF 2 Mo | 2,7 Mo | 21 s | 7 s | inchangé (PDF) | 21 s | 7 s |

### Scénarios rejoués en démo (390×844)

| ID | Résultat après correctifs |
|----|---------------------------|
| UP4 | Barre visible à t = 0,4 s ; navigation vers Validation **pendant** l'envoi ; succès à 2,7 s avec « Ouvrir sur le Drive » et nom du fichier |
| UP2 | Lot de 3 JPG : phases Encodage → Envoi, ETA affichée, navigation vers Guide pendant l'envoi ; succès à 5,2 s avec les 3 références |
| U4 | « Annuler » pendant l'envoi → message prudent (le serveur a pu recevoir le fichier) + Réessayer |
| UP1 | Le HEIC passe par heic2any puis la même compression : **non mesuré** (pas d'échantillon HEIC ici). À chronométrer sur iPhone |
| UP3, UP5 | Hors file d'envoi pour l'instant (backlog sprint 4) ; UP3 profite de la compression |

### Wireframe : comportement livré

```
┌──────────────────────────────────────────┐
│ [onglet courant — reste navigable]       │
│                                          │
├──────────────────────────────────────────┤
│ ⤒ Envoi en cours                     ˅   │  ← réductible (affiche alors le %)
│ ◌ 3 factures · AKUU-DEM-2026-0001        │
│   Envoi au serveur · 4 s · ≈ 12 s rest.  │
│   ███████████░░░░░░░░                    │
│   Vous pouvez continuer à utiliser…      │
│   [ Annuler ]                            │
├──────────────────────────────────────────┤
│ Modules  Guide  Demande  Facture  Plus   │  ← nav admin (z 40), barre au-dessus (z 45)
└──────────────────────────────────────────┘
        ↓ succès (8 s)                ↓ échec (persistant)
 ✓ 3 factures enregistrées…      ✗ Connexion impossible…
 [Copier la réf.] [Fermer]       [Réessayer] [Fermer]
```

## Recommandations architecture upload v2

Voir `docs/SPEC-UPLOAD-BACKGROUND-2026-10.md`. En bref : un job par envoi dans `useUploadQueue`, aucune écriture de `store.loading` pour un upload, `onProgress` et `signal` sur chaque méthode d'API qui envoie un fichier, compression systématique côté client, et côté serveur (plus tard) un découpage par fichier au-delà de 8 Mo.

## Backlog sprint 4 (format issues)

1. **[upload] Migrer Demande + devis vers la file d'envoi** — `AdminDemandeForm.onSubmit` / `resubmitDevis` → `uploads.enqueue({ kind: 'demande' })` ; retirer `store.loading` de `submitDemande`, `resubmitDemande` et `resubmitDemandeDevis`. *Critère* : on peut changer d'onglet pendant l'envoi de 3 devis. **P0 · M**
2. **[upload] Migrer Dépense directe** — `AdminDirectExpenseForm` → `kind: 'expense'`. **P0 · S**
3. **[upload] Relevés : dépôt et import** — `AdminBilanRelevesAlert.uploadReleve` et `AdminReleveImport.send` via la file ; garder le timeout de 120 s. **P1 · M**
4. **[upload] Timeout adaptatif** — `remoteRequest` : `timeoutMs = 60 s + taille ÷ 50 Ko/s` pour les envois, avec message dédié. **P0 · S**
5. **[upload] Mesurer heic2any sur iPhone** puis décider du Worker (U8). **P2 · S puis L**
6. **[apps-script] Lot de factures découpé** au-delà de 8 Mo, ou un fichier par requête avec une référence de lot. **P1 · M**
7. **[a11y] /soutenir : microcopy ≥ 12 px et contraste ≥ 4,5:1** sur la carte objectif et les toggles. **P1 · S**
8. **[a11y] Footer : textes ≥ 12 px, boutons de langue 44 px** sur mobile. **P2 · S**
9. **[mobile] Curseurs range : zone tactile de 44 px** (/soutenir, musée). **P2 · S**
10. **[admin] Toasts pour tous les messages store** (remplacer le bandeau en haut de page). **P1 · M**
11. **[admin] Feuille « Plus »** : piège de focus et blocage du scroll. **P2 · S**
12. **[qa] Tests Playwright 320 / 390 / 768** : reprendre le script de mesure de cet audit en CI (touch ≥ 44, champs ≥ 16 px, pas d'overflow). **P2 · M**

## Annexe : captures

| Fichier | Contenu |
|---------|---------|
| `audit-2026-10/avant-validation-mock-erreur-390.webp` | Validation en mode démo : erreur `getDemandesPending` |
| `audit-2026-10/avant-compta-onglets-320.webp` / `apres-…` | Onglets Compta à 320 px |
| `audit-2026-10/avant-cta-desactive-390.webp` / `apres-…` | CTA « Enregistrer la facture » désactivé |
| `audit-2026-10/apres-upload-navigation-390.webp` | Envoi UP4 en cours, utilisateur sur l'onglet Validation |
| `audit-2026-10/apres-upload-lot-succes-390.webp` | UP2 : lot de 3 factures terminé, toast avec références |
| `audit-2026-10/apres-upload-annulation-390.webp` | U4 : envoi annulé, Réessayer |

*Audit outillé : 22 écrans × 3 viewports, avant et après correctifs. Tableau de bord visuel : canvas « Audit design mobile & uploads — AKUU ».*
