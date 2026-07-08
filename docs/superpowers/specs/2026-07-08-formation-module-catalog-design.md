# Formation module catalog (11 modules, 4 groups)

Date: 2026-07-08
Status: Approved

## Context

Second sub-project of the volunteer training feature (see
`2026-07-07-formation-foundation-shell-design.md` for the first: the unlisted
`/formation` shell). The full curriculum has 11 modules organized in 4
thematic groups, given by the user:

1. Comprendre l'Amazonie (modules 1 to 4): territory, history, geopolitics, data.
2. S'engager en solidarité internationale (modules 5 to 7): ethics, posture,
   field preparation. Module 5 is the néocolonialisme content already built
   in the first sub-project (previously placeholder-numbered as module 1;
   this corrects that).
3. Découvrir AKUU et la mission à Puerto Miguel (modules 8 to 10): the
   association, the museum project, life on mission.
4. Évaluation finale (module 11): final assessment.

This sub-project builds the full module catalog UI (landing page listing all
11 modules across 4 visually distinct groups) with placeholder "coming soon"
detail pages for all of them. It does not build real content for any module,
including module 5 (embedding the actual néocolonialisme deck is a separate,
later sub-project as already noted in the first spec's "Out of scope"
section).

## Decisions

- **Module numbering fix**: the néocolonialisme deck content slot moves from
  `/formation/module-1` to `/formation/module-5` to match the real
  curriculum position.
- **Routing**: the single static `/formation/module-1` route is replaced by
  one dynamic route `/formation/module-:id`, rendering a single
  `FormationModuleView.vue` that looks up module metadata by `id`. This
  avoids 11 near-duplicate view files for content that's currently
  identical placeholder text; each module's real content can later replace
  the placeholder without touching routing.
- **Content model**: a new `src/data/formation-modules.js` holds the
  structural data (group id, accent color per group, module-to-group
  mapping, ordering); no translatable text lives there. Actual titles and
  short descriptions go in i18n, translated into all 5 locales
  (`fr`, `en`, `es`, `pt`, `de`), consistent with the full-i18n decision
  from the first sub-project.
- **Module availability**: all 11 modules are clickable and lead to a
  "coming soon" placeholder page (the same pattern already built), not
  locked/disabled cards. This matches the existing pattern and avoids a
  second, different placeholder treatment.
- **Visual grouping**: each group renders as its own section with a colored
  accent heading (short title + one-line description) and a divider before
  the next group, all on one scrolling landing page (nothing hidden behind
  clicks/accordions). Group accent colors, drawn from the existing Tailwind
  palette:
  - Group 1 (Amazonie): `forest`
  - Group 2 (Solidarité internationale): `bleu`
  - Group 3 (AKUU / Puerto Miguel): `terracotta`
  - Group 4 (Évaluation finale): `night`
  Each module card shows a small numbered badge (e.g. "05") in its group's
  accent color instead of repeating "Module N" as text.
- **Animation**: reuse the site's existing `useScrollAnimation` composable
  and `.fade-in-up` CSS class (already used in `MuseeShapishikoView.vue`,
  `PartenairesView.vue`, etc.) for the group sections' scroll-reveal, rather
  than introducing a new animation mechanism.

## Architecture

- `src/data/formation-modules.js`: exports `FORMATION_GROUPS` (4 entries:
  `id`, `accent` Tailwind color token) and `FORMATION_MODULES` (11 entries:
  `id`, `groupId`), in curriculum order.
- `src/i18n/{fr,en,es,pt,de}.json`: extend the existing `formation` key with
  `formation.groups.group_1..4` (`title`, `description`) and
  `formation.modules.module_1..11` (`title`) objects.
- `src/views/formation/FormationView.vue`: rewritten to iterate
  `FORMATION_GROUPS`, and for each group render its modules
  (`FORMATION_MODULES.filter(m => m.groupId === group.id)`) as cards linking
  to `/formation/module-${id}`.
- `src/views/formation/FormationModuleView.vue`: reads `route.params.id`,
  looks up the module (and its group, for the accent color) in the data
  file, shows the module's i18n title and the existing "coming soon" copy.
  If the `id` doesn't match a known module, falls back to the same
  "coming soon" copy without a title lookup crash (defensive, since this is
  a route param).
- `src/router/index.js`: remove the `formation-module-1` static route, add
  `path: '/formation/module-:id'` with the same `meta` as before
  (`seoRoute: 'formation'`, `noIndex: true`, `solidNav: true`).

## Data flow

None beyond reading the static `formation-modules.js` array and i18n
messages at render time. No API calls, no storage.

## Error handling

Unknown module id in the URL (e.g. `/formation/module-99`): the view still
renders the generic "coming soon" page rather than crashing or 404ing, since
there's no harm in it and no real content to 404 against yet.

## Testing / verification

Same approach as the first sub-project: no automated tests (static content),
verification is manual/build-based.

1. `npm run i18n:check` passes with the new module/group keys in all 5
   locales.
2. `npm run build` succeeds; vite-ssg does not prerender per-module pages
   for a dynamic route (only the static `/formation` list page is
   prerendered), which is expected and fine since these are meant to be
   reached by direct link, not indexed anyway.
3. Dev server: `/formation` shows all 4 groups with correct colors and all
   11 modules; clicking a module card navigates to its
   `/formation/module-N` page showing the right title; the nav bar stays
   visible (solid) on both.

## Out of scope (future sub-projects)

- Real content for any module, including module 5's néocolonialisme deck.
- Progress tracking, quizzes, feedback, admin dashboard (unchanged from the
  first spec's out-of-scope list).
