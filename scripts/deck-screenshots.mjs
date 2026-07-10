#!/usr/bin/env node
/**
 * deck-screenshots.mjs
 * -----------------------------------------------------------------------------
 * QA visuelle : capture chaque slide d'un deck de formation en PNG, pour
 * détecter les régressions. Démarre un petit serveur statique sur public/,
 * puis pilote Chrome en headless (une capture par slide via le hash #N).
 *
 * Usage :
 *   node scripts/deck-screenshots.mjs                 # tous les decks
 *   node scripts/deck-screenshots.mjs module-1-deck   # un seul deck
 *
 * Sorties : docs/deck-shots/<deck>/NN.png
 * Chrome : défini par $CHROME_BIN, sinon chemins macOS/Linux usuels.
 */
import { promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileP = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '..')
const PUBLIC = path.join(REPO, 'public')
const FORMATION = path.join(PUBLIC, 'formation')
const OUT_ROOT = path.join(REPO, 'docs', 'deck-shots')

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
].filter(Boolean)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
}

async function findChrome () {
  for (const c of CHROME_CANDIDATES) {
    try { await fs.access(c); return c } catch { /* next */ }
  }
  throw new Error('Chrome introuvable. Définissez $CHROME_BIN.')
}

function startServer () {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
      let filePath = path.join(PUBLIC, urlPath)
      const stat = await fs.stat(filePath).catch(() => null)
      if (stat && stat.isDirectory()) filePath = path.join(filePath, 'index.html')
      const data = await fs.readFile(filePath)
      res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream')
      res.end(data)
    } catch {
      res.statusCode = 404
      res.end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function countSlides (deck) {
  const html = await fs.readFile(path.join(FORMATION, deck, 'index.html'), 'utf8')
  return (html.match(/<section\b/g) || []).length
}

async function shootDeck (chrome, port, deck) {
  const total = await countSlides(deck)
  const outDir = path.join(OUT_ROOT, deck)
  await fs.mkdir(outDir, { recursive: true })
  console.log(`\n${deck} — ${total} slides`)
  for (let i = 1; i <= total; i++) {
    const url = `http://127.0.0.1:${port}/formation/${deck}/index.html#${i}`
    const out = path.join(outDir, String(i).padStart(2, '0') + '.png')
    await execFileP(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--window-size=1600,900', '--virtual-time-budget=3500',
      `--screenshot=${out}`, url
    ]).catch((e) => console.warn(`  slide ${i}: ${e.message}`))
    process.stdout.write(`\r  captured ${i}/${total}`)
  }
  process.stdout.write('\n')
}

async function main () {
  const chrome = await findChrome()
  const arg = process.argv[2]
  const decks = arg
    ? [arg]
    : (await fs.readdir(FORMATION, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && d.name.endsWith('-deck'))
        .map((d) => d.name)

  const { server, port } = await startServer()
  try {
    for (const deck of decks) await shootDeck(chrome, port, deck)
  } finally {
    server.close()
  }
  console.log(`\nOK → ${path.relative(REPO, OUT_ROOT)}/<deck>/NN.png`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
