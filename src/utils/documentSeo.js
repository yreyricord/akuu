import { getSiteOrigin, DEFAULT_OG_IMAGE_PATH } from '@/config/site.js'
import { OG_LOCALE_TAGS, DEFAULT_LOCALE, I18N_LOCALES } from '@/config/locales.js'

const isBrowser = typeof document !== 'undefined'

function absoluteUrl (origin, path) {
  const p = path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`
  return new URL(p, `${origin}/`).href
}

/**
 * Returns a reactive-ready head descriptor for @unhead/vue useHead().
 * Works during SSG (injected into static HTML) and on the client.
 */
export function buildRouteSeoHead ({ title, description, path, locale }) {
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

/**
 * Returns a JSON-LD graph descriptor for @unhead/vue useHead().
 */
export function buildOrganizationJsonLdHead () {
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
        '@type': 'NonprofitOrganization',
        '@id': `${origin}/#organization`,
        name: 'AKUU',
        description:
          'Association française de solidarité internationale : projets avec les communautés amazoniennes au Pérou (notamment Puerto Miguel et le musée Shapishiko), sensibilisation et mobilisation depuis la France.',
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
        inLanguage: [...I18N_LOCALES]
      }
    ]
  }
  return {
    script: [
      {
        type: 'application/ld+json',
        id: 'akuu-jsonld-graph',
        innerHTML: JSON.stringify(graph)
      }
    ]
  }
}

/**
 * Returns a BreadcrumbList JSON-LD head descriptor for @unhead/vue useHead().
 * @param {Array<{name: string, url: string}>} crumbs
 */
export function buildBreadcrumbJsonLdHead (crumbs) {
  if (!crumbs || crumbs.length === 0) return {}
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url
    }))
  }
  return {
    script: [
      {
        type: 'application/ld+json',
        id: 'akuu-jsonld-breadcrumb',
        innerHTML: JSON.stringify(data)
      }
    ]
  }
}
