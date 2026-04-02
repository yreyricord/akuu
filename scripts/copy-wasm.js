import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wasmSrc = resolve(__dirname, '../node_modules/web-ifc')
const wasmDest = resolve(__dirname, '../public/wasm')

if (!existsSync(wasmSrc)) {
  console.warn('⚠️  web-ifc not found in node_modules — skipping WASM copy')
  process.exit(0)
}

mkdirSync(wasmDest, { recursive: true })

const files = ['web-ifc.wasm', 'web-ifc-mt.wasm']
let copied = 0

for (const file of files) {
  const src = `${wasmSrc}/${file}`
  const dest = `${wasmDest}/${file}`
  if (existsSync(src)) {
    copyFileSync(src, dest)
    console.log(`✅ Copied ${file} → /public/wasm/`)
    copied++
  } else {
    console.warn(`⚠️  ${file} not found in web-ifc — skipping`)
  }
}

if (copied > 0) {
  console.log(`\n✅ WASM files ready in /public/wasm/ (${copied} file${copied > 1 ? 's' : ''})`)
} else {
  console.warn('\n⚠️  No WASM files were copied')
}
