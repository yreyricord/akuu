/**
 * Writes public/robots.txt and public/sitemap.xml from VITE_SITE_URL (Netlify / CI).
 * Default: https://www.akuu.org
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const base = (process.env.VITE_SITE_URL || 'https://www.akuu.org').replace(/\/$/, '')

const paths = [
  '/',
  '/association',
  '/projets',
  '/musee-shapishiko',
  '/volontaires',
  '/soutenir',
  '/contact',
  '/hydrama',
  '/akuuvision',
  '/cours-anglais',
  '/casa-akuu',
  '/gestion-dechets'
]

const lastmod = new Date().toISOString().slice(0, 10)
const urls = paths
  .map((path) => {
    const loc = path === '/' ? `${base}/` : `${base}${path}`
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  })
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const robots = `User-agent: *
Allow: /

# Anciennes URLs d’API (ex. ancien CMS) — pas de contenu sur ce site statique
Disallow: /_api/

Sitemap: ${base}/sitemap.xml
`

writeFileSync(join(publicDir, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(publicDir, 'robots.txt'), robots, 'utf8')
console.log(`SEO files written for base ${base}`)
