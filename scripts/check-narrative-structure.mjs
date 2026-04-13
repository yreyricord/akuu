/**
 * Compares multi-locale structure for cours-anglais-narrative.json and hydrama-narrative.json
 * (section counts, paragraph counts per section, required root keys). Locales from src/config/locales.js.
 * Run: node scripts/check-narrative-structure.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { I18N_LOCALES } from '../src/config/locales.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const locales = I18N_LOCALES

function fail (msg) {
  console.error(msg)
  process.exit(1)
}

function checkCoursAnglais (data, fileLabel) {
  const fr = data.fr
  if (!fr?.sections?.length) fail(`${fileLabel}: fr.sections missing or empty`)
  const nSec = fr.sections.length
  for (const loc of locales) {
    const block = data[loc]
    if (!block?.sections) fail(`${fileLabel}: ${loc}.sections missing`)
    if (block.sections.length !== nSec) {
      fail(`${fileLabel}: ${loc} has ${block.sections.length} sections, fr has ${nSec}`)
    }
    for (let i = 0; i < nSec; i++) {
      const ref = fr.sections[i]
      const cur = block.sections[i]
      if (typeof cur?.title !== 'string') fail(`${fileLabel}: ${loc} section[${i}].title invalid`)
      if (!Array.isArray(cur?.paragraphs)) fail(`${fileLabel}: ${loc} section[${i}].paragraphs not an array`)
      if (cur.paragraphs.length !== ref.paragraphs.length) {
        fail(
          `${fileLabel}: ${loc} section[${i}] has ${cur.paragraphs.length} paragraphs, fr has ${ref.paragraphs.length}`
        )
      }
    }
  }
}

function checkHydrama (data, fileLabel) {
  const rootKeys = ['sections', 'video_intro', 'join_title', 'join_p1']
  const fr = data.fr
  if (!fr?.sections?.length) fail(`${fileLabel}: fr.sections missing or empty`)
  for (const k of rootKeys) {
    if (!(k in fr)) fail(`${fileLabel}: fr missing key "${k}"`)
  }
  const nSec = fr.sections.length
  for (const loc of locales) {
    const block = data[loc]
    if (!block) fail(`${fileLabel}: missing locale "${loc}"`)
    for (const k of rootKeys) {
      if (!(k in block)) fail(`${fileLabel}: ${loc} missing key "${k}"`)
    }
    if (typeof block.video_intro !== 'string') fail(`${fileLabel}: ${loc}.video_intro must be string`)
    if (typeof block.join_title !== 'string') fail(`${fileLabel}: ${loc}.join_title must be string`)
    if (typeof block.join_p1 !== 'string') fail(`${fileLabel}: ${loc}.join_p1 must be string`)
    if (block.sections.length !== nSec) {
      fail(`${fileLabel}: ${loc} has ${block.sections.length} sections, fr has ${nSec}`)
    }
    for (let i = 0; i < nSec; i++) {
      const ref = fr.sections[i]
      const cur = block.sections[i]
      if (typeof cur?.title !== 'string') fail(`${fileLabel}: ${loc} section[${i}].title invalid`)
      if (!Array.isArray(cur?.paragraphs)) fail(`${fileLabel}: ${loc} section[${i}].paragraphs not an array`)
      if (cur.paragraphs.length !== ref.paragraphs.length) {
        fail(
          `${fileLabel}: ${loc} section[${i}] has ${cur.paragraphs.length} paragraphs, fr has ${ref.paragraphs.length}`
        )
      }
    }
  }
}

for (const [rel, checker] of [
  ['src/data/cours-anglais-narrative.json', checkCoursAnglais],
  ['src/data/hydrama-narrative.json', checkHydrama]
]) {
  const path = join(root, rel)
  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(`Cannot read or parse ${rel}: ${e.message}`)
  }
  for (const loc of locales) {
    if (!data[loc]) fail(`${rel}: missing locale "${loc}"`)
  }
  checker(data, rel)
}

console.log(`Narrative structure OK: cours-anglais-narrative + hydrama-narrative (${I18N_LOCALES.join('/')}).`)
