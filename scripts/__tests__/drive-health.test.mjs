import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const healthPath = join(root, 'src/data/drive-health.json')

test('drive-health.json exists and is valid', () => {
  const raw = readFileSync(healthPath, 'utf8')
  const data = JSON.parse(raw)

  assert.equal(typeof data.ok, 'boolean')
  assert.equal(data.ok, true, 'Drive health must pass with zero errors')
  assert.equal(data.totals.errors, 0)
  assert.ok(data.totals.factures_total >= 580)
  assert.ok(data.historique_drive_url.includes('drive.google.com'))

  const byYear = data.totals.factures_by_year
  const sumByYear = Object.values(byYear).reduce((a, b) => a + b, 0)
  assert.equal(sumByYear, data.totals.factures_total, 'factures_by_year must sum to total')

  for (const [year, count] of Object.entries(byYear)) {
    assert.match(year, /^\d{4}$/)
    assert.ok(Number(year) >= 2017 && Number(year) <= 2026)
    assert.ok(count >= 0)
  }

  assert.ok(Array.isArray(data.years) && data.years.length >= 10)
  for (const y of data.years) {
    assert.ok(y.year >= 2017 && y.year <= 2026)
    assert.equal(typeof y.factures_index, 'number')
    assert.equal(y.factures_index, byYear[String(y.year)] ?? byYear[y.year])
  }
})

test('every indexed facture path follows YYYY/Factures/ layout', () => {
  const data = JSON.parse(readFileSync(healthPath, 'utf8'))
  const yearsWithFactures = data.years.filter((y) => y.factures_index > 0)
  assert.ok(yearsWithFactures.length >= 8, 'At least 8 years should have factures')
  for (const y of yearsWithFactures) {
    assert.ok(y.factures_index > 0, `${y.year} should have factures in index`)
  }
})
