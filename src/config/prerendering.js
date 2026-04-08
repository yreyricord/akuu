/**
 * Optional prerendering (static HTML per route) is not enabled in this build.
 * Google generally executes JS for SPAs; for heavier crawl budgets or social previews
 * of dynamic-only content, consider later:
 * - Netlify Prerendering (plan-dependent) or a prerender service
 * - vite-ssg / SSG migration for critical routes
 *
 * Phase 2 (if impressions plateau): prerender or SSG at least `/` and `/musee-shapishiko`
 * so crawlers receive full body copy on first response; keep PRERENDER_ENABLED false until then.
 *
 * SEO files (robots.txt, sitemap.xml) are generated in prebuild via scripts/generate-seo-files.mjs.
 */
export const PRERENDER_ENABLED = false
