<template>
  <div class="relative" ref="containerRef">

    <!-- SVG chemin animé : desktop (frise centrale) + mobile (pastilles à gauche, courbe sur le côté) -->
    <svg
      v-if="svgReady"
      class="absolute top-0 left-0 z-[5] pointer-events-none overflow-visible"
      :width="svgWidth"
      :height="svgHeight"
    >
      <!-- Guide en pointillés gris -->
      <path :d="pathD" fill="none" stroke="#3A4040" stroke-width="1.5" stroke-opacity="0.1" stroke-dasharray="6 5" />
      <!-- Chemin animé -->
      <path
        ref="pathRef"
        :d="pathD"
        fill="none"
        :stroke="`url(#${gradientId})`"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="pathLength"
        :stroke-dashoffset="dashOffset"
      />
      <image
        v-if="trailBirdSrc && svgReady && birdLayout.visible"
        :href="trailBirdSrc"
        :x="birdLayout.x - birdSizePx / 2"
        :y="birdLayout.y - birdSizePx / 2"
        :width="birdSizePx"
        :height="birdSizePx"
        class="trail-bird-on-path"
        :transform="`rotate(${birdLayout.angle} ${birdLayout.x} ${birdLayout.y})`"
        preserveAspectRatio="xMidYMid meet"
        pointer-events="none"
      >
        <title v-if="trailBirdAlt">{{ trailBirdAlt }}</title>
      </image>
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2D6915" />
          <stop offset="70%" stop-color="#04488F" />
          <stop offset="100%" stop-color="#A6C639" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Étapes : apparition dans l'ordre au scroll -->
    <div
      v-for="(step, index) in steps"
      :key="index"
      :ref="(el) => setStepRowRef(el, index)"
      :data-milestone-index="index"
      class="relative grid md:grid-cols-2 gap-0 milestone-step-row"
      :class="index <= revealUpTo ? 'milestone-step-row--visible' : 'milestone-step-row--hidden'"
      :style="{ '--milestone-stagger': String(index) }"
    >
      <!-- Colonne contenu (desktop uniquement) -->
      <div :class="['relative pb-10 hidden md:block', index % 2 === 1 ? 'md:order-2 md:pl-16' : 'md:order-1 md:pr-16']">

        <!-- Point de connexion -->
        <div
          :ref="(el) => setDesktopDotRef(el, index)"
          class="hidden md:block absolute top-5 z-10 rounded-full ring-4 ring-white shadow-lg transition-all duration-500"
          :class="[
            index % 2 === 1 ? '-left-[2.6rem]' : '-right-[2.6rem]',
            step.status === 'pending' ? 'w-4 h-4 mt-0.5 border-2 border-dashed bg-white' : activeIndex >= index ? 'w-5 h-5' : 'w-3.5 h-3.5 mt-[3px]'
          ]"
          :style="step.status === 'pending'
            ? { borderColor: stepColor(step.status) }
            : { backgroundColor: stepColor(step.status) }"
        />

        <!-- Card -->
        <div
          class="rounded-2xl p-5 border transition-all duration-500"
          :class="[
            step.status === 'pending'
              ? 'bg-white/60 border-dashed border-night/20 shadow-none'
              : activeIndex === index
                ? 'bg-white shadow-xl border-forest/20 -translate-y-0.5'
                : 'bg-white shadow-sm border-night/5 hover:shadow-md hover:border-forest/15'
          ]"
        >
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <!-- Badge statut -->
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              :style="{ backgroundColor: stepColor(step.status) + '18', color: stepColor(step.status) }"
            >
              <span v-if="step.status === 'in_progress'" class="w-1.5 h-1.5 rounded-full animate-pulse" :style="{ backgroundColor: stepColor(step.status) }" />
              {{ stepLabel(step.status) }}
            </span>
            <!-- Badge "À venir" pour pending -->
            <span v-if="step.status === 'pending'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-leaf/10 text-leaf border border-leaf/25 animate-pulse">
              <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
              {{ t(`${labelNamespace}.upcoming`) }}
            </span>
          </div>
          <h3
            class="font-serif font-bold text-base leading-snug transition-colors duration-300"
            :class="step.status === 'pending' ? 'text-night/45 italic' : activeIndex === index ? 'text-forest' : 'text-night'"
          >
            {{ step.label }}
          </h3>
          <ul
            v-if="step.items?.length"
            class="mt-3 space-y-1.5 text-sm leading-snug list-disc pl-4 marker:text-forest/50"
            :class="step.status === 'pending' ? 'text-night/40' : 'text-night/70'"
          >
            <li v-for="(item, j) in step.items" :key="j">{{ item }}</li>
          </ul>
        </div>
      </div>

      <!-- Colonne année -->
      <div :class="['hidden md:flex items-start pb-10', index % 2 === 1 ? 'md:order-1 md:justify-end md:pr-16' : 'md:order-2 md:justify-start md:pl-16']">
        <div class="pt-1 select-none">
          <span
            class="block font-serif font-black leading-none transition-all duration-500"
            :class="step.year.length > 4 ? 'text-3xl' : 'text-5xl'"
            :style="{ color: activeIndex >= index ? stepColor(step.status) : '#3A404020' }"
          >
            {{ step.year }}
          </span>
        </div>
      </div>

      <!-- Mobile (colibri animé = même SVG que desktop, calé sur les pastilles) -->
      <div class="md:hidden col-span-2 pb-8 pl-8 relative">
        <div class="absolute left-0 top-0 bottom-0 w-0.5 transition-colors duration-500"
          :style="{ backgroundColor: activeIndex >= index ? stepColor(step.status) : '#3A404015' }" />
        <div
          :ref="(el) => setMobileDotRef(el, index)"
          class="absolute top-4 left-0 rounded-full ring-2 ring-white -translate-x-[5px] transition-all duration-500 motion-reduce:transition-none"
          :class="activeIndex >= index ? 'w-3 h-3' : 'w-2 h-2'"
          :style="{ backgroundColor: stepColor(step.status) }"
        />
        <div class="rounded-2xl p-4 border"
          :class="step.status === 'pending' ? 'bg-white/60 border-dashed border-night/20' : 'bg-white shadow-sm border-night/5'">
          <span class="text-xl font-serif font-black block mb-2 transition-colors duration-500"
            :style="{ color: activeIndex >= index ? stepColor(step.status) : '#3A404040' }">
            {{ step.year }}
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
            :style="{ backgroundColor: stepColor(step.status) + '18', color: stepColor(step.status) }">
            {{ stepLabel(step.status) }}
          </span>
          <p class="text-sm font-medium leading-snug"
            :class="step.status === 'pending' ? 'text-night/40 italic' : 'text-night'">
            {{ step.label }}
          </p>
          <ul
            v-if="step.items?.length"
            class="mt-2 space-y-1 text-sm leading-snug list-disc pl-4 marker:text-forest/50"
            :class="step.status === 'pending' ? 'text-night/40' : 'text-night/70'"
          >
            <li v-for="(item, j) in step.items" :key="j">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  computeTrailBirdLayout,
  TRAIL_BIRD_ANGLE_OFFSET_VERTICAL_FRIZE
} from '@/composables/useTrailBirdOnPath'

const props = defineProps({
  steps: { type: Array, required: true },
  /** PNG transparent : suit le fil du temps (desktop uniquement, même SVG que la courbe). */
  trailBirdSrc: { type: String, default: '' },
  trailBirdAlt: { type: String, default: '' },
  /** Décalage en degrés pour l’orientation du PNG (ex. vol plus horizontal). */
  trailBirdAngleOffset: { type: Number, default: TRAIL_BIRD_ANGLE_OFFSET_VERTICAL_FRIZE },
  /** Préfixe i18n pour les badges (ex. musee.milestone_ui ou hydrama.timeline_ui). */
  labelNamespace: { type: String, default: 'musee.milestone_ui' },
  /** Id unique du linearGradient SVG (évite les conflits si plusieurs frises sur le site). */
  gradientId: { type: String, default: 'museeMilestoneGradient' }
})

/** Taille du PNG sur le chemin (plus petit sur mobile) */
const birdSizePx = ref(80)

const birdLayout = ref({
  x: 0,
  y: 0,
  angle: 0,
  visible: false
})

const { t } = useI18n()

const containerRef = ref(null)
const pathRef = ref(null)
const dotElementsDesktop = ref([])
const dotElementsMobile = ref([])

function dotsForViewport() {
  if (typeof window === 'undefined') return dotElementsDesktop.value
  return window.matchMedia('(min-width: 768px)').matches ? dotElementsDesktop.value : dotElementsMobile.value
}
const pathD = ref('')
const pathLength = ref(2000)
const dashOffset = ref(2000)
const svgWidth = ref(0)
const svgHeight = ref(0)
const svgReady = ref(false)
const activeIndex = ref(-1)

/** Lignes de frise pour révéler les cartes dans l'ordre au scroll */
const stepRowElements = ref([])
const revealUpTo = ref(-1)

function setDesktopDotRef(el, index) {
  if (el) dotElementsDesktop.value[index] = el
}
function setMobileDotRef(el, index) {
  if (el) dotElementsMobile.value[index] = el
}

function setStepRowRef(el, index) {
  if (el) stepRowElements.value[index] = el
}

function stepColor(status) {
  if (status === 'done') return '#2D6915'
  if (status === 'in_progress') return '#04488F'
  return '#A6C639'
}

function stepLabel(status) {
  const ns = props.labelNamespace
  if (status === 'done') return t(`${ns}.status_done`)
  if (status === 'in_progress') return t(`${ns}.status_in_progress`)
  return t(`${ns}.status_pending`)
}

function buildPath() {
  const container = containerRef.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  svgWidth.value = containerRect.width
  svgHeight.value = containerRect.height

  const isMdUp = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  birdSizePx.value = isMdUp ? 80 : 48

  const dots = isMdUp ? dotElementsDesktop.value : dotElementsMobile.value
  const points = dots
    .map((dot) => {
      if (!dot) return null
      const r = dot.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return null
      const cy = r.top - containerRect.top + r.height / 2
      const cx = r.left - containerRect.left + r.width / 2
      if (isMdUp) {
        return { x: containerRect.width / 2, y: cy }
      }
      return { x: cx, y: cy }
    })
    .filter(Boolean)

  if (points.length < 2) {
    svgReady.value = false
    scheduleCardRevealCheck()
    return
  }

  const w = containerRect.width
  const waveBase = isMdUp ? 50 : Math.min(34, Math.max(20, w * 0.065))

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]
    const c = points[i]
    const mid = (p.y + c.y) / 2
    const wave = (i % 2 === 0) ? waveBase : -waveBase
    d += ` C ${p.x + wave} ${mid - 20}, ${c.x - wave} ${mid + 20}, ${c.x} ${c.y}`
  }

  pathD.value = d
  svgReady.value = true

  nextTick(() => {
    if (pathRef.value) {
      const len = pathRef.value.getTotalLength()
      pathLength.value = len
      dashOffset.value = len
      handleScroll()
      scheduleCardRevealCheck()
    }
  })
}

function updateCardReveal() {
  const wh = window.innerHeight
  // Ligne « déclenchée » dès qu’elle entre sensiblement dans le viewport (pas seulement le haut de l’écran)
  const triggerBottom = wh * 0.92
  let maxIdx = revealUpTo.value
  const n = props.steps.length
  for (let i = 0; i < n; i++) {
    const el = stepRowElements.value[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top < triggerBottom && r.bottom > wh * 0.06) maxIdx = Math.max(maxIdx, i)
  }
  revealUpTo.value = maxIdx
}

/** Double rAF : refs + layout SVG après le 1er paint */
function scheduleCardRevealCheck() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => updateCardReveal())
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
  const container = containerRef.value
  if (!container) return

  const len = pathLength.value
  if (len > 0) {
    const rect = container.getBoundingClientRect()
    const wh = window.innerHeight
    const scrolled = wh * 0.55 - rect.top
    const progress = Math.max(0, Math.min(1, scrolled / rect.height))
    dashOffset.value = len * (1 - progress)
  }

  const wh = window.innerHeight
  let newActive = -1
  dotsForViewport().forEach((dot, i) => {
    if (!dot) return
    const dr = dot.getBoundingClientRect()
    if (dr.height > 0 && dr.top < wh * 0.6) newActive = i
  })
  activeIndex.value = newActive

  updateCardReveal()
  updateTrailBird()
}

let resizeObs = null
let cardRevealObs = null

function observeMilestoneRows() {
  if (cardRevealObs) {
    cardRevealObs.disconnect()
    cardRevealObs = null
  }
  cardRevealObs = new IntersectionObserver(
    (entries) => {
      let max = revealUpTo.value
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const raw = e.target.getAttribute('data-milestone-index')
        const i = raw == null ? NaN : Number(raw)
        if (!Number.isNaN(i)) max = Math.max(max, i)
      }
      revealUpTo.value = max
    },
    {
      root: null,
      // Zone d’activation un peu au-dessus du bas de l’écran (effet « au scroll »)
      rootMargin: '0px 0px -12% 0px',
      threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1]
    }
  )
  for (let i = 0; i < props.steps.length; i++) {
    const el = stepRowElements.value[i]
    if (el) cardRevealObs.observe(el)
  }
}

onMounted(() => {
  nextTick(() => {
    buildPath()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    resizeObs = new ResizeObserver(() => buildPath())
    if (containerRef.value) resizeObs.observe(containerRef.value)
    nextTick(() => {
      observeMilestoneRows()
      scheduleCardRevealCheck()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => buildPath())
      })
    })
  })
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (resizeObs) resizeObs.disconnect()
  if (cardRevealObs) {
    cardRevealObs.disconnect()
    cardRevealObs = null
  }
})
</script>

<style scoped>
/* Cartes : masquées puis révélées une par une (ordre du scroll) */
.milestone-step-row--hidden > * {
  opacity: 0;
  transform: translateY(1.35rem);
}
.milestone-step-row--visible > * {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--milestone-stagger) * 70ms);
}

@media (prefers-reduced-motion: reduce) {
  .milestone-step-row--hidden > *,
  .milestone-step-row--visible > * {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

.trail-bird-on-path {
  filter: drop-shadow(0 4px 14px rgb(45 105 21 / 0.2));
}
</style>
