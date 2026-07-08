# Module 5 real content: néocolonialisme deck

Date: 2026-07-08
Status: Approved

## Context

Third sub-project of the volunteer training feature. Builds real content for
module 5 ("Solidarité internationale : histoire, éthique, rapports de
pouvoir et néocolonialisme"), replacing its "coming soon" placeholder. The
source is a Claude Design deck export (50 slides) at
`/Users/yreyricord/akuu/AKUU — Module formation néocolonialisme 2/`, not
part of this repo.

## What the deck actually is

A self-booting custom app (Claude's "Design Components" / `.dc.html`
format), not a set of static slides. `support.js` dynamically loads React,
ReactDOM, and Babel Standalone, then `deck-stage.js` renders the slides and
provides its own complete navigation: click/tap to advance, prev/next
buttons, a thumbnail menu, and keyboard shortcuts. Every slide also carries
a `data-speaker-notes` attribute (facilitator guidance for what reads as an
in-person 2-hour session) — these are only ever sent via `postMessage` to a
presenter-view panel that we do not build, so they are never rendered to
the viewer.

This means the deck cannot be reasonably converted into Vue components; it
has to be served and embedded as-is.

## Decisions

- **Embedding**: copy the deck's static files into
  `public/formation/module-5-deck/` and embed via `<iframe>` in
  `FormationModuleView.vue`, keyed off the module id. No custom slide
  navigation needed — the deck already has one.
- **Vendor the JS runtime instead of using the CDN**: the original export
  loads React 18.3.1, ReactDOM 18.3.1, and `@babel/standalone` 7.29.0 from
  `unpkg.com` at runtime. For a self-hosted site where every other
  dependency is bundled locally, an uncontrolled runtime fetch to a third
  party is a maintenance and reliability liability (training content that
  silently breaks if unpkg is down, changed, or blocked). The exact same
  versions were downloaded into `public/formation/module-5-deck/vendor/`
  and `support.js`'s `REACT_URL`/`REACT_DOM_URL`/`BABEL_URL` constants were
  repointed to the local copies. The original Subresource Integrity hashes
  in `support.js` were verified byte-for-byte against the downloaded files
  before repointing, so the SRI check still passes.
  - YouTube video embeds and the Google Fonts stylesheet link inside the
    deck were left as external requests — vendoring a video host or a web
    font service isn't practical, and both degrade gracefully (a slide
    without its embedded video, or a fallback system font) rather than
    breaking the whole deck the way a missing React bundle would.
- **Asset trimming**: of the 11 files in the source `uploads/` folder, only
  the 7 actually referenced by the deck were copied (dropping 2 duplicate
  logo/hummingbird images already in `images/`, and 2 unused screenshots).
  The 5 screenshot files with spaces in their names were renamed to
  descriptive, URL-safe slugs (e.g. `screenshot-kibera-post.png`) with the
  corresponding references updated in the copied HTML.
- **Renamed the deck's HTML file** from `AKUU Module 1.dc.html` to
  `index.html` for a clean URL and to drop the space in the filename.
- **Page layout**: `FormationModuleView.vue` keeps the standard site
  `NavBar`/`Footer` (unchanged from the rest of `/formation`, avoiding
  per-module chrome toggling for a single case) but widens to `max-w-6xl`
  and renders the deck inside a `16:9` `aspect-ratio` container for a large,
  legible viewing area, with a minimal "back to formation" link and the
  module title above it.
- **Fallback stays generic**: `MODULE_DECKS` in
  `src/data/formation-modules.js` maps module id → deck URL. Only `5` is
  present; any other module id still falls through to the existing "coming
  soon" placeholder, so adding the next module's deck later is a one-line
  addition.

## Architecture

- `public/formation/module-5-deck/`: `index.html`, `deck-stage.js`,
  `support.js` (patched), `vendor/{react,react-dom,babel}...js`,
  `images/*.png`, `uploads/*.png`.
- `src/data/formation-modules.js`: new `MODULE_DECKS` export.
- `src/views/formation/FormationModuleView.vue`: branches on
  `MODULE_DECKS[currentModule.id]` — deck view (iframe) if present,
  existing placeholder otherwise.

## Testing / verification

- Verified the 3 vendored file hashes match the SRI hashes originally
  embedded in `support.js` (confirms the exact matching versions were
  downloaded).
- `npm run build`: deck files present in `dist/formation/module-5-deck/`.
- Dev server: deck loads from slide 1, thumbnail nav and prev/next controls
  work, no console errors on a fresh load, `NavBar`/`Footer` still render
  around it.

## Out of scope (future sub-projects)

- Real content for the remaining 10 modules.
- Progress tracking, quizzes, feedback, admin dashboard (unchanged from
  earlier specs).
