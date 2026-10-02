# Audit mobile AKUU — Octobre 2026

Document de référence : état des lieux, audit par page, recommandations et statut d’implémentation.

**Stack** : Vue 3 · Vite SSG · Tailwind · Netlify  
**Cibles** : iPhone SE (320px) → iPhone Pro Max · Android Chrome · Safari iOS  
**Références UX** : patterns type Stripe Dashboard mobile, Apple HIG (44pt), Material 3 navigation bar, N26/Revolut bottom nav

---

## 1. Méthodologie

| Phase | Contenu |
|-------|---------|
| **Inventaire** | 16 routes publiques + 3 routes admin · composants layout partagés |
| **Audit heuristique** | Touch 44px · safe-area · scroll horizontal · typographie · nav |
| **Benchmark** | Apps natives : drawer full-screen, bottom nav ≤5 items, cartes vs tableaux |
| **Priorisation** | P0 bloquant · P1 impact · P2 polish · P3 nice-to-have |

---

## 2. État des lieux global

### Ce qui fonctionne déjà

- `min-h-dvh` sur shell admin et hero accueil
- Règle globale boutons 44×44px (`main.css`)
- `.admin-input` 44px · `.admin-touch-btn` 48px
- `AdminDataTable` → cartes automatiques ≤639px (Écritures, remboursements)
- Barre admin basse avec `safe-area-inset-bottom`
- Grilles Tailwind `sm:` / `md:` sur la plupart des pages publiques
- `PageHero` responsive avec clamp sur titres

### Lacunes transverses

| Problème | Impact | Statut |
|----------|--------|--------|
| Menu mobile = dropdown, pas drawer · pas de scroll lock | UX nav publique | **Corrigé** (drawer) |
| Safe-area absent sur nav fixe + scroll-to-top | iPhone encoche / barre home | **Corrigé** |
| Icônes sociales / hamburger < 44px | WCAG 2.5.5 | **Corrigé** |
| Admin : 9–11 onglets barre du bas | Scroll horizontal illisible | **Corrigé** (4 + Plus) |
| Tableaux Compta/Bilan/Relevé sans cartes mobile | Scroll 640–720px | **Corrigé** (Relevé, heatmap, factures) |
| Valeurs graphiques Compta au hover seulement | Inutilisable au toucher | **Corrigé** |
| Formation : grille 2 col sur téléphone | Modules illisibles | **Corrigé** |

---

## 3. Site public — recommandations par page

### `/` Accueil (`HomeView.vue`)

**Composants** : `HeroSection`, `MissionSection`, `DonSection`, `SocialSection`…

| Priorité | Recommandation |
|----------|----------------|
| P1 | Hero : `text-6xl` → `text-4xl sm:text-6xl` pour éviter débordement 320px |
| P1 | CTAs empilés full-width sous `sm` |
| P2 | Simulateur don 3 colonnes → 1 col mobile |
| P3 | Skip link « Aller au contenu » |

### `/association` (`AssociationView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P1 | Grille équipe `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` sur très petit écran |
| P2 | Cartes équipe : état « touch » visible (pas hover seul) |
| P2 | Timeline : augmenter tap targets accordéons |

### `/projets` (`ProjetsView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P2 | Filtres : scroll horizontal avec snap + fade edges |
| OK | Cartes projet = bonnes zones tactiles |

### `/musee-shapishiko` (`MuseeShapishikoView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P1 | `section-padding-musee-mobile` : réduire à `py-6` (actuellement identique à desktop) |
| P1 | `MuseePlanViewer` : hauteur `min(480px, 55vh)` |
| P2 | `MuseeCoupeAnimee` sticky 100dvh : mode simplifié ou `prefers-reduced-motion` |
| P2 | Vignettes plan : min 48px hauteur |

### `/volontaires` (`VolontairesView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P2 | Témoignages : `text-sm` → `text-base` sur mobile |
| OK | Lightbox photos fonctionnelle |

### `/soutenir` (`SoutienView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P0 | Hero très dense : regrouper toggles destination · réduire hauteur above-the-fold |
| P1 | Microcopy `text-[9px]`/`10px` → minimum 12px |
| P2 | Stats banner : 2×2 grid mobile |

### `/contact` (`ContactView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P1 | Inputs `text-base` (16px) → évite zoom iOS |
| P1 | Icônes sociales 40px → 44px |
| OK | Formulaire stack vertical |

### `/partenaires` (`PartenairesView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P2 | Logos 2 col → 1 col sous 360px ou padding plus généreux |

### `/hydrama`, `/cours-anglais`, `/casa-akuu`, `/gestion-dechets`

| Priorité | Recommandation |
|----------|----------------|
| P2 | Sections alternées : OK en stack · réduire répétition visuelle (long scroll) |
| P3 | Ancres internes pour navigation rapide |

### `/akuuvision` (`AkuuVisionView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P2 | Carte orphan 3e élément : `col-span-full sm:col-span-1` |

### `/formation` (`FormationView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P0 | **Grille modules 2 col → 1 col mobile** (liens pleine largeur) |
| P1 | `solidNav: true` déjà via meta router |
| P2 | River SVG : masquer sur `< sm` (performance) |

### `/formation/module-:id` (`FormationModuleView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P1 | Bouton plein écran 44px |
| P2 | Titre module : truncate + expand |

### `/merci` (`MerciView.vue`)

| Priorité | Recommandation |
|----------|----------------|
| P1 | `solidNav: true` (fond clair, nav transparente invisible) |

---

## 4. Layout public partagé

### `NavBar.vue`

| Recommandation | Statut |
|----------------|--------|
| Drawer plein écran + overlay + scroll lock body | **Implémenté** |
| Hamburger 44×44 · Escape ferme | **Implémenté** |
| `padding-top: env(safe-area-inset-top)` | **Implémenté** |

### `App.vue`

| Recommandation | Statut |
|----------------|--------|
| Scroll-to-top 44px + safe-area bottom | **Implémenté** |
| Skip link optionnel | P3 |

### `Footer.vue`

| Recommandation | Statut |
|----------------|--------|
| Icônes sociales 44×44 | **Implémenté** |

### `PageHero.vue`

| Recommandation | Statut |
|----------------|--------|
| `min-h-[280px] sm:min-h-[400px]` · hauteur 40vh mobile | **Implémenté** |

---

## 5. Admin / Trésorerie — recommandations

### Shell `AdminTresorerieView.vue`

| Priorité | Recommandation | Statut |
|----------|----------------|--------|
| P0 | Bottom nav : 4 onglets primaires + sheet « Plus » | **Implémenté** |
| P1 | Labels `text-xs` minimum · `aria-current` | **Implémenté** |
| P2 | `pb-28` pour clearance barre + safe area | **Implémenté** |

### Validation (`AdminValidationQueue.vue`)

| Priorité | Recommandation | Statut |
|----------|----------------|--------|
| P1 | Boutons « Voir » / « Refuser » → min 44px | **Implémenté** |
| P2 | Sections repliables par type | P3 |

### Compta (`AdminComptaOverview.vue`)

| Priorité | Recommandation | Statut |
|----------|----------------|--------|
| P1 | Valeurs barres visibles au toucher (pas hover) | **Implémenté** |
| P1 | Segments `min-h-[44px]` | **Implémenté** |
| P2 | Heatmap → cartes mobile | P2 backlog |

### Bilan — Relevé (`AdminReleveImport.vue`)

| Priorité | Recommandation | Statut |
|----------|----------------|--------|
| P0 | Cartes opération mobile (remplace table 720px) | **Implémenté** |
| P1 | Selects catégorie/projet pleine largeur | **Implémenté** |

### Factures Compta (`AdminComptaFactures.vue`)

| Priorité | Recommandation | Statut |
|----------|----------------|--------|
| P2 | Table année → cartes sous 640px | Backlog |

### Formulaires bénévole

| Fichier | Recommandation | Statut |
|---------|----------------|--------|
| `AdminDemandeForm` | OK stack + admin-input | OK |
| `AdminFactureForm` | Liens « Retirer » → boutons touch | **Implémenté** |
| `AdminFileCapture` | Bouton supprimer 44px | **Implémenté** |

---

## 6. Design system mobile (tokens)

```css
/* Cibles AKUU mobile */
--touch-min: 44px;
--touch-comfort: 48px;
--nav-bottom-height: 4.5rem; /* + safe-area */
--section-py-mobile: 1.5rem;  /* py-6 */
--section-py-desktop: 3rem;   /* py-12 */
--hero-h-mobile: min(40vh, 320px);
--text-input-mobile: 1rem;      /* 16px anti-zoom iOS */
```

### Classes utilitaires ajoutées

- `.touch-target` — 44×44 flex center
- `.safe-area-top` / `.safe-area-bottom` — encoches iPhone
- `.mobile-drawer` — overlay navigation
- `.admin-segment` — pill segmented control 44px

---

## 7. Roadmap d’exécution

### Sprint 1 — Fait dans ce commit

- [x] Document audit (ce fichier)
- [x] Nav drawer + scroll lock
- [x] Safe areas + touch targets globaux
- [x] Formation 1 colonne mobile
- [x] PageHero hauteur mobile
- [x] Admin bottom nav « Plus »
- [x] Relevé import cartes mobile
- [x] Compta charts touch + segments 44px
- [x] Validation / FileCapture touch

### Sprint 2 — Fait dans ce commit

- [x] Heatmap Compta cartes mobile
- [x] Table factures par année → cartes
- [x] Soutenir hero simplifié mobile (padding, toggles 44px, texte ≥12px)
- [x] Musée coupe scène allégée (82dvh, chips tactiles, scroll réduit)
- [x] Skip link + landmark `#main-content`

### Sprint 3 — Polish

- [ ] PWA manifest + icônes
- [ ] Haptic feedback admin actions (optionnel)
- [ ] Tests Playwright viewport 390×844

---

## 8. Checklist QA mobile (avant prod)

1. iPhone SE 320px : nav drawer · admin Plus · formation modules
2. Safari iOS : pas de zoom sur focus input contact/admin
3. Rotation paysage : pas de scroll horizontal involontaire
4. Safe area : barres fixe bas/haut ne masquent pas le contenu
5. VoiceOver : onglets admin annoncés · drawer focus trap

---

*Généré oct. 2026 · AKUU association · maintenir ce doc à chaque sprint mobile.*
