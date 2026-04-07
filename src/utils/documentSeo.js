import { getSiteOrigin, DEFAULT_OG_IMAGE_PATH } from '@/config/site.js'
import { HREFLANG_ALTERNATES_ENABLED } from '@/config/seoLocalePolicy.js'

const OG_LOCALES = {
  fr: 'fr_FR',
  en: 'en_US',
  es: 'es_ES'
}

function ensureMeta (attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeOgLocaleAlternates () {
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((n) => n.remove())
}

function setCanonical (href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function setJsonLd (id, data) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function absoluteUrl (origin, path) {
  const p = path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`
  return new URL(p, `${origin}/`).href
}

/**
 * Call once after app mount. Uses live site origin for @id URLs.
 */
export function injectOrganizationJsonLd () {
  const origin = getSiteOrigin()
  const logo = new URL('/images/LOGOAKUU.png', `${origin}/`).href
  const sameAs = [
    'https://www.facebook.com/AKUUAssociation/',
    'https://www.instagram.com/akuu_association/',
    'https://www.linkedin.com/company/akuu-association/',
    'https://www.tiktok.com/@akuu_asso',
    'https://www.helloasso.com/associations/akuu'
  ]
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'AKUU',
        url: origin,
        logo: { '@type': 'ImageObject', url: logo },
        email: 'contact@akuu.org',
        sameAs
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'AKUU',
        publisher: { '@id': `${origin}/#organization` },
        inLanguage: ['fr', 'en', 'es']
      }
    ]
  }
  setJsonLd('akuu-jsonld-graph', graph)
}

/**
 * Updates title, description, canonical, Open Graph and Twitter tags for the current route.
 */
export function applyRouteDocumentSeo ({ title, description, path, locale }) {
  const origin = getSiteOrigin()
  const pageUrl = absoluteUrl(origin, path)
  const ogLocale = OG_LOCALES[locale] || OG_LOCALES.fr
  const imageUrl = new URL(DEFAULT_OG_IMAGE_PATH, `${origin}/`).href

  document.title = title

  ensureMeta('name', 'description', description)
  setCanonical(pageUrl)

  ensureMeta('property', 'og:title', title)
  ensureMeta('property', 'og:description', description)
  ensureMeta('property', 'og:url', pageUrl)
  ensureMeta('property', 'og:type', 'website')
  ensureMeta('property', 'og:image', imageUrl)
  ensureMeta('property', 'og:locale', ogLocale)
  ensureMeta('property', 'og:site_name', 'AKUU')

  removeOgLocaleAlternates()
  const alternates = Object.values(OG_LOCALES).filter((l) => l !== ogLocale)
  alternates.forEach((loc) => {
    const el = document.createElement('meta')
    el.setAttribute('property', 'og:locale:alternate')
    el.setAttribute('content', loc)
    document.head.appendChild(el)
  })

  ensureMeta('name', 'twitter:card', 'summary_large_image')
  ensureMeta('name', 'twitter:title', title)
  ensureMeta('name', 'twitter:description', description)
  ensureMeta('name', 'twitter:image', imageUrl)

  document.head.querySelectorAll('link[data-akuu-hreflang="1"]').forEach((n) => n.remove())
  if (HREFLANG_ALTERNATES_ENABLED) {
    const originBase = origin
    const langs = [
      { code: 'fr', path: '/fr' },
      { code: 'en', path: '/en' },
      { code: 'es', path: '/es' }
    ]
    for (const { code, path: prefix } of langs) {
      const href = new URL(`${prefix}${path === '/' ? '' : path}`, `${originBase}/`).href
      const link = document.createElement('link')
      link.setAttribute('rel', 'alternate')
      link.setAttribute('hreflang', code)
      link.setAttribute('href', href)
      link.setAttribute('data-akuu-hreflang', '1')
      document.head.appendChild(link)
    }
    const xd = document.createElement('link')
    xd.setAttribute('rel', 'alternate')
    xd.setAttribute('hreflang', 'x-default')
    xd.setAttribute('href', new URL(path, `${originBase}/`).href)
    xd.setAttribute('data-akuu-hreflang', '1')
    document.head.appendChild(xd)
  }
}
