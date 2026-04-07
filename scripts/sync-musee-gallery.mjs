/**
 * Regénère src/data/musee-gallery.json à partir des fichiers
 * public/images/musee/galerie-musee-<n>.<ext> (tri numérique).
 * Exécuté au build (prebuild) ; lancez aussi `npm run musee:gallery` après ajout de photos.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, '../public/images/musee')
const out = path.join(__dirname, '../src/data/musee-gallery.json')

function galleryIndex(name) {
  const m = name.match(/^galerie-musee-(\d+)\./i)
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER
}

if (!fs.existsSync(dir)) {
  console.warn('sync-musee-gallery: dossier absent', dir)
  fs.writeFileSync(out, '[]\n')
  process.exit(0)
}

const files = fs
  .readdirSync(dir)
  .filter((f) => /^galerie-musee-\d+\./i.test(f))
  .sort((a, b) => galleryIndex(a) - galleryIndex(b) || a.localeCompare(b))

const urls = files.map((f) => `/images/musee/${f}`)
fs.writeFileSync(out, JSON.stringify(urls, null, 2) + '\n')
console.log(`sync-musee-gallery: ${urls.length} image(s) → ${path.relative(process.cwd(), out)}`)
