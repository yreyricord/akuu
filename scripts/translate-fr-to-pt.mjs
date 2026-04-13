/**
 * One-off / maintenance: build src/i18n/pt.json from fr.json via MyMemory API (fr → pt-BR).
 * Preserves vue-i18n placeholders {name}. Saves cache for reruns.
 *
 * Usage: node scripts/translate-fr-to-pt.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const CACHE_FILE = join(__dirname, '.locale-pt-br-cache.json')
const DELAY_MS = 280

function loadCache () {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache (c) {
  writeFileSync(CACHE_FILE, JSON.stringify(c, null, 0), 'utf8')
}

function hideInterpolations (s) {
  return s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, name) => `__PL_${name}__`)
}

function showInterpolations (s) {
  return s.replace(/__PL_([a-zA-Z_][a-zA-Z0-9_]*)__/g, (_, name) => `{${name}}`)
}

function requiredPlaceholders (s) {
  const m = s.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g)
  return m ? [...new Set(m)] : []
}

function sleep (ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function translateFrToPt (text, cache) {
  if (!text || !String(text).trim()) return text
  if (cache[text]) return cache[text]

  const hidden = hideInterpolations(text)
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(hidden)}&langpair=fr|pt-BR`
  await sleep(DELAY_MS)
  const res = await fetch(url)
  const data = await res.json()

  if (data.responseStatus !== 200 && data.responseStatus !== 403) {
    console.warn('API warning:', data.responseStatus, data.responseDetails)
  }
  const raw = data.responseData?.translatedText
  if (!raw) {
    throw new Error(`Translate failed: ${JSON.stringify(data).slice(0, 500)}`)
  }
  const upper = raw.toUpperCase()
  if (upper.includes('MYMEMORY') || upper.includes('TOO MANY REQUESTS') || upper.includes('QUERY LENGTH LIMIT')) {
    throw new Error(`Invalid API response (rate limit or error text): ${raw.slice(0, 120)}`)
  }

  let out = showInterpolations(raw)
  const t = text.trim()
  // Réponses complètement hors sujet (ex. texte médical) pour des libellés courts type « L'association ».
  if (t.length > 0 && t.length < 40 && out.length > 120) {
    throw new Error(
      `Refusing to cache: translation too long for short UI string (${JSON.stringify(t.slice(0, 50))} → ${out.slice(0, 100)}…)`
    )
  }
  const needed = requiredPlaceholders(text)
  for (const ph of needed) {
    if (!out.includes(ph)) {
      out = `${out} ${ph}`.trim()
    }
  }

  cache[text] = out
  saveCache(cache)
  return out
}

async function walk (val, cache, stats) {
  if (typeof val === 'string') {
    stats.strings += 1
    process.stderr.write(`\rTranslating… ${stats.strings}`)
    return translateFrToPt(val, cache)
  }
  if (Array.isArray(val)) {
    const out = []
    for (const item of val) {
      out.push(await walk(item, cache, stats))
    }
    return out
  }
  if (val !== null && typeof val === 'object') {
    const out = {}
    for (const k of Object.keys(val)) {
      out[k] = await walk(val[k], cache, stats)
    }
    return out
  }
  return val
}

const fr = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'fr.json'), 'utf8'))
const cache = loadCache()
const stats = { strings: 0 }
const pt = await walk(fr, cache, stats)
writeFileSync(join(root, 'src', 'i18n', 'pt.json'), `${JSON.stringify(pt, null, 2)}\n`, 'utf8')
console.error(`\nDone. Wrote src/i18n/pt.json (${stats.strings} strings). Cache: ${CACHE_FILE}`)
