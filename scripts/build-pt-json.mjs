/**
 * Construit src/i18n/pt.json : traductions depuis le cache translate-fr-to-pt
 * (si valides), sinon repli sur en.json (même structure que fr).
 *
 * Usage: node scripts/build-pt-json.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const CACHE_FILE = join(__dirname, '.locale-pt-br-cache.json')

function loadCache () {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function isBadTranslation (s, sourceFr) {
  if (typeof s !== 'string') return true
  const u = s.toUpperCase()
  if (u.includes('MYMEMORY')) return true
  if (u.includes('VISIT HTTPS://MYMEMORY')) return true
  if (u.includes('TOO MANY REQUESTS')) return true
  // MyMemory a parfois renvoyé du texte médical sans lien pour des sources courtes (ex. « L'association »).
  if (/imunossupress|ciclosporina|sirol[ií]mus|micofenolato|anticorpos citot/i.test(s)) {
    return true
  }
  if (
    sourceFr &&
    sourceFr.trim().length < 120 &&
    s.length > Math.max(220, sourceFr.trim().length * 5)
  ) {
    return true
  }
  return false
}

function mergeString (frStr, enStr, cache) {
  const c = cache[frStr]
  if (c && !isBadTranslation(c, frStr)) return c
  return enStr
}

function walk (frVal, enVal, cache) {
  if (typeof frVal === 'string' && typeof enVal === 'string') {
    return mergeString(frVal, enVal, cache)
  }
  if (Array.isArray(frVal) && Array.isArray(enVal)) {
    if (frVal.length !== enVal.length) {
      throw new Error(`Array length mismatch: fr ${frVal.length} vs en ${enVal.length}`)
    }
    return frVal.map((item, i) => walk(item, enVal[i], cache))
  }
  if (
    frVal !== null &&
    enVal !== null &&
    typeof frVal === 'object' &&
    typeof enVal === 'object' &&
    !Array.isArray(frVal) &&
    !Array.isArray(enVal)
  ) {
    const frKeys = Object.keys(frVal)
    const enKeys = Object.keys(enVal)
    if (frKeys.sort().join() !== enKeys.sort().join()) {
      throw new Error(`Object keys mismatch fr vs en`)
    }
    const out = {}
    for (const k of frKeys) {
      out[k] = walk(frVal[k], enVal[k], cache)
    }
    return out
  }
  return enVal
}

const fr = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'fr.json'), 'utf8'))
const en = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'en.json'), 'utf8'))
const cache = loadCache()
const pt = walk(fr, en, cache)
writeFileSync(join(root, 'src', 'i18n', 'pt.json'), `${JSON.stringify(pt, null, 2)}\n`, 'utf8')
console.log('Wrote src/i18n/pt.json (cache-valid PT + EN fallback).')
