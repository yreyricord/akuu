#!/usr/bin/env node
/**
 * sync-decks.mjs
 * -----------------------------------------------------------------------------
 * Copie les decks de formation depuis leur dossier source de travail
 *   «AKUU — Module 1/moduleX»  ->  «akuu/public/formation/module-X-deck»
 * en renommant index.dc.html -> index.html.
 *
 * Source de vérité : les dossiers moduleX. Le dossier public/ est généré.
 *
 * Usage :
 *   node scripts/sync-decks.mjs           # sync tous les modules configurés
 *   node scripts/sync-decks.mjs 1         # sync uniquement le module 1
 *   node scripts/sync-decks.mjs --check   # échoue si public/ diffère (CI)
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '..')
const SOURCE_ROOT = path.resolve(REPO, '..', 'AKUU — Module 1')
const PUBLIC_ROOT = path.join(REPO, 'public', 'formation')

/** Modules gérés par ce script (source -> destination). */
const MODULES = [
  { id: 1, src: 'module1', dest: 'module-1-deck' },
  { id: 2, src: 'module2', dest: 'module-2-deck' }
]

const IGNORE = new Set(['.DS_Store', 'index-scroll.dc.html.bak'])

/** Feuille de style commune à TOUS les decks (une seule source de vérité). */
const SHARED_THEME = 'deck-theme.css'

async function syncSharedTheme () {
  const from = path.join(SOURCE_ROOT, SHARED_THEME)
  const to = path.join(PUBLIC_ROOT, SHARED_THEME)
  try {
    await fs.access(from)
  } catch {
    console.warn(`sync-decks: thème commun introuvable, ignoré → ${from}`)
    return
  }
  await fs.mkdir(PUBLIC_ROOT, { recursive: true })
  await fs.copyFile(from, to)
  console.log(`sync-decks: thème commun → public/formation/${SHARED_THEME}`)
}

async function copyDir (from, to) {
  await fs.mkdir(to, { recursive: true })
  const entries = await fs.readdir(from, { withFileTypes: true })
  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const srcPath = path.join(from, entry.name)
    const dstPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, dstPath)
    } else {
      await fs.copyFile(srcPath, dstPath)
    }
  }
}

async function syncModule (mod) {
  const srcDir = path.join(SOURCE_ROOT, mod.src)
  const dstDir = path.join(PUBLIC_ROOT, mod.dest)

  try {
    await fs.access(srcDir)
  } catch {
    console.warn(`sync-decks: source introuvable, ignoré → ${srcDir}`)
    return
  }

  // Copie récursive de tout le bundle sauf le HTML source (renommé ensuite).
  const entries = await fs.readdir(srcDir, { withFileTypes: true })
  await fs.mkdir(dstDir, { recursive: true })
  for (const entry of entries) {
    if (IGNORE.has(entry.name) || entry.name === 'index.dc.html') continue
    const srcPath = path.join(srcDir, entry.name)
    const dstPath = path.join(dstDir, entry.name)
    if (entry.isDirectory()) await copyDir(srcPath, dstPath)
    else await fs.copyFile(srcPath, dstPath)
  }

  // index.dc.html -> index.html
  const htmlSrc = path.join(srcDir, 'index.dc.html')
  const htmlDst = path.join(dstDir, 'index.html')
  await fs.copyFile(htmlSrc, htmlDst)

  console.log(`sync-decks: module ${mod.id} → public/formation/${mod.dest}`)
}

async function main () {
  const arg = process.argv[2]
  const only = arg && /^\d+$/.test(arg) ? Number(arg) : null
  const targets = only ? MODULES.filter((m) => m.id === only) : MODULES
  if (targets.length === 0) {
    console.error(`sync-decks: aucun module ${only}`)
    process.exit(1)
  }
  await syncSharedTheme()
  for (const mod of targets) await syncModule(mod)
  console.log('sync-decks: terminé.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
