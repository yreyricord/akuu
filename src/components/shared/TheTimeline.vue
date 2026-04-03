<template>
  <div class="relative" ref="containerRef">

    <!-- SVG chemin animé (desktop) -->
    <!-- Au-dessus des cartes : sinon le fil + colibri passent sous les fonds blancs (invisibles) -->
    <svg
      v-if="svgReady"
      class="hidden md:block absolute top-0 left-0 z-20 pointer-events-none overflow-visible"
      :width="svgWidth"
      :height="svgHeight"
    >
      <!-- Chemin en pointillés gris en arrière-plan -->
      <path
        :d="pathD"
        fill="none"
        stroke="#3A4040"
        stroke-width="1.5"
        stroke-opacity="0.12"
        stroke-dasharray="6 5"
      />
      <!-- Chemin vert animé qui se dessine au scroll -->
      <path
        ref="pathRef"
        :d="pathD"
        fill="none"
        stroke="url(#timelineGradient)"
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
        :transform="`rotate(${birdLayout.angle} ${birdLayout.x} ${birdLayout.y})`"
        preserveAspectRatio="xMidYMid meet"
        pointer-events="none"
      >
        <title v-if="trailBirdAlt">{{ trailBirdAlt }}</title>
      </image>
      <defs>
        <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2D6915" />
          <stop offset="50%" stop-color="#04488F" />
          <stop offset="100%" stop-color="#A6C639" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Entrées de la frise -->
    <div
      v-for="(item, index) in items"
      :key="item.annee"
      class="relative z-0 grid md:grid-cols-2 gap-0 fade-in-up"
    >
      <!-- Colonne contenu -->
      <div :class="['relative pb-12', index % 2 === 1 ? 'md:order-2 md:pl-8 lg:pl-10' : 'md:order-1 md:pr-8 lg:pr-10']">

        <!-- Point de connexion -->
        <div
          :ref="(el) => setDotRef(el, index)"
          class="hidden md:block absolute top-6 z-10 rounded-full ring-4 ring-cream shadow-lg transition-all duration-500"
          :class="[
            index % 2 === 1 ? '-left-[2.35rem]' : '-right-[2.35rem]',
            item.futur
              ? 'w-4 h-4 mt-0.5 bg-cream border-2 border-dashed'
              : activeIndex >= index ? 'w-5 h-5' : 'w-3.5 h-3.5 mt-[3px]'
          ]"
          :style="item.futur
            ? { borderColor: eraColor(item.annee), backgroundColor: 'transparent', boxShadow: 'none' }
            : { backgroundColor: eraColor(item.annee) }"
        />

        <!-- Card -->
        <div
          class="rounded-2xl p-6 md:p-7 border transition-all duration-500"
          :class="item.futur
            ? 'bg-white/60 border-dashed border-leaf/40 shadow-none backdrop-blur-sm'
            : activeIndex === index
              ? 'bg-white shadow-xl border-forest/25 -translate-y-0.5'
              : 'bg-white shadow-sm border-night/5 hover:shadow-md hover:border-forest/15'"
        >
          <div class="flex items-center gap-2 mb-4 flex-wrap">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              :style="{ backgroundColor: eraColor(item.annee) + '18', color: eraColor(item.annee) }"
            >
              {{ eraLabel(item.annee) }}
            </span>
            <!-- Badge futur -->
            <span v-if="item.futur" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-leaf/10 text-leaf border border-leaf/25 animate-pulse">
              <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4"/>
              </svg>
              {{ t('association.timeline_upcoming_badge') }}
            </span>
          </div>
          <h3
            class="text-lg font-serif font-bold mb-3 transition-colors duration-300"
            :class="item.futur ? 'text-night/50' : activeIndex === index ? 'text-forest' : 'text-night'"
          >
            {{ t(`association.timeline.${item.annee}.title`) }}
          </h3>
          <div
            v-if="timelineParts(item.annee)"
            class="space-y-4"
            :class="item.futur ? 'text-night/35 italic' : 'text-night/60'"
          >
            <div v-for="(part, pi) in timelineParts(item.annee)" :key="pi">
              <p
                v-if="part.title"
                class="text-sm font-semibold text-night/85 mb-1.5"
                :class="item.futur ? 'text-night/45' : ''"
              >
                {{ part.title }}
              </p>
              <p class="text-sm leading-relaxed" :class="item.futur ? 'text-night/35' : 'text-night/60'">
                {{ part.text }}
              </p>
            </div>
          </div>
          <p
            v-else
            class="text-sm leading-relaxed"
            :class="item.futur ? 'text-night/35 italic' : 'text-night/55'"
          >
            {{ t(`association.timeline.${item.annee}.description`) }}
          </p>
        </div>
      </div>

      <!-- Colonne année -->
      <div :class="['hidden md:flex items-start pb-12 shrink-0', index % 2 === 1 ? 'md:order-1 md:justify-end md:pr-8 lg:pr-10' : 'md:order-2 md:justify-start md:pl-8 lg:pl-10']">
        <div class="pt-2 select-none">
          <span
            class="block text-5xl font-serif font-black leading-none transition-all duration-500"
            :style="{ color: activeIndex >= index ? eraColor(item.annee) : '#3A404022' }"
          >
            {{ item.label || item.annee }}
          </span>
        </div>
      </div>

      <!-- Layout mobile -->
      <div class="md:hidden col-span-2 pb-10 pl-8 relative">
        <div
          class="absolute left-0 top-0 bottom-0 w-0.5 transition-colors duration-500"
          :style="{ backgroundColor: activeIndex >= index ? eraColor(item.annee) : '#3A404020' }"
        />
        <div
          class="absolute top-6 left-0 rounded-full ring-2 ring-cream -translate-x-[5px] transition-all duration-500"
          :class="activeIndex >= index ? 'w-3 h-3' : 'w-2 h-2'"
          :style="{ backgroundColor: eraColor(item.annee) }"
        />
        <span
          class="text-2xl font-serif font-black block mb-3 transition-colors duration-500"
          :style="{ color: activeIndex >= index ? eraColor(item.annee) : '#3A404040' }"
        >
          {{ item.label || item.annee }}
        </span>
        <div
          class="rounded-2xl p-5 border"
          :class="item.futur ? 'bg-white/60 border-dashed border-leaf/40 shadow-none' : 'bg-white shadow-sm border-night/5'"
        >
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
              :style="{ backgroundColor: eraColor(item.annee) + '18', color: eraColor(item.annee) }"
            >
              {{ eraLabel(item.annee) }}
            </span>
            <span v-if="item.futur" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-leaf/10 text-leaf border border-leaf/25 animate-pulse">
              <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
              {{ t('association.timeline_upcoming_badge') }}
            </span>
          </div>
          <h3 class="text-base font-serif font-bold mb-2" :class="item.futur ? 'text-night/50' : 'text-night'">{{ t(`association.timeline.${item.annee}.title`) }}</h3>
          <div
            v-if="timelineParts(item.annee)"
            class="space-y-3.5"
            :class="item.futur ? 'text-night/35 italic' : ''"
          >
            <div v-for="(part, pi) in timelineParts(item.annee)" :key="pi">
              <p
                v-if="part.title"
                class="text-sm font-semibold text-night/85 mb-1"
                :class="item.futur ? 'text-night/45 not-italic' : ''"
              >
                {{ part.title }}
              </p>
              <p class="text-sm leading-relaxed" :class="item.futur ? 'text-night/35' : 'text-night/60'">{{ part.text }}</p>
            </div>
          </div>
          <p v-else class="text-sm leading-relaxed" :class="item.futur ? 'text-night/35 italic' : 'text-night/55'">{{ t(`association.timeline.${item.annee}.description`) }}</p>
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
  items: { type: Array, required: true },
  trailBirdSrc: { type: String, default: '' },
  trailBirdAlt: { type: String, default: '' },
  trailBirdAngleOffset: { type: Number, default: TRAIL_BIRD_ANGLE_OFFSET_VERTICAL_FRIZE }
})

const { t, tm } = useI18n()

function timelineParts(annee) {
  const raw = tm(`association.timeline.${annee}.parts`)
  if (!Array.isArray(raw) || raw.length === 0) return null
  const cleaned = raw
    .map((p) => ({
      title: typeof p?.title === 'string' ? p.title.trim() : '',
      text: typeof p?.text === 'string' ? p.text.trim() : ''
    }))
    .filter((p) => p.text)
  return cleaned.length ? cleaned : null
}

const containerRef = ref(null)
const pathRef = ref(null)
const dotElements = ref([])
const pathD = ref('')
const pathLength = ref(2000)
const dashOffset = ref(2000)
const svgWidth = ref(0)
const svgHeight = ref(0)
const svgReady = ref(false)
const activeIndex = ref(-1)

const birdSize = 80
const birdLayout = ref({
  x: 0,
  y: 0,
  angle: 0,
  visible: false
})

function setDotRef(el, index) {
  if (el) dotElements.value[index] = el
}

function getEraKey(annee) {
  if (annee <= 2017) return 'foundation'
  if (annee <= 2019) return 'development'
  if (annee === 2020) return 'pause'
  if (annee <= 2021) return 'relaunch'
  if (annee === 2023) return 'new_course'
  if (annee === 2024) return 'construction'
  if (annee === 2025) return 'acceleration'
  if (annee >= 2026) return 'soon'
  return 'museum'
}

const eraColors = {
  foundation: '#2D6915',
  development: '#04488F',
  pause: '#DC2626',
  relaunch: '#4071A6',
  new_course: '#A6C639',
  construction: '#7A9238',
  acceleration: '#2D6915',
  soon: '#A6C639',
  museum: '#A6C639'
}

function eraColor(annee) {
  return eraColors[getEraKey(annee)]
}

function eraLabel(annee) {
  return t(`association.timeline_eras.${getEraKey(annee)}`)
}

function buildPath() {
  const container = containerRef.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  svgWidth.value = containerRect.width
  svgHeight.value = containerRect.height

  const w = containerRect.width
  const points = dotElements.value
    .map((dot) => {
      if (!dot) return null
      const r = dot.getBoundingClientRect()
      return {
        x: r.left - containerRect.left + r.width / 2,
        y: r.top - containerRect.top + r.height / 2
      }
    })
    .filter(Boolean)

  if (points.length < 2) return

  // Amplitude latérale : augmente avec la largeur du bloc pour que le colibri « contourne » visuellement les cartes
  const waveMag = Math.min(140, Math.max(76, w * 0.1))

  // Chemin en courbes de Bézier : ancrages sur les pastilles réelles (zigzag gauche/droite), contrôles déviés pour un arc généreux
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]
    const c = points[i]
    const mid = (p.y + c.y) / 2
    const dy = Math.min(48, Math.max(18, (c.y - p.y) * 0.12))
    const wave = (i % 2 === 0) ? waveMag : -waveMag
    d += ` C ${p.x + wave} ${mid - dy}, ${c.x - wave} ${mid + dy}, ${c.x} ${c.y}`
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
  const container = containerRef.value
  if (!container) return

  if (pathLength.value > 0) {
    const rect = container.getBoundingClientRect()
    const wh = window.innerHeight
    const scrolled = wh * 0.55 - rect.top
    const progress = Math.max(0, Math.min(1, scrolled / rect.height))
    dashOffset.value = pathLength.value * (1 - progress)
  }

  const wh = window.innerHeight
  let newActive = -1
  dotElements.value.forEach((dot, i) => {
    if (!dot) return
    const dr = dot.getBoundingClientRect()
    if (dr.top < wh * 0.6) newActive = i
  })
  activeIndex.value = newActive
  updateTrailBird()
}

let resizeObs = null

onMounted(() => {
  nextTick(() => {
    buildPath()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    resizeObs = new ResizeObserver(() => { buildPath() })
    if (containerRef.value) resizeObs.observe(containerRef.value)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (resizeObs) resizeObs.disconnect()
})
</script>
