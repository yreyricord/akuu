/**
 * Unit tests for build scripts — zero external dependencies.
 * Run: node --test scripts/__tests__/build-scripts.test.mjs
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

import { flatten, diffLocales } from '../lib/i18n-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const scriptsDir = join(__dirname, '..')
const rootDir = join(scriptsDir, '..')

// ─────────────────────────────────────────────────────────────
// i18n utils
// ─────────────────────────────────────────────────────────────

describe('flatten()', () => {
  test('flat object produces single-level keys', () => {
    const result = flatten({ a: '1', b: '2' })
    assert.deepEqual([...result].sort(), ['a', 'b'])
  })

  test('nested object produces dot-notation keys', () => {
    const result = flatten({ hero: { title: 'Hi', subtitle: 'World' } })
    assert.deepEqual([...result].sort(), ['hero.subtitle', 'hero.title'])
  })

  test('deeply nested produces full dot path', () => {
    const result = flatten({ a: { b: { c: 'leaf' } } })
    assert.deepEqual([...result], ['a.b.c'])
  })

  test('array values produce a leaf key (not expanded)', () => {
    const result = flatten({ list: ['x', 'y'] })
    assert.deepEqual([...result], ['list'])
  })

  test('null value produces a leaf key', () => {
    const result = flatten({ key: null })
    assert.deepEqual([...result], ['key'])
  })

  test('mixed nested and flat keys', () => {
    const result = flatten({ top: 'val', nested: { inner: 'val2' } })
    assert.deepEqual([...result].sort(), ['nested.inner', 'top'])
  })

  test('empty object produces empty set', () => {
    const result = flatten({})
    assert.equal(result.size, 0)
  })
})

describe('diffLocales()', () => {
  test('identical sets produce no diffs', () => {
    const base = new Set(['a', 'b', 'c'])
    const other = new Set(['a', 'b', 'c'])
    const { onlyInBase, onlyInOther } = diffLocales(base, other)
    assert.deepEqual(onlyInBase, [])
    assert.deepEqual(onlyInOther, [])
  })

  test('extra key in base is detected', () => {
    const base = new Set(['a', 'b', 'extra'])
    const other = new Set(['a', 'b'])
    const { onlyInBase, onlyInOther } = diffLocales(base, other)
    assert.deepEqual(onlyInBase, ['extra'])
    assert.deepEqual(onlyInOther, [])
  })

  test('extra key in other is detected', () => {
    const base = new Set(['a', 'b'])
    const other = new Set(['a', 'b', 'extra'])
    const { onlyInBase, onlyInOther } = diffLocales(base, other)
    assert.deepEqual(onlyInBase, [])
    assert.deepEqual(onlyInOther, ['extra'])
  })

  test('results are sorted', () => {
    const base = new Set(['z', 'a', 'm'])
    const other = new Set([])
    const { onlyInBase } = diffLocales(base, other)
    assert.deepEqual(onlyInBase, ['a', 'm', 'z'])
  })
})

// ─────────────────────────────────────────────────────────────
// check-i18n-parity.mjs integration
// ─────────────────────────────────────────────────────────────

describe('check-i18n-parity.mjs', () => {
  const fixtureDir = join(rootDir, 'src', 'i18n')

  test('exits 0 when fr / en / es keys match', () => {
    // The real locale files must pass parity — this is the canonical check
    const result = execSync(`node ${join(scriptsDir, 'check-i18n-parity.mjs')}`, {
      encoding: 'utf8',
    })
    assert.match(result, /i18n key parity OK/)
  })

  test('exits non-zero when a locale has missing keys', () => {
    // Write a temp broken locale file
    const tmpDir = join(rootDir, 'src', 'i18n-test-tmp')
    mkdirSync(tmpDir, { recursive: true })
    try {
      const fr = { hero: { title: 'Bonjour', subtitle: 'Monde' } }
      const en = { hero: { title: 'Hello' } }  // missing subtitle
      const es = { hero: { title: 'Hola', subtitle: 'Mundo' } }
      writeFileSync(join(tmpDir, 'fr.json'), JSON.stringify(fr))
      writeFileSync(join(tmpDir, 'en.json'), JSON.stringify(en))
      writeFileSync(join(tmpDir, 'es.json'), JSON.stringify(es))

      // Run a modified parity check against our tmp dir
      const script = `
        import { readFileSync } from 'node:fs'
        import { flatten, diffLocales } from '${join(scriptsDir, 'lib/i18n-utils.mjs')}'
        const sets = {}
        for (const loc of ['fr', 'en', 'es']) {
          sets[loc] = flatten(JSON.parse(readFileSync('${tmpDir}/' + loc + '.json', 'utf8')))
        }
        const { onlyInBase, onlyInOther } = diffLocales(sets.fr, sets.en)
        if (onlyInBase.length || onlyInOther.length) process.exit(1)
        process.exit(0)
      `
      let exitCode = 0
      try {
        execSync(`node --input-type=module`, { input: script, encoding: 'utf8' })
      } catch (e) {
        exitCode = e.status
      }
      assert.equal(exitCode, 1, 'Should fail when en is missing hero.subtitle')
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})

// ─────────────────────────────────────────────────────────────
// generate-seo-files.mjs
// ─────────────────────────────────────────────────────────────

describe('generate-seo-files.mjs', () => {
  test('generates valid sitemap.xml with correct base URL', () => {
    const testUrl = 'https://test.example.com'
    execSync(`node ${join(scriptsDir, 'generate-seo-files.mjs')}`, {
      env: { ...process.env, VITE_SITE_URL: testUrl },
    })
    const sitemap = readFileSync(join(rootDir, 'public', 'sitemap.xml'), 'utf8')
    assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org/)
    assert.match(sitemap, new RegExp(`<loc>${testUrl}/</loc>`))
    assert.match(sitemap, new RegExp(`<loc>${testUrl}/contact</loc>`))
    assert.match(sitemap, /<priority>1\.0<\/priority>/)
    assert.match(sitemap, /<changefreq>weekly<\/changefreq>/)
  })

  test('generates valid robots.txt pointing to sitemap', () => {
    const testUrl = 'https://test.example.com'
    execSync(`node ${join(scriptsDir, 'generate-seo-files.mjs')}`, {
      env: { ...process.env, VITE_SITE_URL: testUrl },
    })
    const robots = readFileSync(join(rootDir, 'public', 'robots.txt'), 'utf8')
    assert.match(robots, /User-agent: \*/)
    assert.match(robots, /Allow: \//)
    assert.match(robots, new RegExp(`Sitemap: ${testUrl}/sitemap.xml`))
  })

  test('strips trailing slash from base URL', () => {
    execSync(`node ${join(scriptsDir, 'generate-seo-files.mjs')}`, {
      env: { ...process.env, VITE_SITE_URL: 'https://www.akuu.org/' },
    })
    const sitemap = readFileSync(join(rootDir, 'public', 'sitemap.xml'), 'utf8')
    // Should not have double slash: //association
    assert.doesNotMatch(sitemap, /akuu\.org\/\//)
  })

  test('falls back to akuu.org when VITE_SITE_URL is unset', () => {
    const env = { ...process.env }
    delete env.VITE_SITE_URL
    execSync(`node ${join(scriptsDir, 'generate-seo-files.mjs')}`, { env })
    const robots = readFileSync(join(rootDir, 'public', 'robots.txt'), 'utf8')
    assert.match(robots, /https:\/\/www\.akuu\.org\/sitemap\.xml/)
  })

  test('sitemap includes all 12 expected routes', () => {
    execSync(`node ${join(scriptsDir, 'generate-seo-files.mjs')}`, {
      env: { ...process.env, VITE_SITE_URL: 'https://www.akuu.org' },
    })
    const sitemap = readFileSync(join(rootDir, 'public', 'sitemap.xml'), 'utf8')
    const routes = [
      '/', '/association', '/projets', '/musee-shapishiko',
      '/volontaires', '/soutenir', '/contact', '/hydrama',
      '/akuuvision', '/cours-anglais', '/casa-akuu', '/gestion-dechets',
    ]
    for (const route of routes) {
      const loc = route === '/' ? 'https://www.akuu.org/' : `https://www.akuu.org${route}`
      assert.match(sitemap, new RegExp(`<loc>${loc}</loc>`), `Missing route: ${route}`)
    }
  })
})
