<template>
  <div class="musee-plan-viewer">

    <!-- Barre d'onglets -->
    <div class="flex flex-wrap gap-2 mb-6 justify-center">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
        :class="activeTab === tab.id
          ? 'bg-forest text-white shadow-md'
          : 'bg-white text-night/60 border border-night/10 hover:border-forest/40 hover:text-forest'"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
          v-html="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Croquis environnement -->
    <div v-show="activeTab === 'croquis'">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-night/5">
        <div class="bg-night/3 px-6 py-3 border-b border-night/8 flex items-center gap-2">
          <svg class="w-4 h-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <span class="text-sm font-semibold text-night/70">Croquis d'implantation — musée dans son environnement</span>
        </div>
        <div class="p-4 bg-stone-50">
          <img
            src="/images/musee/musee_1.jpg"
            alt="Croquis d'implantation du Musée Shapishiko dans son environnement"
            class="w-full h-auto rounded-xl object-contain"
            style="max-height: 620px;"
          />
        </div>
      </div>
    </div>

    <!-- Coupe programmatique -->
    <div v-show="activeTab === 'coupe'">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-night/5">
        <div class="bg-night/3 px-6 py-3 border-b border-night/8 flex items-center gap-2">
          <svg class="w-4 h-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          <span class="text-sm font-semibold text-night/70">Coupe programmatique — organisation intérieure</span>
        </div>
        <div class="p-4 bg-stone-50">
          <img
            src="/images/musee/coupe_musee_progra.jpg"
            alt="Coupe programmatique du Musée Shapishiko — organisation intérieure"
            class="w-full h-auto rounded-xl object-contain"
            style="max-height: 620px;"
          />
        </div>
      </div>
    </div>

    <!-- Rendus Lumion -->
    <div v-show="activeTab === 'lumion'">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-night/5">
        <div class="bg-night/3 px-6 py-3 border-b border-night/8 flex items-center gap-2">
          <svg class="w-4 h-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <span class="text-sm font-semibold text-night/70">Rendus 3D — visualisations du projet</span>
        </div>
        <div class="p-4 bg-stone-50 grid grid-cols-1 gap-4">
          <img
            v-for="img in lumionImages"
            :key="img.src"
            :src="img.src"
            :alt="img.alt"
            class="w-full h-auto rounded-xl object-cover shadow-sm"
          />
        </div>
      </div>
    </div>

    <!-- Modèle 3D -->
    <div v-show="activeTab === '3d'">
      <div
        class="rounded-2xl overflow-hidden shadow-xl relative"
        style="height: 620px; background: #1B2A21;"
      >
        <!-- Idle : invitation à charger -->
        <div v-if="ifcState === 'idle'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
            <svg class="w-8 h-8 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <p class="text-lg font-serif font-bold text-white mb-1">Modèle 3D interactif</p>
          <p class="text-sm text-white/50 mb-5">Navigation libre dans le modèle ArchiCAD</p>
          <button
            @click="initIFC"
            class="inline-flex items-center gap-2 bg-leaf text-night font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-leaf/90 transition"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Charger le modèle
          </button>
        </div>

        <!-- Loading -->
        <div v-if="ifcState === 'loading'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div class="w-12 h-12 border-4 border-white/20 border-t-leaf rounded-full animate-spin mb-5" />
          <p class="text-sm font-semibold text-white/80">Chargement du modèle 3D...</p>
          <p class="text-xs text-white/40 mt-1.5">Cela peut prendre quelques secondes</p>
        </div>

        <!-- Fichier IFC manquant -->
        <div v-if="ifcState === 'missing'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
            <svg class="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">Fichier IFC introuvable</p>
          <p class="text-sm text-white/50 leading-relaxed max-w-sm">
            Déposez <code class="bg-white/10 px-1.5 py-0.5 rounded text-leaf">plan_akuu.ifc</code>
            dans <code class="bg-white/10 px-1.5 py-0.5 rounded text-leaf">/public/</code>
          </p>
        </div>

        <!-- Erreur de chargement/parsing -->
        <div v-if="ifcState === 'parse-error'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
            <svg class="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">Erreur de chargement</p>
          <p class="text-sm text-white/50 leading-relaxed max-w-sm mb-4">Le fichier IFC a été trouvé mais n'a pas pu être analysé.</p>
          <code v-if="ifcError" class="text-xs bg-white/10 px-3 py-2 rounded-lg text-amber-300 max-w-sm break-all">{{ ifcError }}</code>
        </div>

        <!-- WebGL non supporté -->
        <div v-if="ifcState === 'webgl-error'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
            <svg class="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">Navigateur non compatible</p>
          <p class="text-sm text-white/50">Le rendu 3D requiert WebGL. Essayez Chrome ou Firefox à jour.</p>
        </div>

        <!-- Canvas Three.js -->
        <canvas ref="ifcCanvas" class="w-full h-full block" />

        <!-- Contrôles flottants (chargé) -->
        <template v-if="ifcState === 'loaded'">
          <div class="absolute top-4 right-4 flex flex-col gap-2">
            <button
              @click="resetCamera"
              class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs px-3 py-2 rounded-xl backdrop-blur transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Recentrer
            </button>
            <button
              @click="toggleWireframe"
              class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs px-3 py-2 rounded-xl backdrop-blur transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              {{ wireframe ? 'Vue solide' : 'Vue filaire' }}
            </button>
          </div>

          <!-- Légende -->
          <div class="absolute bottom-4 left-4 text-white/35 text-xs space-y-0.5">
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              Clic gauche — Rotation
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              Clic droit — Déplacement
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              Molette — Zoom
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// ─── Onglets ──────────────────────────────────────────────────────────────────

const tabs = [
  {
    id: 'croquis',
    label: 'Croquis',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />',
  },
  {
    id: 'coupe',
    label: 'Coupe programmatique',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />',
  },
  {
    id: 'lumion',
    label: 'Rendus 3D',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />',
  },
  {
    id: '3d',
    label: 'Modèle 3D',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />',
  },
]

const activeTab = ref('croquis')

const lumionImages = [
  { src: '/images/hero-musee.jpg',      alt: 'Vue extérieure du Musée Shapishiko' },
  { src: '/images/musee/rendu-1.jpg', alt: 'Perspective du musée' },
  { src: '/images/musee/rendu-2.jpg', alt: 'Vue d\'ensemble du musée' },
]

function switchTab(id) {
  activeTab.value = id
}

// ─── État 3D ──────────────────────────────────────────────────────────────────

const ifcState  = ref('idle')  // idle | loading | loaded | missing | parse-error | webgl-error
const ifcError  = ref('')
const ifcCanvas = ref(null)
const wireframe = ref(false)

let THREE_ref   = null
let renderer    = null
let scene       = null
let camera      = null
let controls    = null
let animationId = null
let ifcModel    = null

// ─── IFC / Three.js ──────────────────────────────────────────────────────────

async function initIFC() {
  if (ifcState.value === 'loaded' || ifcState.value === 'loading') return
  ifcState.value = 'loading'

  try {
    const check = await fetch('/plan_akuu.ifc', { method: 'HEAD' })
    if (!check.ok) {
      ifcState.value = 'missing'
      return
    }

    const THREE = await import('three')
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
    const { IFCLoader } = await import('web-ifc-three')

    THREE_ref = THREE

    const canvas = ifcCanvas.value
    if (!canvas) return

    if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) {
      ifcState.value = 'webgl-error'
      return
    }

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1b2a21)
    scene.fog = new THREE.Fog(0x1b2a21, 80, 200)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const sun = new THREE.DirectionalLight(0xfff8e7, 1.4)
    sun.position.set(15, 25, 10)
    sun.castShadow = true
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xc9e1e9, 0.4)
    fill.position.set(-10, 5, -15)
    scene.add(fill)

    camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 500)
    camera.position.set(15, 12, 15)

    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance   = 1
    controls.maxDistance   = 150
    controls.maxPolarAngle = Math.PI / 1.9

    const grid = new THREE.GridHelper(100, 100, 0x52b788, 0x2d6a4f)
    grid.material.opacity = 0.15
    grid.material.transparent = true
    scene.add(grid)

    const loader = new IFCLoader()
    await loader.ifcManager.setWasmPath('/wasm/')

    const buffer = await (await fetch('/plan_akuu.ifc')).arrayBuffer()
    ifcModel = await loader.parse(buffer)
    scene.add(ifcModel)

    const box    = new THREE.Box3().setFromObject(ifcModel)
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim)
    controls.target.copy(center)
    controls.update()

    ifcState.value = 'loaded'

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    window.addEventListener('resize', handleResize)

  } catch (err) {
    console.error('[MuseePlanViewer] IFC error:', err)
    ifcError.value = err?.message || String(err)
    ifcState.value = 'parse-error'
  }
}

function resetCamera() {
  if (!controls || !ifcModel || !THREE_ref) return
  const box    = new THREE_ref.Box3().setFromObject(ifcModel)
  const center = box.getCenter(new THREE_ref.Vector3())
  const size   = box.getSize(new THREE_ref.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim)
  controls.target.copy(center)
  controls.update()
}

function toggleWireframe() {
  wireframe.value = !wireframe.value
  if (ifcModel) {
    ifcModel.traverse(child => {
      if (child.isMesh) child.material.wireframe = wireframe.value
    })
  }
}

function handleResize() {
  if (!renderer || !camera || !ifcCanvas.value) return
  const c = ifcCanvas.value
  camera.aspect = c.clientWidth / c.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(c.clientWidth, c.clientHeight)
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer)    renderer.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>
