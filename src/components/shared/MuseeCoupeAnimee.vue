<template>
  <div class="musee-coupe-animee" ref="rootEl">
    <div v-if="!omitSectionHeader" class="text-center mb-8 md:mb-10">
      <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">
        {{ $t('musee.coupe.section_kicker') }}
      </p>
      <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
        {{ $t('musee.coupe.title') }}
      </h2>
      <p class="text-night/50 mt-3 max-w-xl mx-auto text-sm">
        {{ $t('musee.coupe.intro') }}
      </p>
      <p class="text-night/35 mt-2 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5">
        <span class="inline-block animate-bounce motion-reduce:animate-none" aria-hidden="true">↓</span>
        {{ $t('musee.coupe.scroll_hint') }}
      </p>
    </div>

    <div
      ref="stageRef"
      class="coupe-stage relative"
      :style="stageStyle"
      :aria-label="$t('musee.coupe.title')"
    >
      <!-- pb généreux en dvh : garde un vide lisible sous la carte légende même quand le plan remplit l’écran -->
      <div
        class="coupe-sticky sticky top-0 min-h-[100dvh] flex flex-col justify-center pt-4 md:pt-6 pb-[max(3.5rem,12dvh)] md:pb-[max(4.5rem,14dvh)]"
      >
        <div class="w-full max-w-7xl mx-auto flex flex-col gap-4 md:gap-5 shrink-0">
          <!-- Plan : hauteur = ratio naturel de l’image (pas flex-1 / pas object-contain plein cadre) ; carte toujours en dessous -->
          <div
            class="coupe-plan-wrapper relative w-full rounded-2xl shadow-xl bg-night/[0.04] border border-night/[0.06] ring-1 ring-black/[0.04] overflow-hidden"
          >
            <!-- Wrapper zoomable (img + SVG se transforment ensemble) -->
            <div class="coupe-zoomable relative w-full" :style="zoomStyle">
              <img
                src="/images/musee/coupe_final.png"
                :alt="$t('musee.coupe.alt')"
                class="w-full h-auto block coupe-image"
                :class="{ revealed: imageRevealed }"
                @load="onImageLoad"
              />

              <svg
                v-if="imageReady"
                class="absolute inset-0 w-full h-full pointer-events-auto"
                :viewBox="`0 0 ${IMG_W} ${IMG_H}`"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                style="overflow: visible;"
              >
                <defs>
                  <!-- Flou doux pour le bord du spotlight -->
                  <filter id="coupe-spotlight-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="55" />
                  </filter>
                  <!-- Masque : blanc = overlay visible (sombre), noir = pas d'overlay (clair) -->
                  <mask id="coupe-spotlight-mask">
                    <rect x="0" y="0" :width="IMG_W" :height="IMG_H" fill="white" />
                    <rect
                      v-if="activeZone && zonesVisible"
                      :x="activeZone.x - SPOT_PAD"
                      :y="activeZone.y - SPOT_PAD"
                      :width="activeZone.w + 2 * SPOT_PAD"
                      :height="activeZone.h + 2 * SPOT_PAD"
                      rx="20"
                      fill="black"
                      filter="url(#coupe-spotlight-blur)"
                    />
                  </mask>
                </defs>

                <!-- Tous les contours de zone (subtils, sous l'overlay) -->
                <g
                  v-for="(zone, i) in zones"
                  :key="'outline-' + zone.id"
                  @click.stop="selectZone(zone)"
                  @mouseenter="hovered = zone.id"
                  @mouseleave="hovered = null"
                  class="cursor-pointer"
                  :style="{ opacity: zonesVisible ? 1 : 0, transition: `opacity 0.45s ease ${0.15 + i * 0.1}s` }"
                >
                  <rect
                    :x="zone.x"
                    :y="zone.y"
                    :width="zone.w"
                    :height="zone.h"
                    rx="8"
                    :stroke="COLORS.forest"
                    stroke-width="2"
                    stroke-opacity="0.35"
                    fill="none"
                  />
                </g>

                <!-- Overlay sombre avec découpe spotlight (masqué en mode vue d'ensemble) -->
                <rect
                  v-if="zonesVisible"
                  x="0"
                  y="0"
                  :width="IMG_W"
                  :height="IMG_H"
                  fill="#0a1520"
                  :fill-opacity="isOverview ? 0 : 0.52"
                  mask="url(#coupe-spotlight-mask)"
                  pointer-events="none"
                  style="transition: fill-opacity 0.6s ease;"
                />

                <!-- Zone active : contour lumineux par-dessus l'overlay -->
                <g v-if="activeZone && zonesVisible" pointer-events="none">
                  <rect
                    :x="activeZone.x"
                    :y="activeZone.y"
                    :width="activeZone.w"
                    :height="activeZone.h"
                    rx="8"
                    :stroke="COLORS.bleu"
                    stroke-width="5"
                    stroke-opacity="1"
                    fill="none"
                  />
                  <rect
                    :x="activeZone.x + 1"
                    :y="activeZone.y + 1"
                    :width="activeZone.w - 2"
                    :height="activeZone.h - 2"
                    rx="7"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-opacity="0.5"
                    fill="none"
                  />
                </g>

                <!-- Badges (numéros) : toujours visibles, actif = plus gros + bleu -->
                <g
                  v-for="(zone, i) in zones"
                  :key="'badge-' + zone.id"
                  @click.stop="selectZone(zone)"
                  @mouseenter="hovered = zone.id"
                  @mouseleave="hovered = null"
                  class="cursor-pointer"
                  :style="{ opacity: zonesVisible ? 1 : 0, transition: `opacity 0.45s ease ${0.15 + i * 0.1}s` }"
                >
                  <circle
                    v-if="isZoneActive(zone)"
                    :cx="zone.x + zone.w - 26"
                    :cy="zone.y + 26"
                    r="25"
                    fill="white"
                    fill-opacity="0.9"
                    pointer-events="none"
                  />
                  <circle
                    :cx="zone.x + zone.w - 26"
                    :cy="zone.y + 26"
                    :r="isZoneActive(zone) ? 21 : 17"
                    :fill="isZoneActive(zone) ? COLORS.bleu : COLORS.forest"
                    :fill-opacity="isZoneActive(zone) ? 1 : 0.75"
                    style="transition: fill-opacity 0.3s ease;"
                  />
                  <text
                    :x="zone.x + zone.w - 26"
                    :y="zone.y + (isZoneActive(zone) ? 32 : 31)"
                    text-anchor="middle"
                    fill="white"
                    :font-size="isZoneActive(zone) ? 16 : 14"
                    font-weight="700"
                    font-family="Georgia, serif"
                  >
                    {{ zone.badge }}
                  </text>
                </g>
              </svg>
            </div>

            <!-- Barre de progression -->
            <div
              v-if="imageReady"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-night/[0.08] overflow-hidden pointer-events-none z-10"
            >
              <div
                class="h-full transition-all duration-500 ease-out"
                :style="{
                  width: `${((activeStep + 1) / zoneCount) * 100}%`,
                  background: `linear-gradient(90deg, ${COLORS.bleu}, ${COLORS.forest}, ${COLORS.leaf})`
                }"
              />
            </div>
          </div>

          <!-- Card unique pleine largeur, collée sous la coupe -->
          <div class="w-full shrink-0">
            <transition name="card-swap" mode="out-in">
              <article
                v-if="imageReady && activeZone"
                :key="activeZone.id"
                class="w-full rounded-2xl border border-forest/12 bg-white shadow-[0_4px_24px_-4px_rgba(4,72,143,0.12),0_12px_40px_-12px_rgba(45,105,21,0.08)] overflow-hidden"
                role="region"
                :aria-label="activeZone.nom"
              >
                <div
                  class="h-1 w-full shrink-0 bg-gradient-to-r from-bleu via-forest to-leaf"
                  aria-hidden="true"
                />
                <div class="px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div class="flex items-center gap-4 sm:min-w-0 sm:shrink-0">
                    <span
                      class="flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold font-serif shrink-0"
                      :style="{ backgroundColor: COLORS.bleu }"
                    >
                      {{ activeZone.badge }}
                    </span>
                    <div class="min-w-0">
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-bleu mb-0.5">
                        {{ activeZone.etage }}
                      </p>
                      <h3 class="text-lg font-serif font-bold text-night leading-tight truncate">
                        {{ activeZone.nom }}
                      </h3>
                      <p class="text-xs text-forest/70 italic mt-0.5">{{ activeZone.nomKukama }}</p>
                    </div>
                  </div>
                  <div class="hidden sm:block w-px self-stretch bg-night/8" />
                  <p class="text-[13px] text-night/70 leading-relaxed flex-1 min-w-0">
                    {{ activeZone.description }}
                  </p>
                  <div class="hidden sm:flex flex-col items-center gap-1.5 shrink-0 pl-2">
                    <span
                      v-for="(_, si) in zonesSorted"
                      :key="si"
                      class="w-1.5 rounded-full transition-all duration-300"
                      :class="si === activeStep ? 'h-6' : 'h-1.5 opacity-30'"
                      :style="si === activeStep
                        ? { backgroundColor: COLORS.bleu }
                        : { backgroundColor: COLORS.forest }"
                    />
                  </div>
                </div>
              </article>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  omitSectionHeader: {
    type: Boolean,
    default: false
  }
})

const COLORS = {
  bleu: '#04488F',
  forest: '#2D6915',
  leaf: '#A6C639'
}

const IMG_W = 2647
const IMG_H = 1653

/** Marge autour de la zone active pour la découpe du spotlight (coordonnées plan) */
const SPOT_PAD = 50

/** Facteur de zoom quand une zone est active */
const ZOOM = 1.55

const zoneLayouts = [
  { id: 'tsumi', badge: '3', x: 1629, y: 713, w: 598, h: 298 },
  { id: 'iwrati', badge: '2', x: 1551, y: 1027, w: 720, h: 232 },
  { id: 'kuruara', badge: '1', x: 1588, y: 1277, w: 646, h: 232 },
  { id: 'tsakarita', badge: '4', x: 961, y: 1300, w: 582, h: 209 },
  { id: 'ikuachiru', badge: '5', x: 215, y: 1300, w: 730, h: 209 }
]

const zones = computed(() =>
  zoneLayouts.map((layout) => ({
    ...layout,
    etage: t(`musee.coupe.zones.${layout.id}.etage`),
    nom: t(`musee.coupe.zones.${layout.id}.nom`),
    nomKukama: t(`musee.coupe.zones.${layout.id}.nomKukama`),
    description: t(`musee.coupe.zones.${layout.id}.description`)
  }))
)

const zonesSorted = computed(() => [...zones.value].sort((a, b) => Number(a.badge) - Number(b.badge)))

const rootEl = ref(null)
const stageRef = ref(null)
const imageReady = ref(false)
const imageRevealed = ref(false)
const zonesVisible = ref(false)
const hovered = ref(null)
const activeStep = ref(0)

const zoneCount = computed(() => zonesSorted.value.length)
/** Total de « tranches » de scroll : intro + N zones + outro */
const totalSlices = computed(() => zoneCount.value + 2)

/**
 * activeStep :
 *  -1  = intro  (vue d'ensemble, pas de carte)
 *   0…N-1 = zones 1…N
 *   N  = outro  (vue d'ensemble, pas de carte)
 */
const activeZone = computed(() => {
  if (activeStep.value < 0 || activeStep.value >= zoneCount.value) return null
  return zonesSorted.value[activeStep.value] ?? null
})

const stageStyle = computed(() => ({
  minHeight: `${totalSlices.value * 100}vh`
}))

/**
 * Zoom + pan fluide : centre le viewport sur la zone active.
 * Calcule le translate nécessaire pour que le centre de la zone
 * se retrouve au centre de la vue visible (overflow clippé).
 * Clamp pour ne jamais montrer du vide hors image.
 */
/** true quand on est dans la zone intro ou outro (pas de zoom) */
const isOverview = computed(() => activeZone.value === null)

const zoomStyle = computed(() => {
  const z = activeZone.value
  if (!z || !zonesVisible.value) return { transform: 'scale(1) translate(0%, 0%)' }

  const cx = (z.x + z.w / 2) / IMG_W
  const cy = (z.y + z.h / 2) / IMG_H

  const halfVisible = 50 / ZOOM
  const maxT = 50 - halfVisible

  let tx = (0.5 - cx) * 100
  let ty = (0.5 - cy) * 100
  tx = Math.max(-maxT, Math.min(maxT, tx))
  ty = Math.max(-maxT, Math.min(maxT, ty))

  return {
    transform: `scale(${ZOOM}) translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%)`
  }
})

function isZoneActive(zone) {
  return activeZone.value?.id === zone.id
}

function zoneSortIndex(zone) {
  return zonesSorted.value.findIndex((z) => z.id === zone.id)
}

function selectZone(zone) {
  const i = zoneSortIndex(zone)
  if (i >= 0) activeStep.value = i
}

function onImageLoad() {
  imageReady.value = true
  if (imageRevealed.value) zonesVisible.value = true
}

let scrollRaf = null
function updateActiveStepFromScroll() {
  const stage = stageRef.value
  if (!stage || !totalSlices.value) return
  const vh = window.innerHeight
  const scrollable = stage.offsetHeight - vh
  if (scrollable <= 0) return
  const rect = stage.getBoundingClientRect()
  let progress = -rect.top / scrollable
  progress = Math.max(0, Math.min(1 - Number.EPSILON, progress))
  const sliceIdx = Math.min(Math.floor(progress * totalSlices.value), totalSlices.value - 1)
  // sliceIdx 0 = intro (-1), 1..N = zones 0..N-1, N+1 = outro (N)
  activeStep.value = sliceIdx - 1
}

function onScrollOrResize() {
  if (scrollRaf != null) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null
    updateActiveStepFromScroll()
  })
}

let enterObserver = null
onMounted(() => {
  enterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            imageRevealed.value = true
            setTimeout(() => {
              zonesVisible.value = true
            }, 1600)
          }, 200)
          enterObserver.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  if (rootEl.value) enterObserver.observe(rootEl.value)

  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
  requestAnimationFrame(() => {
    requestAnimationFrame(() => updateActiveStepFromScroll())
  })
})

onUnmounted(() => {
  if (enterObserver) enterObserver.disconnect()
  window.removeEventListener('scroll', onScrollOrResize)
  window.removeEventListener('resize', onScrollOrResize)
  if (scrollRaf != null) cancelAnimationFrame(scrollRaf)
})
</script>

<style scoped>
.coupe-image {
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.coupe-image.revealed {
  clip-path: inset(0% 0 0 0);
}

.coupe-zoomable {
  transform-origin: 50% 50%;
  transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.card-swap-enter-active {
  transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.card-swap-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}
.card-swap-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .coupe-image {
    transition: none;
    clip-path: inset(0% 0 0 0);
  }
  .coupe-zoomable {
    transition: none;
  }
  .card-swap-enter-active,
  .card-swap-leave-active {
    transition: none;
  }
  .card-swap-enter-from,
  .card-swap-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
