import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
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
  assetsInclude: ['**/*.wasm']
})
