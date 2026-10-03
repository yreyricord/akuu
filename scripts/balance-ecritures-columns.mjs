/**
 * Méthode d'équilibre colonnes — Compta Écritures
 *
 * 1. Contenu typique (rem) : largeur minimale utile par colonne
 * 2. Gaspillage = max(0, largeur - contenuTypique) / largeur
 * 3. Pénalité troncature = ratio cellules où scrollWidth > clientWidth
 * 4. Score = 100 - (gaspillage moyen × 40) - (troncature × 60)
 *
 * Variantes testées → screenshot + score DOM → variante retenue
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../.screenshots/balance')
const BASE = process.env.BALANCE_BASE || 'http://127.0.0.1:5174'

/** Largeur utile estimée (rem → px @ 16px) */
const CONTENT_NEED_REM = {
  date: 2.5,
  source: 3.5,
  label: 11,
  project: 9,
  payment: 7,
  amounts: 6.5,
  actions: 3.5
}

const VARIANTS = {
  current: { date: 2.5, source: 2.25, label: 10, project: 9.5, payment: 11.5, amounts: 5.75, actions: 4 },
  user: { date: 2.75, source: 3.75, label: 13, project: 10, payment: 8, amounts: 7, actions: 4 },
  balanced: { date: 2.75, source: 4, label: 13.5, project: 10, payment: 7.75, amounts: 7.25, actions: 4 },
  final: { date: 2.75, source: 4, label: 14, project: 10, payment: 7.5, amounts: 7.25, actions: 4 }
}

/** Score : gaspillage + troncature + règles métier (paiement ≤ projet, orig ≥ 3.5, libellé ≥ 12) */
function scoreVariant(widths, measurements) {
  let wasteSum = 0
  let n = 0
  for (const [key, wRem] of Object.entries(widths)) {
    const need = CONTENT_NEED_REM[key] ?? wRem
    wasteSum += Math.max(0, wRem - need) / wRem
    n += 1
  }
  const wasteAvg = wasteSum / n
  const truncRatio = measurements.truncated / Math.max(measurements.cells, 1)
  let score = 100 - wasteAvg * 35 - truncRatio * 55
  if (widths.payment > widths.project) score -= (widths.payment - widths.project) * 10
  if (widths.source < 3.5) score -= 8
  if (widths.label < 12) score -= 10
  if (widths.amounts < 6.75) score -= 6
  if (widths.label >= 13) score += 4
  if (widths.source >= 3.75) score += 3
  return Math.round(score)
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: 'Email' }).fill('tresorier@demo.akuu.fr')
  await page.getByRole('textbox', { name: /Mot de passe/ }).fill('demo-akuu-2026')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL((u) => !u.pathname.includes('login'), { timeout: 15000 })
  await page.goto(`${BASE}/admin?module=tresorerie&tab=compta`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Écritures', exact: true }).click()
  await page.waitForSelector('.admin-table tbody tr')
}

async function applyWidths(page, widths) {
  await page.evaluate((w) => {
    const map = {
      date: 0, source: 1, label: 2, project: 3, payment: 4, amounts: 5, url: 6
    }
    const table = document.querySelector('.admin-table')
    if (!table) return
    const headers = table.querySelectorAll('thead th')
    const rows = table.querySelectorAll('tbody tr')
    for (const [key, rem] of Object.entries(w)) {
      const idx = key === 'actions' ? map.url : map[key]
      if (idx == null) continue
      const px = `${rem * 16}px`
      headers[idx]?.style.setProperty('width', px, 'important')
      headers[idx]?.style.setProperty('max-width', px, 'important')
      rows.forEach((row) => {
        const cell = row.children[idx]
        if (cell) {
          cell.style.setProperty('width', px, 'important')
          cell.style.setProperty('max-width', px, 'important')
        }
      })
    }
  }, widths)
}

async function measure(page) {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('.admin-table tbody td')]
    let truncated = 0
    for (const cell of cells) {
      const overflow = [...cell.querySelectorAll('p, span, select')].some(
        (el) => el.scrollWidth > el.clientWidth + 1
      )
      if (overflow || cell.scrollWidth > cell.clientWidth + 1) truncated += 1
    }
    return { cells: cells.length, truncated }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(page)

  const results = []
  for (const [name, widths] of Object.entries(VARIANTS)) {
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Écritures', exact: true }).click()
    await page.waitForSelector('.admin-table tbody tr')
    await applyWidths(page, widths)
    await page.waitForTimeout(300)
    const measurements = await measure(page)
    const score = scoreVariant(widths, measurements)
    const shot = path.join(OUT, `${name}.png`)
    await page.locator('.admin-table-wrap').screenshot({ path: shot })
    results.push({ name, widths, score, ...measurements })
  }

  results.sort((a, b) => b.score - a.score)
  const winner = results[0]
  await writeFile(path.join(OUT, 'report.json'), JSON.stringify({ method: 'waste+truncation score', results, winner }, null, 2))
  console.log(JSON.stringify({ winner: winner.name, score: winner.score, widths: winner.widths, results }, null, 2))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
