import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildStandardFilename, slugify } from '../../src/utils/factureFilename.js'

describe('factureFilename', () => {
  it('builds standard FAC filename with PEN', () => {
    const name = buildStandardFilename({
      expense_date: '2026-09-29',
      reference: 'AKUU-FAC-2026-0140',
      currency: 'PEN',
      amount_pen: 23,
      vendor_name: 'Charles',
      ext: '.pdf'
    })
    assert.equal(name, '2026-09-29_AKUU-FAC-2026-0140_23PEN_charles.pdf')
  })

  it('builds EUR with decimal underscore', () => {
    const name = buildStandardFilename({
      expense_date: '2026-08-27',
      reference: 'AKUU-FAC-2026-0108',
      currency: 'EUR',
      amount_eur: 319.69,
      label: 'Moniteur Atomos',
      ext: '.pdf'
    })
    assert.equal(name, '2026-08-27_AKUU-FAC-2026-0108_319_69EUR_moniteur-atomos.pdf')
  })

  it('slugify removes accents', () => {
    assert.equal(slugify('Ferretería Nauta'), 'ferreteria-nauta')
  })
})
