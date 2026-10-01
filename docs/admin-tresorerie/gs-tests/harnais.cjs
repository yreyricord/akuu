const fs = require('fs'); const vm = require('vm'); const crypto = require('crypto')
class Sheet { constructor(name, rows = []) { this.name = name; this.rows = rows.map(r => [...r]); this.protections = [] }
  getName() { return this.name } setName(n) { this.name = n; return this }
  getDataRange() { const s = this; return { getValues: () => s.rows.map(r => [...r]) } }
  getLastRow() { return this.rows.length } getLastColumn() { return Math.max(0, ...this.rows.map(r => r.length)) }
  appendRow(r) { this.rows.push([...r]) } deleteRow(i) { this.rows.splice(i - 1, 1) } setFrozenRows() {} clear() { this.rows = [] }
  getProtections(type) { return this.protections.filter(p => p.type === type) }
  protect() {
    const sheet = this
    const p = { type: 'sheet', desc: '', warningOnly: true, editors: ['editor@test'] }
    p.remove = () => { sheet.protections = sheet.protections.filter(x => x !== p) }
    p.setDescription = (d) => { p.desc = d; return p }
    p.setWarningOnly = (w) => { p.warningOnly = w; return p }
    p.removeEditors = () => p
    p.getEditors = () => p.editors
    p.addEditor = () => p
    p.getDescription = () => p.desc
    this.protections.push(p)
    return p
  }
  getRange(r, c, nr = 1, nc = 1) { const s = this; return { getValues: () => s.rows.slice(r - 1, r - 1 + nr).map(x => x.slice(c - 1, c - 1 + nc)),
    setValues: v => v.forEach((row, i) => row.forEach((x, j) => { if (!s.rows[r - 1 + i]) s.rows[r - 1 + i] = []; s.rows[r - 1 + i][c - 1 + j] = x })), setValue: x => { s.rows[r - 1][c - 1] = x }, setFontWeight() { return this } } } }
class SS { constructor(id) { this.id = id; this.sheets = [] } getSheetByName(n) { return this.sheets.find(s => s.name === n) || null }
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s } getSheets() { return this.sheets } getUrl() { return 'u' } getId() { return this.id } }
const app = new SS('APP')
const journal = new SS('J')
const cache = new Map(); const props = { ADMIN_EMAIL: 'admin@akuu', TREASURER_1: 'treso@akuu', JWT_SECRET: 's3cret', ROOT_FOLDER_ID: 'ROOT', SPREADSHEET_ID: 'APP', JOURNAL_SHEET_2026: 'J',
  WHITELIST_JSON: JSON.stringify([{ email: 'benevole@akuu', role: 'benevole', name: 'Béné Vole' }, { email: 'b2@akuu', role: 'benevole', name: 'B Deux' }]), INITIAL_PASSWORD: 'AKUU-Init-2026!' }
const files = []; const mails = []
const dirs = new Set(['ROOT'])
function folder(path) {
  dirs.add(path)
  return {
    getFoldersByName: n => {
      const cp = path + '/' + n; let d = false
      return { hasNext: () => !d && dirs.has(cp), next: () => { d = true; return folder(cp) } }
    },
    createFolder: n => { const cp = path + '/' + n; dirs.add(cp); return folder(cp) },
    setName: n => { dirs.delete(path); dirs.add(path.replace(/\/[^/]+$/, '') + '/' + n) },
    getId: () => path, getUrl: () => 'https://drive/folder' + path,
    getFilesByName: n => {
      const f = files.filter(x => x.path === path && x.name === n && !x.t); let i = 0
      return { hasNext: () => i < f.length, next: () => { const x = f[i++]; return {
        setTrashed: () => { x.t = true }, setName: (nn) => { x.name = nn },
        getBlob: () => blob(x.bytes || [1], 'application/octet-stream', x.name)
      } } }
    },
    createFile: (b) => { const x = { path, name: b.getName ? b.getName() : b.name, id: 'F' + files.length, bytes: b.getBytes ? b.getBytes() : [] }; files.push(x); return { getUrl: () => 'https://drive/' + x.id, getId: () => x.id, getName: () => x.name, getBlob: () => blob(x.bytes || [1], b.getContentType ? b.getContentType() : 'application/octet-stream', x.name) } },
    getFiles: () => {
      const list = files.filter(x => x.path === path && !x.t)
      let i = 0
      return { hasNext: () => i < list.length, next: () => { const x = list[i++]; return { getName: () => x.name, getBlob: () => blob(x.bytes || [1], 'application/octet-stream', x.name), setTrashed: () => { x.t = true } } } }
    },
  }
}
function blob(bytes, mime, name) { return { bytes, mime, name, getName() { return this.name }, setName(n) { this.name = n; return this }, copyBlob() { return blob(this.bytes, this.mime, this.name) }, getBytes() { return this.bytes }, getContentType() { return this.mime } } }
const ctx = { console, Math, JSON, Date, Number, String, isNaN, Object, Array, encodeURIComponent,
  SpreadsheetApp: {
    openById: (id) => id === 'J' ? journal : app,
    create: (name) => { const ss = new (journal.constructor)('TMP_' + name); ss.insertSheet('Sheet1'); return ss },
    flush() {},
    ProtectionType: { SHEET: 'sheet' }
  },
  ScriptApp: { getOAuthToken: () => 'test-oauth-token' },
  HtmlService: {
    createHtmlOutput: () => ({
      getAs: (mime) => blob([0x25, 0x50, 0x44, 0x46], mime || 'application/pdf', 'synthese.pdf')
    })
  },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'admin@akuu' }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v }, deleteProperty: k => { delete props[k] } }) },
  CacheService: { getScriptCache: () => ({ get: k => cache.get(k) ?? null, put: (k, v) => cache.set(k, v), remove: k => cache.delete(k) }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  DriveApp: { getFolderById: id => folder(id), getFileById: id => ({ setTrashed() { const f = files.find(x => x.id === id); if (f) f.t = true } }) },
  MailApp: { sendEmail: (to, s, b) => mails.push({ to, s, b }) },
  UrlFetchApp: {
    fetch: (u) => {
      if (String(u).indexOf('export?format=xlsx') >= 0) {
        return {
          getResponseCode: () => 200,
          getBlob: () => blob([0x50, 0x4B, 3, 4], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'export.xlsx')
        }
      }
      return { getResponseCode: () => 400, getContentText: () => '{}' }
    }
  },
  ContentService: { createTextOutput: t => ({ t, setMimeType() { return this } }), MimeType: { JSON: 'json' } },
  Utilities: { getUuid: () => crypto.randomUUID(), sleep: () => {}, base64Decode: s => [...Buffer.from(s, 'base64')].map(b => b > 127 ? b - 256 : b),
    base64Encode: b => Buffer.from(b.map ? b.map(x => (x + 256) % 256) : b).toString('base64'),
    base64EncodeWebSafe: b => Buffer.from(typeof b === 'string' ? b : b.map(x => (x + 256) % 256)).toString('base64url'),
    newBlob: (b, m, n) => blob(typeof b === 'string' ? [...Buffer.from(b)] : b, m, n),
    computeDigest: (a, s) => [...crypto.createHash('sha256').update(s).digest()],
    computeHmacSha256Signature: (v, k) => [...crypto.createHmac('sha256', Buffer.from(typeof k === 'string' ? k : k.map(x => (x + 256) % 256))).update(Buffer.from(typeof v === 'string' ? v : v.map(x => (x + 256) % 256))).digest()],
    formatDate: d => d.toISOString().slice(0, 10), DigestAlgorithm: { SHA_256: 1 }, zip: (b, n) => blob([1], 'zip', n) },
  Logger: { log: () => {} }, MimeType: {} }
vm.createContext(ctx); vm.runInContext(require('./charger-gs.cjs')(), ctx)
Object.entries(ctx.SHEET_HEADERS).forEach(([n, h]) => { const s = app.insertSheet(n); s.appendRow(h) })
app.getSheetByName('Config').appendRow(['DEM_COUNTER_2026', 0])
;['Journal', 'Detail_PM'].forEach((n) => { const sh = journal.insertSheet(n); sh.appendRow(ctx.JOURNAL_COLUMNS) })
journal.getSheetByName('Journal').appendRow(['AKUU-IMP-2026-0001', '2026-03-02', 'CB AMAZON', '', 'MUSEE', 'Dépenses par carte', 26.94, '', 'EUR', 'releve', 'depense', '', '', '', '', '', ''])
journal.getSheetByName('Journal').appendRow(['AKUU-IMP-2026-0002', '2026-03-05', 'CB DOUBLON', '', 'MUSEE', 'Dépenses par carte', 10, '', 'EUR', 'releve', 'depense', '', '', '', '', '', ''])
// comptes : mot de passe commun (état actuel prod)
;[['admin@akuu', 'admin'], ['treso@akuu', 'tresorier'], ['benevole@akuu', 'benevole'], ['b2@akuu', 'benevole']].forEach(([e, r]) =>
  app.getSheetByName('Users').appendRow([e, ctx.hashPassword_('AKUU-Init-2026!'), r, 'P', 'N', 'P N']))
ctx.getExchangeRate_ = () => ({ rate: 0.25, source: 'test', date: '2026-10-01' })
function api(path, body = {}, method = 'POST') {
  const out = ctx.handleRequest('POST', { parameter: { path }, postData: { type: 'text/plain', contents: JSON.stringify({ ...body, _method: method }) } })
  return JSON.parse(out.t)
}
module.exports = { ctx, api, app, journal, files, mails, cache, props }
