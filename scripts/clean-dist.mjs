/**
 * Supprime dist/ avant le build (évite ENOTEMPTY du rmSync de Vite sur FS cloud).
 */
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

const maxAttempts = 12
const baseDelayMs = 100

async function main () {
  if (!existsSync(dist)) return

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await rm(dist, { recursive: true, force: true })
      return
    } catch (e) {
      const code = e && e.code
      const retriable =
        code === 'ENOTEMPTY' ||
        code === 'EBUSY' ||
        code === 'EPERM' ||
        code === 'EACCES' ||
        code === 'EMFILE'
      if (retriable && i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)))
        continue
      }
      throw e
    }
  }
}

main().catch((err) => {
  console.error('clean-dist: impossible de supprimer dist/')
  console.error(err)
  process.exit(1)
})
