# Prompt Claude — Audit design mobile + uploads non bloquants (AKUU)

> **Quand l'utiliser** : audit complet UX/design + code, avec focus **mobile admin & bénévole**, et refonte de l'expérience **soumission de fichiers** (site figé pendant des minutes).
>
> **Prérequis** : repo cloné, `npm install`, accès trésorier test (ou mock `VITE_TRESORERIE_MOCK=true`).
>
> **Docs de référence à lire en priorité** (ne pas ré-auditer ce qui est déjà marqué ✅ sans re-vérifier visuellement) :
> - `docs/MOBILE-AUDIT-2026.md` — sprint 1–2 faits, sprint 3 backlog
> - `docs/GUIDE-CORRECTION-TRESORERIE-2026.md` — bugs opérationnels relevés
> - `RELEVES/outils/PROMPT-CLAUDE-QA-SITE-PRODUCTION.md` — matrice fonctionnelle complémentaire

---

## Message court à coller dans Claude (Cursor / Claude Code)

```
Lis et exécute de façon autonome le prompt :
akuu/docs/PROMPT-AUDIT-DESIGN-MOBILE-UPLOADS.md

Mode : audit complet → rapport → corrections P0/P1 par petits commits.
Ne t'arrête pas aux constats : implémente les quick wins upload (barre de progression, UI non bloquante) si le rapport le recommande.
Langue : français. Branche dédiée : audit/design-mobile-uploads-2026-10.
```

---

## PROMPT (copier à partir d'ici)

Tu es **lead UX/UI mobile**, **frontend engineer Vue 3**, et **QA engineer**. Tu travailles **de façon autonome** sur le projet AKUU (`akuu/` — Vue 3 · Vite · Tailwind · Pinia · Apps Script backend).

**Mission en une phrase** : produire un audit exhaustif design + code (priorité mobile), identifier tous les bugs visibles et d'interaction, et **concevoir puis implémenter** une expérience d'upload qui ne fige plus le site.

**Langue** : français pour rapports et commits.  
**Livrables obligatoires** (dans l'ordre) :

1. `docs/RAPPORT-AUDIT-DESIGN-MOBILE-2026-10.md` — constats + captures + priorités
2. `docs/SPEC-UPLOAD-BACKGROUND-2026-10.md` — spec technique upload non bloquant
3. Code : quick wins P0 upload + 3–5 fixes design mobile P0/P1
4. `docs/CHANGELOG-AUDIT-2026-10.md` — résumé des changements

**Ne demande pas confirmation** sauf si bloqué (pas de credentials trésorier, site injoignable, décision produit ambiguë).

---

### 0. Stratégie tokens & performance (OBLIGATOIRE)

Pour maximiser la qualité tout en limitant les tokens :

| Étape | Outil / méthode | Pourquoi |
|-------|-----------------|----------|
| Cartographie | `Glob` + `Grep` ciblé (`src/components/admin`, `src/views`, `store/tresorerie.js`) | Évite de lire 200 fichiers |
| Contexte existant | Lire **uniquement** les sections pertinentes de `MOBILE-AUDIT-2026.md` | Ne pas réinventer l'audit passé |
| Visuel mobile | **Browse headless** (`/browse` gstack ou Playwright) viewports **320×568**, **390×844**, **768×1024** | Les bugs design ne se voient pas dans le code seul |
| Parallélisation | Subagents : un pour **upload stack**, un pour **pages publiques mobile**, un pour **admin compta** | 3× plus rapide, moins de contexte par agent |
| Diff ciblé | `git log -20 --oneline` + grep des composants touchés | Comprendre les régressions récentes |
| Tests | `npm test` + tests existants receipt/filename | Valider sans relire tout le repo |
| Implémentation | **Petits diffs** par composant, réutiliser `AdminLoadingPanel`, `useLoadingProgress` | Cohérence design system |

**Interdit** : lire `bilan-comptable.json` ou gros JSON en entier · parcourir `node_modules` · relire tous les `.gs` Apps Script (hors upload API si bug réseau).

**Si Playwright/browse indisponible** : documenter la limitation, utiliser DevTools responsive + screenshots manuels décrits dans le rapport, et prioriser l'audit **code + heuristiques**.

---

### 1. Périmètre design & UX

#### 1.1 Viewports & devices (tester les 3)

- **320×568** — iPhone SE (P0 : tout doit rester utilisable)
- **390×844** — iPhone 14/15 (référence principale admin mobile)
- **768×1024** — iPad / tablette portrait

#### 1.2 Zones à auditer (checklist exhaustive)

**Site public** — routes : `/`, `/association`, `/projets`, `/musee-shapishiko`, `/volontaires`, `/soutenir`, `/contact`, `/formation`, `/comptes-ag`

Pour chaque page :
- [ ] Pas de scroll horizontal involontaire
- [ ] Touch targets ≥ 44px (boutons, liens, icônes, segments)
- [ ] Texte ≥ 12px corps, ≥ 16px inputs (anti-zoom iOS)
- [ ] Safe-area top/bottom sur éléments `fixed`/`sticky`
- [ ] États `:hover` only → équivalent touch/active/focus visible
- [ ] Modales / drawers : focus trap, fermeture, scroll lock
- [ ] Images / hero : pas de débordement, ratios cohérents
- [ ] Formulaires : labels, erreurs visibles, CTA disabled clair

**Admin trésorerie** — shell : `AdminTresorerieView.vue` + tous les onglets

Focus particulier :
- [ ] Bottom nav 4 + « Plus » : lisibilité, sheet, safe-area
- [ ] **Compta → Factures** : liste candidats scroll, panneau attach, « Toutes les années »
- [ ] **Compta → Écritures** : cartes mobile AdminDataTable
- [ ] **Bilan → Import relevé** : cartes opérations, selects pleine largeur
- [ ] **Validation** : refus avec message, boutons 44px
- [ ] **Demande / Facture bénévole** : batch multi-fichiers, post-submit flow
- [ ] **Fonc. / Dépense directe**

**Design system** — vérifier cohérence :
- `main.css` : `.admin-input`, `.admin-segment`, `.btn-primary`, `.touch-target`
- Couleurs sémantiques (forest, terracotta, ochre) : contrastes WCAG AA
- `AdminLoadingPanel` : usage homogène vs endroits sans feedback

#### 1.3 Format de constat (dans le rapport)

Pour **chaque** bug design, une entrée :

```markdown
### [P0|P1|P2|P3] Titre court
- **Page / composant** : `CheminFichier.vue` — route `/…`
- **Viewport** : 390×844 (ou autre)
- **Comportement actuel** : …
- **Comportement attendu** : …
- **Repro** : étapes 1-2-3
- **Fix proposé** : 1–3 lignes techniques
- **Effort** : S / M / L
```

Priorités :
- **P0** : bloque une tâche trésorier/bénévole sur mobile
- **P1** : dégrade fortement l'UX ou accessibilité
- **P2** : polish, incohérence visuelle
- **P3** : nice-to-have

---

### 2. Périmètre audit uploads (P0 produit)

**Problème utilisateur** : lors de la soumission d'un fichier (facture, devis, relevé, pièce jointe), le site reste **figé X minutes** sans feedback clair.

**Stack upload actuelle** (à auditer en profondeur) :

| Fichier | Rôle |
|---------|------|
| `src/components/admin/AdminFileCapture.vue` | capture caméra/galerie/PDF |
| `src/utils/receiptFile.js` | HEIC/JPEG → PDF (main thread) |
| `src/api/tresorerie/filePayload.js` | base64 FileReader |
| `src/store/tresorerie.js` | `loading` global unique |
| `src/api/tresorerie/client.js` | POST Apps Script, timeout 120s relevé |
| `AdminFactureForm.vue` | batch N fichiers |
| `AdminDemandeForm.vue` | devis multi-fichiers |
| `AdminComptaFactures.vue` | attachInvoice |
| `AdminReleveImport.vue` | parse pdfjs + import |
| `AdminDirectExpenseForm.vue` | dépense + pièce |

**Hypothèses de causes** (à confirmer avec mesures) :
1. Conversion PDF/HEIC synchrone sur main thread
2. Encodage base64 de gros fichiers sans progression
3. `store.loading` boolean global → UI entière désactivée
4. Batch séquentiel si endpoint `/factures/batch` absent
5. Preload journaux (`AdminComptaFactures` reloadAllInBackground) en concurrence avec upload
6. Pas de timeout UX ni message « vous pouvez continuer »

**Comportement cible** (à spécifier puis implémenter) :

```
┌─────────────────────────────────────────────┐
│  [Contenu site — reste navigable]           │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ 📤 Import facture AKUU-FAC-…  ████░░ 67%   │  ← barre fixe bas (safe-area)
│    Encodage… · Envoi… · 12 s                │     minimisable, non modal
└─────────────────────────────────────────────┘
         ↓ succès
┌─────────────────────────────────────────────┐
│ ✅ Facture enregistrée · Ouvrir Drive · ✕   │  ← toast / mini-banner 8s
└─────────────────────────────────────────────┘
```

**Exigences fonctionnelles upload v2** :

| # | Exigence |
|---|----------|
| U1 | **UI non bloquante** : l'utilisateur peut changer d'onglet admin pendant un upload |
| U2 | **Progression explicite** : phases `prepare` → `encode` → `upload` → `done` avec % ou spinner + ETA |
| U3 | **File d'attente** : plusieurs uploads simultanés ou séquentiels visibles |
| U4 | **Annulation** : bouton annuler si fetch pas encore terminé (AbortController) |
| U5 | **Succès / échec** : toast persistant avec action (Ouvrir Drive, Réessayer, Copier ref) |
| U6 | **Erreur partielle batch** : liste claire des fichiers OK / KO |
| U7 | **Limite taille** : avertissement avant encode si > 4 Mo (configurable) |
| U8 | **Worker optionnel** : conversion PDF hors main thread (P1, spec seulement si L effort) |
| U9 | **Accessibilité** : `aria-live="polite"` sur barre de statut |
| U10 | **Mobile** : barre bottom au-dessus de la nav admin, pas de modal plein écran |

**Architecture code proposée** (à valider/affiner dans SPEC) :

- Nouveau `src/store/uploadQueue.js` (Pinia) ou composable `useUploadQueue.js`
- Remplacer usages de `store.loading` pour uploads par `uploadQueue.isBusy(id)` **par job**
- Composant `AdminUploadTray.vue` (fixed bottom, z-index > nav)
- Composant `AdminUploadToast.vue` ou intégration toast existante
- Hook phases dans `filePayload.js` : `onProgress(phase, percent)`

**Mesures à inclure dans le rapport** (Chrome DevTools Performance ou `console.time`) :

- Temps conversion HEIC 3 Mo
- Temps encode base64 5 Mo PDF
- Temps POST Apps Script facture 1 fichier
- Temps batch 5 factures

---

### 3. Phase d'exécution autonome

#### Phase A — Reconnaissance (30 min équivalent)

1. Lire `docs/MOBILE-AUDIT-2026.md` §2–§8 + sprint 3 backlog
2. Grep : `store.loading`, `fileToAttachment`, `normalizeReceiptToPdf`, `AdminLoadingPanel`
3. Lister routes admin + composants formulaires
4. Lancer `npm run dev` si test visuel local

#### Phase B — Audit visuel mobile (prioritaire)

1. Browse chaque route publique P0/P1 aux 3 viewports
2. Browse admin connecté (mock ou prod) : login → chaque onglet principal
3. **Tester chaque bouton** : submit, refuser, valider, ajouter ligne, retirer, fermer, nav Plus
4. Noter tout élément < 44px, texte illisible, overlap safe-area, table horizontal

#### Phase C — Audit upload bout-en-bout

Scénarios **obligatoires** :

| ID | Scénario | Fichier test |
|----|----------|--------------|
| UP1 | 1 photo HEIC facture bénévole | photo iPhone |
| UP2 | Batch 3 factures JPG | 3 images |
| UP3 | Devis PDF demande | 1 PDF |
| UP4 | Attach facture compta | PDF GreenGeeks renommé |
| UP5 | Import relevé PDF | relevé banque |
| UP6 | Upload pendant navigation autre onglet | — |

Pour chaque : chronométrer, capturer état UI t=0, t=5s, t=30s, fin.

#### Phase D — Rapport

Rédiger `docs/RAPPORT-AUDIT-DESIGN-MOBILE-2026-10.md` :

```markdown
# Rapport audit design mobile & uploads — AKUU — oct. 2026

## Synthèse exécutive (10 lignes max)
## Score santé (0–10) : public mobile / admin mobile / uploads / accessibilité
## Top 10 P0
## Inventaire complet P0–P3 (tableau)
## Upload : diagnostic + wireframes ASCII
## Recommandations architecture upload v2
## Backlog sprint 4 (issues GitHub format)
## Annexe : captures / repros
```

#### Phase E — Spec upload

Rédiger `docs/SPEC-UPLOAD-BACKGROUND-2026-10.md` avec :
- API composable `useUploadQueue`
- Props/Events `AdminUploadTray`
- Migration plan (`store.loading` → queue)
- Cas limites (offline, 401 session, 413 payload)

#### Phase F — Implémentation (autonome, sans attendre validation)

**Minimum viable dans cette session** :

1. `AdminUploadTray.vue` + store queue basique
2. Brancher **au moins** : `AdminComptaFactures.send()` et `AdminFactureForm.onSubmit()`
3. Phases progress : encode + upload avec barre
4. Toast succès/erreur
5. **Ne plus** mettre `store.loading = true` pour ces deux flows (ou scoper loading)
6. 3 fixes design P0/P1 trouvés en Phase B (ex. texte 10px, bouton overlap, scroll)

**Tests** :
- `npm test`
- Vérifier manuellement UP4 + UP1 en mock
- Pas de régression lint

**Commits** : atomiques, messages en français, ex. :
- `fix(upload): barre de progression non bloquante pour factures`
- `fix(mobile): touch target validation queue`

---

### 4. Fichiers clés (ne pas ignorer)

```
akuu/src/views/admin/AdminTresorerieView.vue
akuu/src/components/admin/AdminComptaFactures.vue
akuu/src/components/admin/AdminFactureForm.vue
akuu/src/components/admin/AdminDemandeForm.vue
akuu/src/components/admin/AdminReleveImport.vue
akuu/src/components/admin/AdminFileCapture.vue
akuu/src/components/admin/AdminLoadingPanel.vue
akuu/src/components/admin/AdminValidationQueue.vue
akuu/src/components/admin/AdminDataTable.vue
akuu/src/store/tresorerie.js
akuu/src/api/tresorerie/client.js
akuu/src/api/tresorerie/filePayload.js
akuu/src/utils/receiptFile.js
akuu/src/composables/useLoadingProgress.js
akuu/src/assets/main.css
akuu/docs/MOBILE-AUDIT-2026.md
```

---

### 5. Critères de succès (Definition of Done)

- [ ] Rapport ≥ 25 constats documentés (dont ≥ 5 P0)
- [ ] Spec upload v2 rédigée et actionable
- [ ] Upload tray implémenté sur ≥ 2 flows critiques
- [ ] Site **navigable** pendant upload en cours (démontré dans rapport)
- [ ] ≥ 3 corrections design mobile commitées
- [ ] Aucun nouveau lint error
- [ ] `CHANGELOG-AUDIT-2026-10.md` à jour

---

### 6. Hors périmètre (explicitement)

- Refonte graphique complète / rebrand
- Migration Apps Script (sauf si upload timeout côté API — documenter seulement)
- Tests Playwright CI complets (specifier dans backlog, optionnel si temps)
- Pages AKUUVISION / RELEVES Python

---

### 7. Skills & commandes utiles

| Besoin | Commande / skill |
|--------|------------------|
| QA visuel + fix | `/qa` gstack |
| QA report only | `/qa-only` |
| Design review plan | `/plan-design-review` |
| Browse mobile | `/browse` puis viewports 390×844 |
| Review PR | `/review` |
| Health check | `/health` |

---

*Prompt v1 — oct. 2026 — AKUU trésorerie · maintenir après chaque grosse itération mobile.*
