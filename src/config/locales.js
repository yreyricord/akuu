/**
 * Source unique pour les langues du site (vue-i18n, SEO, scripts de parité).
 *
 * Pour ajouter une langue :
 * 1. Ajouter le code dans I18N_LOCALES (le premier reste la référence des scripts : fr).
 * 2. Créer src/i18n/{code}.json (même arborescence de clés que fr.json).
 * 3. Importer le JSON dans src/i18n/index.js et l’ajouter à `messages`.
 * 4. Compléter UI_LANGUAGES, OG_LOCALE_TAGS, HTML_LANG.
 * 5. Ajouter le bloc dans cours-anglais-narrative.json et hydrama-narrative.json.
 * 6. Étendre getHelloAssoWidgetLang si HelloAsso supporte la langue.
 * 7. npm run i18n:check && npm run i18n:check-narratives && npm run build
 */

/** Ordre : première locale = référence pour check-i18n-parity et check-narrative-structure (doit rester `fr`). */
export const I18N_LOCALES = ['fr', 'en', 'es', 'pt', 'de']

export const DEFAULT_LOCALE = 'fr'

/** Sélecteurs UI (header / footer) : même ordre que I18N_LOCALES recommandé. */
export const UI_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
]

/** Balises Open Graph (format og:locale). */
export const OG_LOCALE_TAGS = {
  fr: 'fr_FR',
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  de: 'de_DE'
}

/** Attribut `lang` sur <html> (BCP 47). */
export const HTML_LANG = {
  fr: 'fr',
  en: 'en',
  es: 'es',
  pt: 'pt-BR',
  de: 'de'
}

/**
 * HelloAsso : le widget formulaire n’expose pas toutes les langues du site.
 * Paramètre `lang=` sur l’URL du widget ; locales non listées → repli anglais.
 */
const HELLOASSO_WIDGET_LANG = {
  fr: 'fr',
  en: 'en'
}

const HELLOASSO_WIDGET_FALLBACK = 'en'

export function getHelloAssoWidgetLang (localeCode) {
  return HELLOASSO_WIDGET_LANG[localeCode] ?? HELLOASSO_WIDGET_FALLBACK
}
