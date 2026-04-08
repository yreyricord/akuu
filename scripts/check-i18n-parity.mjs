/**
 * Compares flattened key paths across fr / en / es locale JSON files.
 * Run: node scripts/check-i18n-parity.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flatten, diffLocales } from './lib/i18n-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const locales = ['fr', 'en', 'es']

const sets = {}
for (const loc of locales) {
  const raw = readFileSync(join(root, 'src', 'i18n', `${loc}.json`), 'utf8')
  sets[loc] = flatten(JSON.parse(raw))
}

let exit = 0
const fr = sets.fr
for (const loc of ['en', 'es']) {
  const { onlyInBase: onlyFr, onlyInOther } = diffLocales(fr, sets[loc])
  if (onlyFr.length || onlyInOther.length) {
    console.error(`\nMismatch vs fr ↔ ${loc}:`)
    if (onlyFr.length) console.error(`  Only in fr (${onlyFr.length}):`, onlyFr.slice(0, 40).join(', '), onlyFr.length > 40 ? '…' : '')
    if (onlyInOther.length) console.error(`  Only in ${loc} (${onlyInOther.length}):`, onlyInOther.slice(0, 40).join(', '), onlyInOther.length > 40 ? '…' : '')
    exit = 1
  }
}

if (!exit) {
  console.log('i18n key parity OK: fr, en, es have matching key trees.')
}
process.exit(exit)
