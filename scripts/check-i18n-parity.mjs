/**
 * Compares flattened key paths across fr / en / es locale JSON files.
 * Run: node scripts/check-i18n-parity.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const locales = ['fr', 'en', 'es']

function flatten(obj, prefix = '') {
  const out = new Set()
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    const v = obj[k]
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const p of flatten(v, path)) out.add(p)
    } else {
      out.add(path)
    }
  }
  return out
}

const sets = {}
for (const loc of locales) {
  const raw = readFileSync(join(root, 'src', 'i18n', `${loc}.json`), 'utf8')
  sets[loc] = flatten(JSON.parse(raw))
}

let exit = 0
const fr = sets.fr
for (const loc of ['en', 'es']) {
  const other = sets[loc]
  const onlyFr = [...fr].filter((k) => !other.has(k)).sort()
  const onlyOther = [...other].filter((k) => !fr.has(k)).sort()
  if (onlyFr.length || onlyOther.length) {
    console.error(`\nMismatch vs fr ↔ ${loc}:`)
    if (onlyFr.length) console.error(`  Only in fr (${onlyFr.length}):`, onlyFr.slice(0, 40).join(', '), onlyFr.length > 40 ? '…' : '')
    if (onlyOther.length) console.error(`  Only in ${loc} (${onlyOther.length}):`, onlyOther.slice(0, 40).join(', '), onlyOther.length > 40 ? '…' : '')
    exit = 1
  }
}

if (!exit) {
  console.log('i18n key parity OK: fr, en, es have matching key trees.')
}
process.exit(exit)
