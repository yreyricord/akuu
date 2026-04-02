<template>
  <div ref="containerRef" class="relative">

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
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true }
})

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

function handleScroll() {
  const container = containerRef.value
  if (!container || !pathLength.value) return

  const rect = container.getBoundingClientRect()
  const wh = window.innerHeight

  // Progrès basé sur la position du bloc dans la fenêtre
  const scrolled = wh * 0.65 - rect.left - rect.top * 0.2
  const progress = Math.max(0, Math.min(1, (wh * 0.65 - rect.top) / (rect.height + wh * 0.3)))
  dashOffset.value = pathLength.value * (1 - progress)

  // Activation des étapes selon scroll
  let newActive = -1
  dotElements.value.forEach((dot, i) => {
    if (!dot) return
    const dr = dot.getBoundingClientRect()
    if (dr.left < window.innerWidth * 0.85 && dr.top < wh * 0.75) newActive = i
  })
  activeIndex.value = newActive
}

let resizeObs = null
onMounted(() => {
  nextTick(() => {
    buildPath()
    window.addEventListener('scroll', handleScroll, { passive: true })
    resizeObs = new ResizeObserver(() => buildPath())
    if (containerRef.value) resizeObs.observe(containerRef.value)
  })
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (resizeObs) resizeObs.disconnect()
})
</script>
