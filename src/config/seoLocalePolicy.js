/**
 * Locales are chosen client-side (localStorage); URLs do not vary by language.
 * Primary indexation language: French. Do not emit hreflang for en/es until
 * dedicated paths exist (e.g. /en/association), or search engines may see misleading alternates.
 */
export const PRIMARY_SEO_LOCALE = 'fr'

export const HREFLANG_ALTERNATES_ENABLED = false
