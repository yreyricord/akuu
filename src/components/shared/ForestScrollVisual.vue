<template>
  <div
    class="forest-visual-root relative w-full min-w-0 max-w-full"
    :class="wrapperClass"
    :aria-hidden="ariaHidden ? true : undefined"
  >
    <template v-if="showDecor">
      <div
        class="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 md:-bottom-4 md:-left-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-leaf/20 rounded-2xl -z-10"
        aria-hidden="true"
      />
      <div
        class="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 md:-top-4 md:-right-4 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-ochre/10 rounded-full -z-10"
        aria-hidden="true"
      />
    </template>

    <div
      ref="containerEl"
      class="forest-scene relative w-full overflow-hidden rounded-2xl shadow-xl"
      :class="[
        { 'forest-scene--height-fixed': sceneUsesFixedHeight },
        onDark ? 'ring-1 ring-white/20' : 'ring-1 ring-night/10'
      ]"
      :style="sceneCssVars"
      :role="ariaHidden ? undefined : 'img'"
      :aria-label="ariaHidden ? undefined : sceneLabel || undefined"
    >
      <div class="forest-stack" aria-hidden="true" :style="stackClipStyle">
        <div class="forest-plane forest-plane--sky">
          <div class="forest-sky-edge-motion">
            <img
              ref="skyImgRef"
              src="/images/svg/2.svg"
              class="forest-img forest-img--sky"
              :style="skyScrollStyle"
              alt=""
              draggable="false"
              loading="eager"
              fetchpriority="high"
              @load="measureSvgFrame"
            />
          </div>
        </div>
        <div class="forest-plane forest-plane--trees">
          <img
            src="/images/svg/1.svg"
            class="forest-img forest-img--trees"
            :style="treesLayerStyle"
            alt=""
            draggable="false"
            loading="eager"
          />
        </div>
      </div>

      <div class="forest-atmo" aria-hidden="true" :style="atmoStyle" />
      <div class="forest-vignette" aria-hidden="true" :style="vignetteStyle" />

      <div class="forest-frame" aria-hidden="true" :style="frameLayoutStyle" />
      <div class="forest-top-mask" aria-hidden="true" :style="topMaskCombinedStyle" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  forestSceneTuning,
  forestScrollEasings
} from './forestScrollScene.tuning.js'

defineProps({
  /** Anneau / contraste sur fond sombre (ex. bandeau). */
  onDark: { type: Boolean, default: false },
  /** Carré leaf + pastille ochre derrière la carte. */
  showDecor: { type: Boolean, default: true },
  /** Classes sur le conteneur relatif (ex. fade-in-up). */
  wrapperClass: { type: [String, Array, Object], default: '' },
  /** Accessibilité : remplace l’ancien alt de la photo mission. */
  sceneLabel: { type: String, default: '' },
  /**
   * Si le visuel est dans un lien : masque l’arbre ARIA (le lien porte le libellé).
   */
  ariaHidden: { type: Boolean, default: false }
})

const T = forestSceneTuning

const sceneUsesFixedHeight = computed(
  () => typeof T.scene.heightCss === 'string' && T.scene.heightCss.length > 0
)

const easeFn =
  forestScrollEasings[T.scroll.easing] ?? forestScrollEasings.easeOutCubic

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const sceneCssVars = computed(() => {
  const o = {
    '--forest-aspect-ratio': T.scene.aspectRatio,
    '--forest-scene-min-h': `${T.scene.minHeightPx}px`,
    '--forest-scene-max-h': `${T.scene.maxHeightPx}px`,
    '--forest-scene-bg': T.scene.background,
    '--forest-sky-ambient-duration': `${T.sky.ambient.durationSec}s`,
    '--forest-sky-ambient-easing': T.sky.ambient.timingFunction,
    '--forest-sky-ambient-x-end': `${T.sky.ambient.translateEndXPx}px`,
    '--forest-sky-ambient-y-end': `${T.sky.ambient.translateEndYPx}px`,
    '--forest-sky-ambient-rot-end': `${T.sky.ambient.rotateEndDeg}deg`,
    '--forest-frame-border-w': `${T.frame.borderWidthPx}px`,
    '--forest-frame-border-color': T.frame.borderColor,
    '--forest-frame-inner-glow': T.frame.innerHighlight
  }
  if (sceneUsesFixedHeight.value) {
    o['--forest-scene-fixed-h'] = T.scene.heightCss
  }
  return o
})

const topMaskColor = computed(
  () => T.frame.topMaskColor || T.scene.background
)

const skyImgRef = ref(null)
const svgFrameRect = ref({ left: 0, top: 0, width: 0, height: 0 })
const stackSize = ref({ w: 0, h: 0 })

function measureSvgFrame() {
  const img = skyImgRef.value
  if (!img) return
  const W = img.clientWidth
  const H = img.clientHeight
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!W || !H || !nw || !nh) {
    svgFrameRect.value = { left: 0, top: 0, width: 0, height: 0 }
    stackSize.value = { w: 0, h: 0 }
    return
  }
  stackSize.value = { w: W, h: H }
  const s = Math.min(W / nw, H / nh)
  const dw = nw * s
  const dh = nh * s
  const ox = (W - dw) / 2
  const oy = (H - dh) / 2
  svgFrameRect.value = { left: ox, top: oy, width: dw, height: dh }
}

const frameClipInsetPx = computed(() => {
  const c = T.frame.clipInsetPx
  if (typeof c === 'number' && c >= 0) return c
  return T.frame.borderWidthPx + 1
})

const svgClipInnerRect = computed(() => {
  const r = svgFrameRect.value
  const inset = frameClipInsetPx.value
  const iw = r.width - 2 * inset
  const ih = r.height - 2 * inset
  if (iw < 1 || ih < 1 || r.width < 1) return null
  return {
    left: r.left + inset,
    top: r.top + inset,
    width: iw,
    height: ih
  }
})

const stackClipStyle = computed(() => {
  const inner = svgClipInnerRect.value
  const { w, h } = stackSize.value
  if (!inner || w < 1 || h < 1) return {}
  const right = Math.max(0, w - inner.left - inner.width)
  const bottom = Math.max(0, h - inner.top - inner.height)
  return {
    clipPath: `inset(${inner.top}px ${right}px ${bottom}px ${inner.left}px)`
  }
})

const frameLayoutStyle = computed(() => {
  const r = svgFrameRect.value
  if (r.width < 1 || r.height < 1) {
    return { visibility: 'hidden' }
  }
  return {
    visibility: 'visible',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`
  }
})

const topMaskCombinedStyle = computed(() => {
  const inner = svgClipInnerRect.value
  const stop = Math.min(100, Math.max(0, T.frame.topMaskOpaqueStopPct))
  const c = topMaskColor.value
  const bg = `linear-gradient(180deg, ${c} 0%, ${c} ${stop}%, transparent 100%)`
  if (!inner) {
    return { background: bg, visibility: 'hidden' }
  }
  return {
    visibility: 'visible',
    background: bg,
    left: `${inner.left}px`,
    width: `${inner.width}px`,
    height: `${T.frame.topMaskHeightPx}px`
  }
})

const atmoStyle = computed(() => ({
  background: T.atmo.gradient,
  mixBlendMode: T.atmo.mixBlendMode
}))

const vignetteStyle = computed(() => ({
  background: T.vignette.gradient
}))

const containerEl = ref(null)
const scrollProgress = ref(0)

const skyScrollStyle = computed(() => {
  if (prefersReducedMotion) return {}
  const t = scrollProgress.value
  const { scaleStart, scaleEnd, driftXMaxPx, transformOrigin } = T.sky.scroll
  const s = scaleEnd + (scaleStart - scaleEnd) * (1 - t)
  const skyX = (t - 0.5) * 2 * driftXMaxPx
  return {
    transform: `translate3d(${skyX.toFixed(2)}px, 0, 0) scale(${s.toFixed(4)})`,
    transformOrigin
  }
})

const treesLayerStyle = computed(() => {
  if (prefersReducedMotion) {
    return {
      opacity: T.trees.scroll.endOpacity,
      filter: `drop-shadow(${T.trees.dropShadow})`
    }
  }
  const t = scrollProgress.value
  const {
    startOpacity,
    endOpacity,
    arriveFromRightPx,
    arriveFromBottomPx,
    scaleStart,
    scaleEnd,
    visualScale,
    transformOrigin
  } = T.trees.scroll
  const tx = (1 - t) * arriveFromRightPx
  const ty = (1 - t) * arriveFromBottomPx
  const s = (scaleEnd + (scaleStart - scaleEnd) * (1 - t)) * visualScale
  const opacity = startOpacity + (endOpacity - startOpacity) * t
  return {
    transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`,
    transformOrigin,
    opacity,
    filter: `drop-shadow(${T.trees.dropShadow})`
  }
})

let rafId = null
let resizeRafId = null

function compute() {
  const el = containerEl.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight

  const raw = (vh - rect.top) / (vh + rect.height)
  const clamped = Math.max(0, Math.min(1, raw))
  scrollProgress.value = easeFn(clamped)
}

function onWindowResize() {
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null
    compute()
  })
}

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    compute()
    rafId = null
  })
}

let resizeObserver = null

onMounted(async () => {
  compute()
  await nextTick()
  measureSvgFrame()

  resizeObserver = new ResizeObserver(() => {
    measureSvgFrame()
  })
  if (containerEl.value) resizeObserver.observe(containerEl.value)
  if (skyImgRef.value) resizeObserver.observe(skyImgRef.value)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onWindowResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onWindowResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (rafId) cancelAnimationFrame(rafId)
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
})
</script>

<style scoped>
.forest-scene {
  aspect-ratio: var(--forest-aspect-ratio);
  min-height: var(--forest-scene-min-h);
  max-height: var(--forest-scene-max-h);
  max-width: 100%;
  margin-inline: auto;
  background: var(--forest-scene-bg);
  isolation: isolate;
}

.forest-scene--height-fixed {
  aspect-ratio: unset;
  height: var(--forest-scene-fixed-h);
}

.forest-stack {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.forest-plane {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.forest-plane--sky {
  z-index: 1;
}

.forest-plane--trees {
  z-index: 2;
}

.forest-sky-edge-motion {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .forest-sky-edge-motion {
    animation-name: forestSkyEdge;
    animation-duration: var(--forest-sky-ambient-duration);
    animation-timing-function: var(--forest-sky-ambient-easing);
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
}

@keyframes forestSkyEdge {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(
        var(--forest-sky-ambient-x-end),
        var(--forest-sky-ambient-y-end),
        0
      )
      rotate(var(--forest-sky-ambient-rot-end));
  }
}

.forest-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  object-fit: contain;
  object-position: center center;
  pointer-events: none;
  user-select: none;
  will-change: transform;
  backface-visibility: hidden;
}

.forest-atmo {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.forest-vignette {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.forest-frame {
  position: absolute;
  z-index: 8;
  pointer-events: none;
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 var(--forest-frame-border-w) var(--forest-frame-border-color),
    inset 0 0 0 calc(var(--forest-frame-border-w) + 1px) var(--forest-frame-inner-glow);
}

.forest-top-mask {
  position: absolute;
  top: 0;
  z-index: 9;
  pointer-events: none;
  box-sizing: border-box;
}

@media (prefers-reduced-motion: reduce) {
  .forest-sky-edge-motion {
    animation: none;
  }

  .forest-img {
    will-change: auto;
    transform: none !important;
    filter: none !important;
    width: 100%;
    height: 100%;
  }

  .forest-img--trees {
    opacity: 1 !important;
  }
}
</style>
