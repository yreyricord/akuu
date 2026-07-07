# Formation Foundation Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an unlisted `/formation` area (landing page + reserved `/formation/module-1` placeholder) that isn't discoverable via nav, sitemap, or search indexing, as the routing foundation for the volunteer training feature.

**Architecture:** Two new Vue Router routes rendering two new view components under `src/views/formation/`. They reuse the global `NavBar`/`Footer` in `App.vue` automatically. A `noIndex` route-meta flag flows through `buildRouteSeoHead()` to emit a robots meta tag. Discoverability is suppressed by omission (not in `NavBar.vue`, not in the sitemap `paths` array) plus an explicit `Disallow` line in the generated `robots.txt`.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, vue-i18n, Tailwind CSS, @phosphor-icons/vue, vite-ssg.

Spec: `docs/superpowers/specs/2026-07-07-formation-foundation-shell-design.md`

---

### Task 1: `noIndex` support in the SEO head builder

**Files:**
- Modify: `src/utils/documentSeo.js:15-49`
- Modify: `src/App.vue:60-68` (the `routeSeo` computed)

- [ ] **Step 1: Add the `noIndex` param and robots meta tag**

In `src/utils/documentSeo.js`, change the `buildRouteSeoHead` signature and meta array:

```js
export function buildRouteSeoHead ({ title, description, path, locale, noIndex = false }) {
  const origin = getSiteOrigin()
  const pageUrl = absoluteUrl(origin, path)
  const ogLocale = OG_LOCALE_TAGS[locale] || OG_LOCALE_TAGS[DEFAULT_LOCALE]
  const imageUrl = new URL(DEFAULT_OG_IMAGE_PATH, `${origin}/`).href

  const alternateLocales = I18N_LOCALES
    .map((code) => OG_LOCALE_TAGS[code])
    .filter((l) => l && l !== ogLocale)

  return {
    title,
    meta: [
      { name: 'description', content: description },
      ...(noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: pageUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: imageUrl },
      { property: 'og:locale', content: ogLocale },
      { property: 'og:site_name', content: 'AKUU' },
      ...alternateLocales.map((loc) => ({
        property: 'og:locale:alternate',
        content: loc
      })),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl }
    ],
    link: [
      { rel: 'canonical', href: pageUrl }
    ]
  }
}
```

- [ ] **Step 2: Pass `noIndex` from the route in `App.vue`**

In `src/App.vue`, inside the `routeSeo` computed, add `noIndex: route.meta.noIndex === true` to the `buildRouteSeoHead` call:

```js
const routeSeo = computed(() => {
  const seoKey = route.meta.seoRoute || 'home'
  const titleKey = `seo.routes.${seoKey}.title`
  const descKey = `seo.routes.${seoKey}.description`
  const title = te(titleKey) ? t(titleKey) : t('seo.title')
  const description = te(descKey) ? t(descKey) : t('seo.description')
  return buildRouteSeoHead({
    title,
    description,
    path: route.path,
    locale: locale.value,
    noIndex: route.meta.noIndex === true
  })
})
```

- [ ] **Step 3: Verify no other call sites broke**

Run: `grep -rn "buildRouteSeoHead" src/`
Expected: only the definition in `documentSeo.js` and the one call site in `App.vue` — both updated, no other callers to fix.

- [ ] **Step 4: Commit**

```bash
cd /Users/yreyricord/akuu/akuu
git add src/utils/documentSeo.js src/App.vue
git commit -m "feat(formation): add noIndex support to route SEO head builder"
```

---

### Task 2: i18n keys for the formation shell (5 locales)

**Files:**
- Modify: `src/i18n/fr.json`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/es.json`
- Modify: `src/i18n/pt.json`
- Modify: `src/i18n/de.json`

For each locale file, add a top-level `"formation"` key (place it next to the existing `"volontaires"` key) and a `"formation"` entry inside the existing `"seo": { "routes": { ... } }` object (next to the existing `"volontaires"` entry there). Use `read` on each file first to find the exact insertion points (after the `"volontaires"` block in both places), since exact surrounding JSON differs slightly per locale file spacing.

- [ ] **Step 1: `src/i18n/fr.json`**

Add to the top-level object:
```json
"formation": {
  "page_title": "Espace Formation",
  "intro": "Ressources et modules de formation pour les bénévoles AKUU en préparation de mission au Pérou.",
  "module_1": {
    "title": "Module 1 — Comprendre pour mieux agir",
    "description": "Colonialisme, aide internationale, sauveur blanc, volontourisme.",
    "cta": "Commencer"
  },
  "coming_soon": {
    "title": "Contenu du module à venir",
    "text": "Cette page accueillera bientôt le contenu interactif du module.",
    "back": "Retour à l'espace formation"
  }
},
```

Add inside `seo.routes`:
```json
"formation": {
  "title": "Espace Formation — Bénévoles AKUU",
  "description": "Espace de formation interne pour les bénévoles AKUU en préparation de mission."
},
```

- [ ] **Step 2: `src/i18n/en.json`**

Top-level:
```json
"formation": {
  "page_title": "Training Space",
  "intro": "Resources and training modules for AKUU volunteers preparing for their mission in Peru.",
  "module_1": {
    "title": "Module 1 — Understanding to Act Better",
    "description": "Colonialism, international aid, the white savior figure, voluntourism.",
    "cta": "Start"
  },
  "coming_soon": {
    "title": "Module content coming soon",
    "text": "This page will soon host the module's interactive content.",
    "back": "Back to the training space"
  }
},
```

`seo.routes`:
```json
"formation": {
  "title": "Training Space — AKUU Volunteers",
  "description": "Internal training space for AKUU volunteers preparing for their mission."
},
```

- [ ] **Step 3: `src/i18n/es.json`**

Top-level:
```json
"formation": {
  "page_title": "Espacio de Formación",
  "intro": "Recursos y módulos de formación para los voluntarios de AKUU que se preparan para su misión en Perú.",
  "module_1": {
    "title": "Módulo 1 — Comprender para actuar mejor",
    "description": "Colonialismo, ayuda internacional, el salvador blanco, voluntariado turístico.",
    "cta": "Empezar"
  },
  "coming_soon": {
    "title": "Contenido del módulo próximamente",
    "text": "Esta página pronto tendrá el contenido interactivo del módulo.",
    "back": "Volver al espacio de formación"
  }
},
```

`seo.routes`:
```json
"formation": {
  "title": "Espacio de Formación — Voluntarios AKUU",
  "description": "Espacio de formación interno para los voluntarios de AKUU en preparación de su misión."
},
```

- [ ] **Step 4: `src/i18n/pt.json`**

Top-level:
```json
"formation": {
  "page_title": "Espaço de Formação",
  "intro": "Recursos e módulos de formação para os voluntários da AKUU que se preparam para a missão no Peru.",
  "module_1": {
    "title": "Módulo 1 — Compreender para agir melhor",
    "description": "Colonialismo, ajuda internacional, o salvador branco, voluntourismo.",
    "cta": "Começar"
  },
  "coming_soon": {
    "title": "Conteúdo do módulo em breve",
    "text": "Esta página em breve terá o conteúdo interativo do módulo.",
    "back": "Voltar ao espaço de formação"
  }
},
```

`seo.routes`:
```json
"formation": {
  "title": "Espaço de Formação — Voluntários AKUU",
  "description": "Espaço de formação interno para os voluntários da AKUU em preparação para a missão."
},
```

- [ ] **Step 5: `src/i18n/de.json`**

Top-level:
```json
"formation": {
  "page_title": "Schulungsbereich",
  "intro": "Ressourcen und Schulungsmodule für AKUU-Freiwillige zur Vorbereitung ihres Einsatzes in Peru.",
  "module_1": {
    "title": "Modul 1 — Verstehen, um besser zu handeln",
    "description": "Kolonialismus, internationale Hilfe, der „weiße Retter“, Voluntourismus.",
    "cta": "Beginnen"
  },
  "coming_soon": {
    "title": "Modulinhalt folgt in Kürze",
    "text": "Diese Seite wird bald den interaktiven Inhalt des Moduls enthalten.",
    "back": "Zurück zum Schulungsbereich"
  }
},
```

`seo.routes`:
```json
"formation": {
  "title": "Schulungsbereich — AKUU-Freiwillige",
  "description": "Interner Schulungsbereich für AKUU-Freiwillige zur Vorbereitung ihres Einsatzes."
},
```

- [ ] **Step 6: Verify key parity**

Run: `npm run i18n:check`
Expected: exits 0, no missing/extra key errors for `formation` or `seo.routes.formation` in any locale.

- [ ] **Step 7: Commit**

```bash
cd /Users/yreyricord/akuu/akuu
git add src/i18n/fr.json src/i18n/en.json src/i18n/es.json src/i18n/pt.json src/i18n/de.json
git commit -m "feat(formation): add i18n keys for formation shell (5 locales)"
```

---

### Task 3: Formation views and routes

**Files:**
- Create: `src/views/formation/FormationView.vue`
- Create: `src/views/formation/FormationModuleView.vue`
- Modify: `src/router/index.js`

- [ ] **Step 1: Create `src/views/formation/FormationView.vue`**

```vue
<template>
  <div class="min-h-screen bg-cream px-6 py-24">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-4xl font-serif font-bold text-night mb-4">{{ $t('formation.page_title') }}</h1>
      <p class="text-night/60 text-lg leading-relaxed mb-12">{{ $t('formation.intro') }}</p>

      <router-link
        to="/formation/module-1"
        class="block bg-white border border-night/10 rounded-2xl p-6 hover:border-forest transition-colors group"
      >
        <h2 class="text-2xl font-serif font-bold text-night mb-2 group-hover:text-forest transition-colors">
          {{ $t('formation.module_1.title') }}
        </h2>
        <p class="text-night/60 mb-6">{{ $t('formation.module_1.description') }}</p>
        <span class="inline-flex items-center gap-2 bg-forest text-white font-semibold px-6 py-3 rounded-2xl group-hover:bg-forest/90 transition-colors">
          {{ $t('formation.module_1.cta') }} <PhArrowRight :size="16" />
        </span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { PhArrowRight } from '@phosphor-icons/vue'
</script>
```

- [ ] **Step 2: Create `src/views/formation/FormationModuleView.vue`**

```vue
<template>
  <div class="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-24 text-center">
    <div class="w-16 h-16 rounded-full bg-leaf/20 flex items-center justify-center mb-6">
      <PhClock :size="32" weight="duotone" class="text-forest" />
    </div>
    <h1 class="text-4xl font-serif font-bold text-night mb-4">{{ $t('formation.coming_soon.title') }}</h1>
    <p class="text-night/60 max-w-md text-lg leading-relaxed mb-8">{{ $t('formation.coming_soon.text') }}</p>
    <router-link
      to="/formation"
      class="inline-flex items-center gap-2 bg-forest text-white font-semibold px-6 py-3 rounded-2xl hover:bg-forest/90 transition-colors"
    >
      <PhArrowLeft :size="16" /> {{ $t('formation.coming_soon.back') }}
    </router-link>
  </div>
</template>

<script setup>
import { PhClock, PhArrowLeft } from '@phosphor-icons/vue'
</script>
```

- [ ] **Step 3: Register routes in `src/router/index.js`**

Insert before the `/merci` route entry:

```js
  {
    path: '/formation',
    name: 'formation',
    meta: { seoRoute: 'formation', noIndex: true },
    component: () => import('@/views/formation/FormationView.vue')
  },
  {
    path: '/formation/module-1',
    name: 'formation-module-1',
    meta: { seoRoute: 'formation', noIndex: true },
    component: () => import('@/views/formation/FormationModuleView.vue')
  },
```

- [ ] **Step 4: Commit**

```bash
cd /Users/yreyricord/akuu/akuu
git add src/views/formation/FormationView.vue src/views/formation/FormationModuleView.vue src/router/index.js
git commit -m "feat(formation): add /formation and /formation/module-1 routes"
```

---

### Task 4: Exclude from sitemap, disallow in robots.txt

**Files:**
- Modify: `scripts/generate-seo-files.mjs`

- [ ] **Step 1: Add the `Disallow` line**

In `scripts/generate-seo-files.mjs`, do **not** add `/formation` to the `paths` array (that omission is what keeps it out of `sitemap.xml`). Change the `robots` template string:

```js
const robots = `User-agent: *
Allow: /

# Anciennes URLs d’API (ex. ancien CMS) — pas de contenu sur ce site statique
Disallow: /_api/

# Espace formation bénévoles — accès par lien direct uniquement, pas d'indexation
Disallow: /formation

Sitemap: ${base}/sitemap.xml
`
```

- [ ] **Step 2: Regenerate and verify**

Run: `npm run seo:files`
Then: `grep -n "formation" public/robots.txt public/sitemap.xml`
Expected: `public/robots.txt` shows the new `Disallow: /formation` line; `public/sitemap.xml` has no match (no `/formation` entry).

- [ ] **Step 3: Commit**

```bash
cd /Users/yreyricord/akuu/akuu
git add scripts/generate-seo-files.mjs public/robots.txt public/sitemap.xml
git commit -m "feat(formation): exclude /formation from sitemap, disallow in robots.txt"
```

---

### Task 5: Build verification

**Files:** none (verification only)

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: exits 0. This exercises `prebuild` (`musee:gallery`, `seo:files`, `i18n:check`, `i18n:check-narratives`) then `vite-ssg build`.

- [ ] **Step 2: Confirm SSG output for both new routes**

Run: `test -f dist/formation/index.html && test -f dist/formation/module-1/index.html && echo OK`
Expected: prints `OK`.

- [ ] **Step 3: Confirm noindex meta tag is present in the built HTML**

Run: `grep -o '<meta name="robots"[^>]*>' dist/formation/index.html`
Expected: `<meta name="robots" content="noindex, nofollow">`.

- [ ] **Step 4: Confirm sitemap/robots in the build output**

Run: `grep -c "formation" dist/sitemap.xml; grep "Disallow: /formation" dist/robots.txt`
Expected: first command prints `0`; second prints the `Disallow: /formation` line.

No commit for this task — it's verification only, no file changes.

---

### Task 6: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (or use the project's preview tooling)

- [ ] **Step 2: Visit `/formation`**

Confirm: page renders with the global `NavBar` and `Footer`, shows "Espace Formation" heading and the Module 1 card.

- [ ] **Step 3: Visit `/formation/module-1`**

Confirm: page renders with `NavBar`/`Footer`, shows the "coming soon" placeholder, and the back link returns to `/formation`.

- [ ] **Step 4: Confirm no nav link exists**

Inspect the rendered `NavBar` (desktop and mobile menu) — confirm no link to `/formation` appears anywhere.

No commit for this task — it's manual verification only.
