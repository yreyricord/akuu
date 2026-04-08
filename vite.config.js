import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, readdir, stat } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { pipeline } from 'stream/promises'

/**
 * Vite uses fs.copyFileSync for public/ → dist/, which can throw ETIMEDOUT on macOS when the
 * project lives under iCloud Drive / cloud-synced paths. Streamed copy avoids that path.
 */
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
    // Ne pas pré-bundler ces librairies : web-ifc charge son propre WASM,
    // web-ifc-three importe web-ifc dynamiquement et écraserait l'analyse esbuild
    exclude: ['web-ifc-three', 'web-ifc']
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    // Déléguer la copie de public/ au plugin copy-public-resilient (évite ETIMEDOUT sur FS cloud).
    copyPublicDir: false,
    // web-ifc-three produit un chunk > 500 kB (normal pour l’IFC) ; évite un avertissement trompeur
    chunkSizeWarningLimit: 3500,
    // Ne pas recalculer gzip sur chaque fichier en fin de build (un peu plus rapide, logs plus clairs)
    reportCompressedSize: false
  }
})
