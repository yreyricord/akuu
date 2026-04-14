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
        <component :is="tab.icon" :size="16" class="shrink-0" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Croquis environnement -->
    <div v-show="activeTab === 'croquis'">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-night/5">
        <div class="bg-night/3 px-6 py-3 border-b border-night/8 flex items-center gap-2">
          <PhImage :size="16" class="text-forest" />
          <span class="text-sm font-semibold text-night/70">{{ t('musee.planviewer.sketch_caption') }}</span>
        </div>
        <div class="p-4 bg-stone-50">
          <img
            src="/images/musee/musee_1.jpg"
            :alt="t('musee.planviewer.sketch_alt')"
            class="w-full h-auto rounded-xl object-contain"
            style="max-height: 620px;"
          />
        </div>
      </div>
    </div>

    <!-- Perspectives, carrousel -->
    <div v-show="activeTab === 'perspectives'">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-night/5">
        <div class="bg-night/3 px-6 py-3 border-b border-night/8 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <PhEye :size="16" class="text-forest" />
            <span class="text-sm font-semibold text-night/70">{{ t('musee.planviewer.perspectives_caption') }}</span>
          </div>
          <span class="text-xs text-night/40 font-medium">{{ carouselIndex + 1 }} / {{ lumionImages.length }}</span>
        </div>

        <!-- Image principale -->
        <div class="relative overflow-hidden bg-stone-100" style="height: 480px;">
          <transition name="carousel-fade" mode="out-in">
            <img
              :key="carouselIndex"
              :src="lumionImages[carouselIndex].src"
              :alt="lumionImages[carouselIndex].alt"
              class="w-full h-full object-contain"
            />
          </transition>

          <!-- Flèches -->
          <button
            v-if="lumionImages.length > 1"
            @click="carouselPrev"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-night/40 hover:bg-night/70 text-white flex items-center justify-center backdrop-blur transition"
          >
            <PhCaretLeft :size="20" weight="bold" />
          </button>
          <button
            v-if="lumionImages.length > 1"
            @click="carouselNext"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-night/40 hover:bg-night/70 text-white flex items-center justify-center backdrop-blur transition"
          >
            <PhCaretRight :size="20" weight="bold" />
          </button>
        </div>

        <!-- Miniatures -->
        <div class="flex gap-2 p-3 bg-stone-50 overflow-x-auto">
          <button
            v-for="(img, i) in lumionImages"
            :key="i"
            @click="carouselIndex = i"
            class="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition"
            :class="carouselIndex === i ? 'border-forest' : 'border-transparent opacity-60 hover:opacity-100'"
          >
            <img :src="img.src" :alt="img.alt" class="w-full h-full object-cover" />
          </button>
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
          <div class="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center mb-5">
            <PhCube :size="32" weight="duotone" class="text-leaf" />
          </div>
          <p class="text-lg font-serif font-bold text-white mb-1">{{ t('musee.planviewer.interactive_title') }}</p>
          <p class="text-sm text-white/50 mb-5">{{ t('musee.planviewer.interactive_subtitle') }}</p>
          <button
            @click="initIFC"
            class="inline-flex items-center gap-2 bg-leaf text-night font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-leaf/90 transition"
          >
            <PhPlay :size="16" weight="fill" />
            {{ t('musee.planviewer.load_model') }}
          </button>
        </div>

        <!-- Loading -->
        <div v-if="ifcState === 'loading'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div class="w-12 h-12 border-4 border-white/20 border-t-leaf rounded-full animate-spin mb-5" />
          <p class="text-sm font-semibold text-white/80">{{ t('musee.planviewer.loading_title') }}</p>
          <p class="text-xs text-white/40 mt-1.5">{{ t('musee.planviewer.loading_hint') }}</p>
        </div>

        <!-- Fichier IFC manquant -->
        <div v-if="ifcState === 'missing'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center mb-5">
            <PhBuildings :size="32" weight="duotone" class="text-white/40" />
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">{{ t('musee.planviewer.error_missing_title') }}</p>
          <p class="text-sm text-white/50 leading-relaxed max-w-sm">{{ t('musee.planviewer.error_missing_body') }}</p>
        </div>

        <!-- Erreur de chargement/parsing -->
        <div v-if="ifcState === 'parse-error'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center mb-5">
            <PhWarning :size="32" weight="fill" class="text-amber-400" />
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">{{ t('musee.planviewer.error_parse_title') }}</p>
          <p class="text-sm text-white/50 leading-relaxed max-w-sm mb-4">{{ t('musee.planviewer.error_parse_body') }}</p>
          <code v-if="ifcError" class="text-xs bg-white/10 px-3 py-2 rounded-lg text-amber-300 max-w-sm break-all">{{ ifcError }}</code>
        </div>

        <!-- WebGL non supporté -->
        <div v-if="ifcState === 'webgl-error'" class="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center mb-5">
            <PhWarning :size="32" weight="fill" class="text-white/40" />
          </div>
          <p class="text-lg font-serif font-bold text-white mb-2">{{ t('musee.planviewer.webgl_title') }}</p>
          <p class="text-sm text-white/50">{{ t('musee.planviewer.webgl_body') }}</p>
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
              <PhArrowsClockwise :size="14" />
              {{ t('musee.planviewer.reset_camera') }}
            </button>
            <button
              @click="toggleWireframe"
              class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs px-3 py-2 rounded-xl backdrop-blur transition"
            >
              <PhCubeTransparent :size="14" />
              {{ wireframe ? t('musee.planviewer.view_solid') : t('musee.planviewer.view_wireframe') }}
            </button>
          </div>

          <!-- Coordonnées au clic (debug) -->
          <div v-if="clickCoords" class="absolute top-4 left-4 bg-black/70 text-leaf text-sm font-mono px-4 py-2.5 rounded-xl backdrop-blur z-20">
            {{ t('musee.planviewer.click_debug', { x: clickCoords.x, y: clickCoords.y, z: clickCoords.z }) }}
          </div>

          <!-- Légende -->
          <div class="absolute bottom-4 left-4 text-white/35 text-xs space-y-0.5">
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              {{ t('musee.planviewer.controls_rotate') }}
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              {{ t('musee.planviewer.controls_pan') }}
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg>
              {{ t('musee.planviewer.controls_zoom') }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhCube,
  PhImage,
  PhEye,
  PhCaretLeft,
  PhCaretRight,
  PhPlay,
  PhBuildings,
  PhWarning,
  PhArrowsClockwise,
  PhCubeTransparent,
} from '@phosphor-icons/vue'

const { t } = useI18n()

// ─── Onglets ──────────────────────────────────────────────────────────────────

const tabs = computed(() => [
  { id: '3d', label: t('musee.planviewer.tab_3d'), icon: PhCube },
  { id: 'croquis', label: t('musee.planviewer.tab_sketch'), icon: PhImage },
  { id: 'perspectives', label: t('musee.planviewer.tab_perspectives'), icon: PhEye },
])

const activeTab    = ref('3d')
const carouselIndex = ref(0)

const lumionImages = computed(() => [
  { src: '/images/musee/rendu-3.jpg', alt: t('musee.planviewer.rendu_3_alt') },
  { src: '/images/musee/rendu-1.png', alt: t('musee.planviewer.rendu_1_alt') },
  { src: '/images/musee/rendu-2.jpg', alt: t('musee.planviewer.rendu_2_alt') },
])

function carouselNext() { carouselIndex.value = (carouselIndex.value + 1) % lumionImages.value.length }
function carouselPrev() { carouselIndex.value = (carouselIndex.value - 1 + lumionImages.value.length) % lumionImages.value.length }

function switchTab(id) {
  activeTab.value = id
}

// ─── État 3D ──────────────────────────────────────────────────────────────────

const ifcState    = ref('idle')  // idle | loading | loaded | missing | parse-error | webgl-error
const ifcError    = ref('')
const ifcCanvas   = ref(null)
const wireframe   = ref(false)
const clickCoords = ref(null)

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
    const ifcUrl = '/plan_akuu.ifc'
    const check = await fetch(ifcUrl, { method: 'HEAD', cache: 'no-store' })
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

    const buffer = await (await fetch(ifcUrl, { cache: 'no-store' })).arrayBuffer()
    ifcModel = await loader.parse(buffer)
    scene.add(ifcModel)

    // ── Nettoyage des lignes parasites (grilles ArchiCAD) ─────────
    // Enveloppé dans try-catch : si ça échoue, le modèle s'affiche quand même
    try {
      const allChildren = []
      ifcModel.traverse((child) => {
        if (!child.geometry) return
        try {
          child.geometry.computeBoundingBox()
          const bb = child.geometry.boundingBox
          if (!bb) return
          const sx = bb.max.x - bb.min.x
          const sy = bb.max.y - bb.min.y
          const sz = bb.max.z - bb.min.z
          if (!isFinite(sx) || !isFinite(sy) || !isFinite(sz)) return
          const maxAxis = Math.max(sx, sy, sz)
          const minAxis = Math.min(sx, sy, sz)
          allChildren.push({ obj: child, maxAxis, minAxis })
        } catch (_) { /* skip degenerate geometry */ }
      })

      const sizes = allChildren.map((c) => c.maxAxis).sort((a, b) => a - b)
      const median = sizes.length > 0 ? sizes[Math.floor(sizes.length * 0.5)] : 1
      const sizeThreshold = Math.max(median * 5, 30)

      const toRemove = []
      for (const { obj, maxAxis, minAxis } of allChildren) {
        const type = obj.type || ''
        const isLine = type === 'Line' || type === 'LineSegments' || type === 'LineLoop'
          || obj.isLine || obj.isLineSegments || obj.isLineLoop
        const isThin = maxAxis > 8 && minAxis < 0.05
        const isHuge = maxAxis > sizeThreshold
        if (isLine || isThin || isHuge) toRemove.push(obj)
      }
      for (const obj of toRemove) {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => m.dispose())
        }
        if (obj.parent) obj.parent.remove(obj)
      }
    } catch (cleanErr) {
      console.warn('[MuseePlanViewer] Grid cleanup failed:', cleanErr)
    }

    const box    = new THREE.Box3().setFromObject(ifcModel)
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // Personnages (repère d'échelle) placés entre les deux bâtiments
    function createHuman(height, color) {
      const s = height / 1.75
      const g = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 12, 10), mat)
      head.position.y = 1.63 * s
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.14 * s, 0.55 * s, 10), mat)
      torso.position.y = 1.24 * s
      const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.12 * s, 0.2 * s, 10), mat)
      hips.position.y = 0.87 * s
      const legGeo = new THREE.CylinderGeometry(0.07 * s, 0.05 * s, 0.85 * s, 8)
      const lL = new THREE.Mesh(legGeo, mat)
      lL.position.set(0.08 * s, 0.425 * s, 0)
      const lR = new THREE.Mesh(legGeo, mat)
      lR.position.set(-0.08 * s, 0.425 * s, 0)
      const armGeo = new THREE.CylinderGeometry(0.045 * s, 0.04 * s, 0.6 * s, 8)
      const aL = new THREE.Mesh(armGeo, mat)
      aL.position.set(0.22 * s, 1.18 * s, 0)
      aL.rotation.z = 0.12
      const aR = new THREE.Mesh(armGeo, mat)
      aR.position.set(-0.22 * s, 1.18 * s, 0)
      aR.rotation.z = -0.12
      g.add(head, torso, hips, lL, lR, aL, aR)
      g.traverse((c) => { if (c.isMesh) c.castShadow = true })
      return g
    }

    const people = [
      { height: 1.78, color: 0x2d6a4f, dx:  0,    dz: 0,    ry: 0.5 },
      { height: 1.65, color: 0x52b788, dx:  1.2,   dz: 0.6,  ry: 0.9 },
      { height: 1.82, color: 0x1b4332, dx: -1.0,   dz: 0.8,  ry: -0.3 },
      { height: 1.10, color: 0x40916c, dx:  0.5,   dz: -0.5, ry: 1.2 },
      { height: 1.72, color: 0x3a5a40, dx: -0.7,   dz: -0.7, ry: -0.8 },
    ]
    for (const p of people) {
      const h = createHuman(p.height, p.color)
      h.position.set(46.0 + p.dx, 0, -18.34 + p.dz)
      h.rotation.y = p.ry
      scene.add(h)
    }


    camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim)
    controls.target.copy(center)
    controls.update()

    ifcState.value = 'loaded'

    // Raycaster pour identifier les coordonnées au clic
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    canvas.addEventListener('dblclick', (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length > 0) {
        const p = hits[0].point
        clickCoords.value = {
          x: p.x.toFixed(2),
          y: p.y.toFixed(2),
          z: p.z.toFixed(2),
        }
      }
    })

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

<style scoped>
.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.35s ease;
}
.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}
</style>
