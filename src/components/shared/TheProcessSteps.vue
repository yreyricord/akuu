<template>
  <!-- Hauteur étendue : le scroll « consomme » d’abord l’animation (trait + colibri + étapes) avant de poursuivre la page -->
  <div
    ref="scrollStageRef"
    class="process-steps-scroll-stage relative min-h-[200vh] md:min-h-[220vh] motion-reduce:min-h-0"
  >
    <div
      ref="containerRef"
      class="sticky top-24 md:top-[7.5rem] py-2 md:py-4 relative"
    >
    <!-- Titre de section (sticky avec les étapes : reste visible au scroll) -->
    <div
      v-if="headingKicker || headingTitle"
      class="text-center mb-8 md:mb-10"
    >
      <p
        v-if="headingKicker"
        class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3"
      >
        {{ headingKicker }}
      </p>
      <h2
        v-if="headingTitle"
        class="text-3xl md:text-4xl font-serif font-bold text-night text-balance"
      >
        {{ headingTitle }}
      </h2>
    </div>

    <!-- SVG chemin horizontal (desktop) -->
    <svg
      v-if="svgReady"
      class="hidden md:block absolute pointer-events-none overflow-visible"
      :style="{ top: svgTop + 'px', left: 0, width: svgWidth + 'px', height: '80px' }"
    >
      <!-- Guide pointillés -->
      <path :d="pathD" fill="none" stroke="#3A4040" stroke-width="1.5" stroke-opacity="0.1" stroke-dasharray="5 5" />
      <!-- Chemin animé -->
      <path
        ref="pathRef"
        :d="pathD"
        fill="none"
        stroke="url(#processGradient)"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="pathLength"
        :stroke-dashoffset="dashOffset"
      />
      <image
        v-if="trailBirdSrc && svgReady && birdLayout.visible"
        :href="trailBirdSrc"
        :x="birdLayout.x - birdSize / 2"
        :y="birdLayout.y - birdSize / 2"
        :width="birdSize"
        :height="birdSize"
        class="trail-bird-on-path"
        :transform="`rotate(${birdLayout.angle} ${birdLayout.x} ${birdLayout.y})`"
        preserveAspectRatio="xMidYMid meet"
        pointer-events="none"
      >
        <title v-if="trailBirdAlt">{{ trailBirdAlt }}</title>
      </image>
      <defs>
        <linearGradient id="processGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#2D6915" />
          <stop offset="50%" stop-color="#04488F" />
          <stop offset="100%" stop-color="#A6C639" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Grille des étapes -->
    <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="relative flex flex-col items-center text-center"
      >
        <!-- Cercle numéroté -->
        <div
          :ref="(el) => setDotRef(el, index)"
          class="relative w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-lg transition-all duration-500 z-10"
          :class="activeIndex >= index
            ? 'scale-110'
            : 'scale-100'"
          :style="{
            backgroundColor: activeIndex >= index ? stepColor(index) : '#f4f4f0',
            boxShadow: activeIndex >= index ? `0 8px 24px ${stepColor(index)}30` : 'none'
          }"
        >
          <span
            class="text-2xl font-serif font-black transition-colors duration-500"
            :style="{ color: activeIndex >= index ? '#fff' : '#3A404040' }"
          >
            {{ index + 1 }}
          </span>
          <!-- Anneau pulsant sur l'étape active -->
          <span
            v-if="activeIndex === index"
            class="absolute inset-0 rounded-full animate-ping opacity-20"
            :style="{ backgroundColor: stepColor(index) }"
          />
        </div>

        <!-- Contenu -->
        <div
          class="rounded-2xl p-5 border transition-all duration-500 w-full"
          :class="activeIndex >= index
            ? 'bg-white shadow-md border-night/8'
            : 'bg-white/50 border-night/5 shadow-none'"
        >
          <h3
            class="text-base font-serif font-bold mb-2 transition-colors duration-500"
            :style="{ color: activeIndex >= index ? stepColor(index) : '#3A404060' }"
          >
            {{ step.title }}
          </h3>
          <p
            class="text-sm leading-relaxed transition-colors duration-500"
            :class="activeIndex >= index ? 'text-night/60' : 'text-night/30'"
          >
            {{ step.text }}
          </p>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  computeTrailBirdLayout,
  TRAIL_BIRD_ANGLE_OFFSET_HORIZONTAL_PATH
} from '@/composables/useTrailBirdOnPath'

const props = defineProps({
  steps: { type: Array, required: true },
  /** Sous-titre au-dessus du titre (ex. « En 4 étapes ») — affiché dans le bloc sticky. */
  headingKicker: { type: String, default: '' },
  /** Titre principal de la section — affiché dans le bloc sticky avec les numéros d’étapes. */
  headingTitle: { type: String, default: '' },
  trailBirdSrc: { type: String, default: '' },
  trailBirdAlt: { type: String, default: '' },
  /** Chemin horizontal des étapes : tangente seule (pas l’offset -90° des frises verticales). */
  trailBirdAngleOffset: { type: Number, default: TRAIL_BIRD_ANGLE_OFFSET_HORIZONTAL_PATH }
})

const scrollStageRef = ref(null)
const containerRef = ref(null)
const pathRef = ref(null)
const dotElements = ref([])
const pathD = ref('')
const pathLength = ref(2000)
const dashOffset = ref(2000)
const svgWidth = ref(0)
const svgTop = ref(0)
const svgReady = ref(false)
const activeIndex = ref(-1)

const birdSize = 64
const birdLayout = ref({
  x: 0,
  y: 0,
  angle: 0,
  visible: false
})

const colors = ['#2D6915', '#04488F', '#4071A6', '#A6C639']
function stepColor(index) { return colors[index] ?? '#2D6915' }

function setDotRef(el, index) {
  if (el) dotElements.value[index] = el
}

function buildPath() {
  const container = containerRef.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  svgWidth.value = containerRect.width

  const points = dotElements.value
    .map(dot => {
      if (!dot) return null
      const r = dot.getBoundingClientRect()
      return {
        x: r.left - containerRect.left + r.width / 2,
        y: r.top - containerRect.top + r.height / 2
      }
    })
    .filter(Boolean)

  if (points.length < 2) return

  // Offset SVG top to align with dot centers
  svgTop.value = points[0].y - 40

  // Chemin horizontal ondulé
  let d = `M ${points[0].x} 40`
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]
    const c = points[i]
    const midX = (p.x + c.x) / 2
    const wave = (i % 2 === 0) ? -18 : 18
    d += ` C ${midX - 20} ${40 + wave}, ${midX + 20} ${40 - wave}, ${c.x} 40`
  }

  pathD.value = d
  svgReady.value = true

  nextTick(() => {
    if (pathRef.value) {
      const len = pathRef.value.getTotalLength()
      pathLength.value = len
      dashOffset.value = len
      handleScroll()
    }
  })
}

function updateTrailBird () {
  if (!props.trailBirdSrc || !pathRef.value) {
    birdLayout.value = { x: 0, y: 0, angle: 0, visible: false }
    return
  }
  const len = pathLength.value
  birdLayout.value = computeTrailBirdLayout(pathRef.value, len, dashOffset.value, {
    angleOffset: props.trailBirdAngleOffset
  })
}

function handleScroll() {
  const stage = scrollStageRef.value
  const container = containerRef.value
  if (!stage || !container) return

  const wh = window.innerHeight
  const n = props.steps.length
  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let progress = 0

  if (reducedMotion) {
    const cr = container.getBoundingClientRect()
    progress = cr.top < wh * 0.62 && cr.bottom > wh * 0.18 ? 1 : 0
  } else {
    const scrollable = stage.offsetHeight - wh
    if (scrollable <= 0) {
      const sr = stage.getBoundingClientRect()
      progress = sr.top < wh * 0.4 ? 1 : 0
    } else {
      const rect = stage.getBoundingClientRect()
      progress = Math.max(0, Math.min(1, -rect.top / scrollable))
    }
  }

  if (pathLength.value > 0) {
    dashOffset.value = pathLength.value * (1 - progress)
  }

  // Même progression que le trait / colibri (aucune étape « active » tant que le scroll n’a pas commencé dans la zone)
  activeIndex.value = n <= 0
    ? -1
    : Math.min(n - 1, Math.max(-1, Math.ceil(progress * n) - 1))

  updateTrailBird()
}

let resizeObs = null
onMounted(() => {
  nextTick(() => {
    buildPath()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    resizeObs = new ResizeObserver(() => buildPath())
    if (containerRef.value) resizeObs.observe(containerRef.value)
    if (scrollStageRef.value) resizeObs.observe(scrollStageRef.value)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buildPath()
        handleScroll()
      })
    })
  })
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (resizeObs) resizeObs.disconnect()
})
</script>

<style scoped>
.trail-bird-on-path {
  filter: drop-shadow(0 3px 10px rgb(45 105 21 / 0.18));
}
</style>
