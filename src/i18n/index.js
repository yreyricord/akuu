import { createI18n } from 'vue-i18n'
import { I18N_LOCALES, DEFAULT_LOCALE } from '@/config/locales.js'
import fr from './fr.json'
import en from './en.json'
import es from './es.json'
import pt from './pt.json'
import de from './de.json'

const messagesByCode = { fr, en, es, pt, de }

const messages = Object.fromEntries(
  I18N_LOCALES.map((code) => {
    const m = messagesByCode[code]
    if (!m) {
      throw new Error(
        `src/i18n/index.js: add import + messagesByCode["${code}"] for locale listed in I18N_LOCALES`
      )
    }
    return [code, m]
  })
)

const savedLocale = typeof localStorage !== 'undefined'
  ? localStorage.getItem('akuu-locale')
  : null

const initialLocale =
  savedLocale && I18N_LOCALES.includes(savedLocale) ? savedLocale : DEFAULT_LOCALE

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages
})

export default i18n
