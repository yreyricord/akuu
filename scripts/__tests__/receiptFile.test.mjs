import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getReceiptExtension,
  isAllowedReceiptFile,
  isPdfFile
} from '../../src/utils/receiptFile.js'

describe('receiptFile validation', () => {
  it('accepts common receipt extensions', () => {
    for (const name of ['facture.pdf', 'photo.jpg', 'scan.JPEG', 'recu.png', 'img.heic', 'x.webp']) {
      const file = { name, type: '' }
      assert.equal(isAllowedReceiptFile(file), true, name)
    }
  })

  it('rejects unsupported extensions', () => {
    const file = { name: 'virus.exe', type: 'application/octet-stream' }
    assert.equal(isAllowedReceiptFile(file), false)
  })

  it('detects pdf files', () => {
    assert.equal(isPdfFile({ name: 'a.pdf', type: 'application/pdf' }), true)
    assert.equal(isPdfFile({ name: 'a.jpg', type: 'image/jpeg' }), false)
  })

  it('parses extension', () => {
    assert.equal(getReceiptExtension({ name: 'scan.HEIC' }), 'heic')
  })
})
