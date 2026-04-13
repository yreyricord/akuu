/**
 * SSG pre-rendering is enabled via vite-ssg. Each route generates a static HTML
 * with full content, meta tags, and JSON-LD at build time.
 *
 * SEO files (robots.txt, sitemap.xml) are generated in prebuild via scripts/generate-seo-files.mjs.
 */
export const PRERENDER_ENABLED = true
