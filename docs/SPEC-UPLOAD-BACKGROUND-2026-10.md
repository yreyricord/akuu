# Spec — Upload non bloquant (v2) — AKUU trésorerie — oct. 2026

> Statut : **v2.0 implémentée** pour Compta → Factures (rattacher) et Facture bénévole (lot).
> Constat et mesures : `docs/RAPPORT-AUDIT-DESIGN-MOBILE-2026-10.md`.

## 1. Objectifs (rappel U1–U10)

| # | Exigence | v2.0 |
|---|----------|------|
| U1 | UI non bloquante, navigation libre pendant l'envoi | ✅ 2 flux |
| U2 | Phases préparation → encodage → envoi → terminé, % et ETA | ✅ (% encodage réel, % envoi estimé) |
| U3 | Plusieurs envois visibles | ✅ (concurrents) |
| U4 | Annulation (AbortController) | ✅ |
| U5 | Toast succès / échec avec actions | ✅ Drive, Copier, Réessayer, Fermer |
| U6 | Erreur partielle de lot : fichier par fichier | ✅ (repli séquentiel) |
| U7 | Avertissement au-delà de 4 Mo | ✅ `UPLOAD_WARN_BYTES` |
| U8 | Conversion dans un Worker | ⏳ spec §7 |
| U9 | `aria-live="polite"` | ✅ changements d'étape seulement |
| U10 | Barre basse au-dessus de la nav admin, pas de modal | ✅ |

## 2. Chaîne d'un envoi

```
AdminFileCapture ──(sélection)──► normalizeReceiptToPdf
   │  photo : createImageBitmap(EXIF) → canvas ≤ 2200 px → JPEG 0,82 → pdf-lib
   │  PDF : inchangé (> 4 Mo → avertissement)
   ▼
uploads.enqueue({ kind, label, meta, run, describe, onSuccess, onError })
   │ prepare (2 %)
   ▼
run({ onProgress, signal })  ──► tresorerieApi.<méthode>(…, { onProgress, signal })
   │ encodeForUpload : FileReader.onprogress → onProgress('encode', r)   5 → 25 %
   │ onProgress('upload', 0, { bytes })                                  25 → 95 % estimé
   ▼
remoteRequest(path, { body, signal }) ── fetch POST text/plain ──► Apps Script
   ▼
done 100 % → describe(result) → toast 8 s → onSuccess(result) (rafraîchissements)
```

**Pourquoi pas de vrai % réseau** : `XMLHttpRequest.upload.onprogress` transforme la requête en requête CORS « non simple ». Le navigateur envoie alors un preflight `OPTIONS` que les Web Apps Apps Script ne gèrent pas, et la requête échoue. La phase d'envoi est donc estimée : `octets ÷ débit montant supposé + 6 s + 2,5 s × fichiers`. Le débit est déduit de `navigator.connection.downlink ÷ 3` (borné entre 0,4 et 20 Mbit/s), 1,5 Mbit/s par défaut. La courbe `1 − e^(−2,2t)` ralentit à l'approche de 95 % et ne « finit » jamais avant la réponse.

## 3. API — `useUploadQueue` (`src/store/uploadQueue.js`)

```js
const uploads = useUploadQueue()

const id = uploads.enqueue({
  kind: 'facture',                 // 'attach' | 'facture' | (à venir) 'demande' | 'expense' | 'releve'
  label: '3 factures · AKUU-DEM-2026-0001',
  meta: { demand: 'AKUU-DEM-2026-0001' },   // pour isBusy / activeMeta
  fileCount: 3,                    // affine l'estimation serveur
  run: ({ onProgress, signal }) => api(…, { onProgress, signal }),
  describe: (result) => ({ text, link, copyText, files }),
  onSuccess: async (result) => { /* rafraîchir, même si le composant est démonté */ },
  onError: (error) => { /* ex. retirer du lot les factures déjà créées */ }
})

uploads.cancel(id)       // abort() → phase 'cancelled'
uploads.retry(id)        // relance run() (même closure)
uploads.dismiss(id)      // retire un job terminé
uploads.isBusy('facture', (meta) => meta.demand === ref)  // verrou ciblé
uploads.activeMeta('attach', 'ref')                        // Set des références en cours
uploads.etaSeconds(job)
// état : jobs, visibleJobs, activeJobs, hasActive
```

**Phases** : `queued → prepare → encode → upload → done | error | cancelled` (libellés dans `UPLOAD_PHASES`).

**Règles** :
- un job ne lit jamais `store.loading` et n'y écrit jamais ;
- `onSuccess` ne doit pas supposer que le composant d'origine est monté (drapeau `mounted` ; voir `AdminFactureForm`) ;
- une erreur levée dans `onSuccess` ne transforme pas le succès en échec ;
- `run` doit être **rejouable**. Pour un lot, la closure ne garde que les éléments restants (`onError` filtre `e.partial`).

## 4. Composant — `AdminUploadTray.vue`

| Prop | Type | Défaut | Rôle |
|------|------|--------|------|
| `aboveNav` | Boolean | `true` | `bottom: calc(4.5rem + safe-area)` au-dessus de la nav admin, sinon `1rem + safe-area` |

Pas d'événements : la barre ne fait que lire le store et l'actionner.

- Mobile : pleine largeur moins 12 px de chaque côté. À partir de 640 px : 24 rem, alignée à droite. `z-[45]` : au-dessus de la nav (40), sous la feuille « Plus » (50/60).
- Réductible : une ligne avec le % global, qui se rouvre automatiquement à chaque nouvel envoi.
- Liste : max `45dvh`, défilante.
- Accessibilité : `section[aria-label]`, `role="progressbar"` + `aria-valuenow`, `sr-only aria-live="polite"` mis à jour **aux changements de phase** (pas à chaque tick), boutons de 44 px, spinner `motion-reduce:animate-none`.
- `beforeunload` tant qu'un envoi est actif.
- Le shell admin ajoute `pb-64` quand la barre est visible, pour qu'elle ne masque pas la fin du contenu.

## 5. Plan de migration `store.loading` → file

| Étape | Flux | Fichiers | Statut |
|-------|------|----------|--------|
| 1 | Compta → Factures (rattacher) | `AdminComptaFactures.send` → `kind: 'attach'` | ✅ |
| 2 | Facture bénévole (lot) | `AdminFactureForm.onSubmit` → `store.submitFacturesBatch(…, { background: true })` | ✅ |
| 3 | Demande + devis / renvoi de devis | `AdminDemandeForm` → `kind: 'demande'` ; `submitDemande`, `resubmitDemande`, `resubmitDemandeDevis` acceptent `opts.background` | ⏳ (API prête pour `createDemande`) |
| 4 | Dépense directe | `AdminDirectExpenseForm` → `kind: 'expense'` | ⏳ (API prête) |
| 5 | Relevés : dépôt PDF et import | `uploadReleve`, `importReleve` → `onProgress`/`signal` puis `kind: 'releve'` | ⏳ |
| 6 | Nettoyage | `loading` réservé aux actions sans fichier (valider, refuser…), puis `loadingAction` par référence | ⏳ |

## 6. Cas limites

| Cas | Comportement attendu | v2.0 |
|-----|----------------------|------|
| Hors ligne / DNS | `remoteRequest` lève « Connexion impossible… » → job `error`, Réessayer | ✅ |
| Réseau qui décroche (requête pendante) | Annuler ; **timeout adaptatif** `60 s + octets ÷ 50 Ko/s` (max 6 min) avec message « réseau trop lent, réessayez en Wi-Fi » | ✅ Annuler · ⏳ timeout |
| Annulation après réception par le serveur | Impossible à garantir : message « vérifiez avant de renvoyer » ; pour un rattachement, la ligne réapparaît seulement si le serveur n'a rien enregistré | ✅ |
| 401 / session expirée (`UNAUTHORIZED`) | Jeton supprimé par `remoteRequest`. À faire : action « Se reconnecter » qui conserve le job en mémoire puis Réessayer | ⏳ |
| 413 / payload trop gros (> ~50 Mo Apps Script) | Prévenu par la compression + U7. À faire : découper le lot au-delà de 8 Mo | ⏳ |
| Exécution Apps Script > 6 min | Même découpage ; un fichier par requête | ⏳ |
| Erreur partielle de lot (repli séquentiel) | `e.partial` = `[{ name, ok, error }]`, affiché ; Réessayer ne renvoie que les non-créées | ✅ |
| Double clic / double envoi | Rattachement : ligne masquée tant que `activeMeta('attach','ref')` la contient. Lot : `isBusy('facture', demand)` désactive l'envoi | ✅ |
| Fermeture de l'onglet | `beforeunload` | ✅ |
| Rechargement de la page | Le job est perdu (pas de persistance des fichiers). Acceptable : avertissement en amont | — |
| Photo HEIC illisible | Erreur à la sélection (inchangé) | ✅ |
| PNG transparent | Fond blanc avant le JPEG | ✅ |

## 7. Worker de conversion (U8 — à décider après mesure)

Déclencheur : heic2any au-delà de 2 s sur iPhone milieu de gamme, ou une longtask de plus de 200 ms mesurée en production.
Design : `receiptWorker.js` (module Worker Vite) qui reçoit le `File`, fait `createImageBitmap` puis `OffscreenCanvas.convertToBlob` puis pdf-lib, et renvoie le PDF. Repli thread principal si `OffscreenCanvas` est absent (Safari < 16.4). heic2any n'est pas compatible Worker (dépend de `document`) : HEIC reste sur le thread principal, ou passe à `libheif-js` (WASM).

## 8. Tests

- `npm test` (scripts de build) + `npm run build` (vérifs i18n incluses).
- Démo (`VITE_TRESORERIE_API_URL` vide) : réseau simulé à environ 400 Ko/s, journal de l'année courante simulé. Scénarios UP2, UP4 et U4 rejoués sous Playwright (rapport, annexe).
- Backlog : script Playwright `scripts/qa-mobile.mjs` (viewports 320/390/768, touch ≥ 44, champs ≥ 16 px, upload non bloquant).
