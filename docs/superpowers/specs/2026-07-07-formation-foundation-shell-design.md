# Formation (volunteer training) — foundation shell

Date: 2026-07-07
Status: Approved

## Context

AKUU wants an internal training area for volunteers heading on mission, divided
into modules with tests and feedback, plus an admin view of volunteer progress.
This is a multi-part project (accounts/auth, module content delivery, progress
tracking, quizzes, feedback, admin dashboard) being built as a sequence of
sub-projects on top of the existing static Vue 3 + Vite SSG site (no prior
backend, database, or accounts of any kind).

This spec covers only the **first sub-project**: the foundation shell — the
routing and page scaffolding that later sub-projects (module content viewer,
quizzes, feedback, admin dashboard) will build on. It intentionally does not
include accounts/login, the actual module content, quizzes, or admin features.

## Decisions

- **Access model**: unlisted URL only, no login for this phase ("secret
  link"). No per-volunteer accounts yet — that may come later if the
  audience grows beyond what a shared unlisted link can reasonably support.
- **URL**: `/formation` (landing) and `/formation/module-1` (reserved now,
  placeholder content, so the URL doesn't change when the real module 1
  viewer is built in the next sub-project).
- **Discoverability**: the route must not be reachable from anywhere in the
  public site UI or SEO surface:
  - Not added to `NavBar.vue`.
  - Not added to the `paths` array in `scripts/generate-seo-files.mjs`, so
    it's excluded from the generated `sitemap.xml`.
  - `robots.txt` gets a `Disallow: /formation` line (same pattern as the
    existing `Disallow: /_api/`).
  - Each formation route sets `meta.noIndex: true`; `App.vue`'s SEO head
    wiring emits `<meta name="robots" content="noindex, nofollow">` for
    those routes. This is defense in depth beyond robots.txt: robots.txt
    only stops crawling, not indexing of a URL discovered elsewhere.
- **Page chrome**: reuse the public site's `NavBar` and `Footer` (both are
  global in `App.vue`, so this requires no extra work — the new routes get
  them automatically like any other route).
- **i18n**: full i18n, matching the rest of the site. New top-level
  `formation` key plus `seo.routes.formation`, added with real translations
  to all 5 locale files (`fr`, `en`, `es`, `pt`, `de`) so
  `npm run i18n:check` passes. This applies to the shell's own UI strings
  only — actual training content (the decks) stays French-only and is out
  of scope for this sub-project.
- **No admin stub**: the landing page shows only the module list. An admin
  entry point will be added when the admin dashboard sub-project is
  designed — it needs its own access protection, which doesn't exist yet.

## Architecture

- `src/router/index.js`: two new route entries, `/formation` and
  `/formation/module-1`, each with `meta: { seoRoute: 'formation', noIndex: true }`.
- `src/views/formation/FormationView.vue`: landing page — AKUU-branded
  header, short intro, a card linking to Module 1 (styled as available).
  Future modules get added as additional entries here.
- `src/views/formation/FormationModuleView.vue`: placeholder for
  `/formation/module-1` — a "contenu à venir" card. Replaced by the real
  deck viewer in the next sub-project.
- `src/utils/documentSeo.js`: `buildRouteSeoHead()` gains a `noIndex`
  parameter that adds the robots meta tag when true.
- `src/i18n/{fr,en,es,pt,de}.json`: new `formation` and `seo.routes.formation`
  keys.
- `scripts/generate-seo-files.mjs`: no change to the `paths` array (the
  omission is what keeps it out of the sitemap); add the `Disallow` line
  to the `robots` template string.

## Data flow

None — this sub-project is static routing and placeholder content only. No
API calls, no storage, no state beyond normal Vue Router navigation.

## Error handling

None needed beyond what the app already does — these are ordinary static
routes with no external calls or user input.

## Testing / verification

No automated tests (routing + static content, no logic to unit test).
Verification is manual/build-based:

1. `npm run build` succeeds, including `i18n:check` against the new keys.
2. `dist/formation/index.html` and `dist/formation/module-1/index.html`
   exist (vite-ssg prerenders every route in the router by default).
3. `dist/sitemap.xml` does not contain `/formation`.
4. `dist/robots.txt` contains `Disallow: /formation`.
5. Dev server: `/formation` and `/formation/module-1` render with
   NavBar/Footer, and `/formation` does not appear in the rendered nav.

## Out of scope (future sub-projects)

- Real module content viewer (embedding the Claude Design deck export).
- Progress tracking (localStorage, no accounts yet).
- Quiz/test system per module.
- Feedback collection.
- Admin dashboard (needs its own access protection).
- Volunteer accounts/login, if the project later outgrows the unlisted-link
  model.
