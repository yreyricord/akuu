/**
 * Detects suspected untranslated i18n values.
 *
 * For each non-reference locale, flags keys where:
 *   locale[key] === en[key]  AND  fr[key] !== en[key]
 * (i.e. value identical to English but French differs → likely untranslated fallback)
 *
 * Run: node scripts/check-i18n-values.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { I18N_LOCALES } from '../src/config/locales.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function flattenValues(obj, prefix = '') {
  const out = new Map()
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    const v = obj[k]
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const [p, val] of flattenValues(v, path)) out.set(p, val)
    } else {
      out.set(path, v)
    }
  }
  return out
}

function load(locale) {
  const raw = readFileSync(join(root, 'src', 'i18n', `${locale}.json`), 'utf8')
  return flattenValues(JSON.parse(raw))
}

const fr = load('fr')
const en = load('en')

const localesToCheck = I18N_LOCALES.filter(l => l !== 'fr' && l !== 'en')

let totalSuspect = 0

for (const loc of localesToCheck) {
  const data = load(loc)
  const suspects = []

  for (const [key, val] of data) {
    const enVal = en.get(key)
    const frVal = fr.get(key)
    if (
      typeof val === 'string' &&
      typeof enVal === 'string' &&
      typeof frVal === 'string' &&
      val === enVal &&
      frVal !== enVal &&
      val.length > 1
    ) {
      suspects.push(key)
    }
  }

  if (suspects.length === 0) {
    console.log(`\n${loc}: all values appear translated.`)
    continue
  }

  totalSuspect += suspects.length

  const grouped = {}
  for (const key of suspects) {
    const section = key.split('.')[0]
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(key)
  }

  console.error(`\n${loc}: ${suspects.length} suspected untranslated key(s):`)
  for (const [section, keys] of Object.entries(grouped).sort()) {
    console.error(`  [${section}] (${keys.length})`)
    for (const k of keys.slice(0, 10)) {
      const val = data.get(k)
      console.error(`    ${k}: ${JSON.stringify(val).slice(0, 80)}`)
    }
    if (keys.length > 10) console.error(`    … and ${keys.length - 10} more`)
  }
}

if (totalSuspect === 0) {
  console.log(`\ni18n value audit OK: no suspected untranslated strings in ${localesToCheck.join(', ')}.`)
  process.exit(0)
} else {
  console.error(`\ni18n value audit: ${totalSuspect} total suspected untranslated string(s).`)
  process.exit(1)
}
