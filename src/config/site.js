/**
 * Canonical site origin for SEO (Open Graph, JSON-LD, sitemap build).
 * Set VITE_SITE_URL in Netlify: Site settings → Environment variables (e.g. https://www.akuu.org).
 */
export function getSiteOrigin () {
  const raw = import.meta.env.VITE_SITE_URL || 'https://www.akuu.org'
  return String(raw).replace(/\/$/, '')
}

export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.jpg'
