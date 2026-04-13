/**
 * Compares flattened key paths across all locale JSON files vs reference (I18N_LOCALES[0]).
 * Run: node scripts/check-i18n-parity.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flatten, diffLocales } from './lib/i18n-utils.mjs'
import { I18N_LOCALES } from '../src/config/locales.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const base = I18N_LOCALES[0]
if (base !== 'fr') {
  console.error('check-i18n-parity: I18N_LOCALES[0] must be "fr" (reference locale).')
  process.exit(1)
}

const sets = {}
for (const loc of I18N_LOCALES) {
  const raw = readFileSync(join(root, 'src', 'i18n', `${loc}.json`), 'utf8')
  sets[loc] = flatten(JSON.parse(raw))
}

let exit = 0
const ref = sets[base]
for (const loc of I18N_LOCALES.slice(1)) {
  const { onlyInBase: onlyRef, onlyInOther } = diffLocales(ref, sets[loc])
  if (onlyRef.length || onlyInOther.length) {
    console.error(`\nMismatch vs ${base} ↔ ${loc}:`)
    if (onlyRef.length) console.error(`  Only in ${base} (${onlyRef.length}):`, onlyRef.slice(0, 40).join(', '), onlyRef.length > 40 ? '…' : '')
    if (onlyInOther.length) console.error(`  Only in ${loc} (${onlyInOther.length}):`, onlyInOther.slice(0, 40).join(', '), onlyInOther.length > 40 ? '…' : '')
    exit = 1
  }
}

if (!exit) {
  console.log(`i18n key parity OK: ${I18N_LOCALES.join(', ')} have matching key trees.`)
}
process.exit(exit)
