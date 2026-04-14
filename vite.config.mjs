import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, readdir, stat } from 'fs/promises'
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

export default defineConfig({
  plugins: [vue(), copyPublicDirResilient()],
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
})
