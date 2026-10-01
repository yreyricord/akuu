import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** Copie public/ → dist/ en streams (évite ETIMEDOUT sur dossiers iCloud / sync cloud) */
function copyPublicDirResilient() {
  return {
    name: 'copy-public-resilient',
    apply: 'build',
    async closeBundle() {
      const publicDir = resolve(__dirname, 'public')
      const outDir = resolve(__dirname, 'dist')

      let rootStat
      try {
        rootStat = await stat(publicDir)
      } catch {
        return
      }
      if (!rootStat.isDirectory()) return

      async function walk(rel = '') {
        const absDir = join(publicDir, rel)
        const entries = await readdir(absDir, { withFileTypes: true })
        for (const entry of entries) {
          const relPath = rel ? join(rel, entry.name) : entry.name
          const from = join(publicDir, relPath)
          const to = join(outDir, relPath)
          if (entry.isDirectory()) {
            await mkdir(to, { recursive: true })
            await walk(relPath)
          } else {
            await mkdir(dirname(to), { recursive: true })
            await pipeline(createReadStream(from), createWriteStream(to))
          }
        }
      }

      await walk()
    }
  }
}

/** Dev only — proxy same-origin vers Apps Script (évite CORS localhost → script.google.com). */
function devTresorerieProxyPlugin(remoteApiUrl) {
  const remoteBase = remoteApiUrl?.trim()?.replace(/\/$/, '') || ''
  if (!remoteBase) {
    return { name: 'dev-tresorerie-proxy-stub' }
  }

  return {
    name: 'dev-tresorerie-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/tresorerie-proxy')) return next()

        const queryPart = req.url.slice('/api/tresorerie-proxy'.length)
        const targetUrl = remoteBase + (queryPart || '')

        try {
          const chunks = []
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            for await (const chunk of req) chunks.push(chunk)
          }
          const body = chunks.length ? Buffer.concat(chunks) : undefined

          const upstream = await fetch(targetUrl, {
            method: req.method || 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': req.headers['content-type'] || 'text/plain;charset=utf-8'
            },
            body
          })

          res.statusCode = upstream.status
          const contentType = upstream.headers.get('content-type')
          if (contentType) res.setHeader('Content-Type', contentType)
          res.end(await upstream.text())
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: { message: err.message ?? 'Proxy Apps Script' } }))
        }
      })
    }
  }
}

/** Dev only — écrit les relevés PDF dans RELEVES/UPLOAD_DRIVE (localhost trésorier). */
function devRelevesUploadPlugin() {
  const uploadRoot = resolve(__dirname, '../RELEVES/UPLOAD_DRIVE/3_Trésorerie')

  return {
    name: 'dev-releves-upload',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/dev/releves', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          const year = Number(body.year)
          const month = Number(body.month)
          const base64 = body.base64

          if (!year || !month || month < 1 || month > 12 || !base64) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: { message: 'year, month et base64 requis' } }))
            return
          }

          const filename = `${year}_${String(month).padStart(2, '0')}_RELEVE_PRO_AKUU.pdf`
          const destDir = join(uploadRoot, String(year), 'Documents', 'Releves_bancaires')
          await mkdir(destDir, { recursive: true })
          const destPath = join(destDir, filename)
          await writeFile(destPath, Buffer.from(base64, 'base64'))

          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: true,
              data: {
                filename,
                path: destPath,
                hint:
                  'Fichier enregistré localement. Relancez generer_bilan_site.py pour mettre à jour le bilan.'
              }
            })
          )
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: { message: err.message ?? 'Erreur upload' } }))
        }
      })
    }
  }
}


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const remoteApiUrl = env.VITE_TRESORERIE_API_URL || ''

  return {
  plugins: [vue(), copyPublicDirResilient(), devRelevesUploadPlugin(), devTresorerieProxyPlugin(remoteApiUrl)],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['@phosphor-icons/vue'],
    exclude: ['web-ifc-three', 'web-ifc']
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    emptyOutDir: false,
    copyPublicDir: false,
    chunkSizeWarningLimit: 3500,
    reportCompressedSize: false
  }
}
})
