<template>
  <!--
    Tous les chiffres « créatifs » (durées, zooms, % d’image, dégradés) sont dans
    forestScrollScene.tuning.js. Ici : structure des calques et liaison des styles.
  -->
  <div ref="containerEl" class="forest-scene" :style="sceneCssVars">
    <!--
      pile : ciel (2.svg) en dessous, arbres (1.svg) au-dessus ; les deux centrés
      dans la scène (object-position + transform-origin au centre).
    -->
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

    <!-- Cadre + masque haut : même boîte que le SVG affiché (contain + centre) -->
    <div class="forest-frame" aria-hidden="true" :style="frameLayoutStyle" />
    <div class="forest-top-mask" aria-hidden="true" :style="topMaskCombinedStyle" />

    <div class="forest-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  forestSceneTuning,
  forestScrollEasings
} from './forestScrollScene.tuning.js'

const T = forestSceneTuning

/** Easing choisi dans le tuning ; repli sur easeOutCubic si le nom est invalide. */
const easeFn =
  forestScrollEasings[T.scroll.easing] ?? forestScrollEasings.easeOutCubic

/**
 * Variables CSS injectées sur la racine : le bloc <style> lit var(--forest-…).
 * Ainsi, hauteur de scène et keyframes du ciel restent pilotés
 * par forestScrollScene.tuning.js sans dupliquer les nombres en dur dans le CSS.
 */
const sceneCssVars = computed(() => ({
  '--forest-scene-min-h': `${T.scene.minHeightPx}px`,
  '--forest-scene-pref-vw': `${T.scene.preferredVw}vw`,
  '--forest-scene-pref-vh': `${T.scene.preferredVh}vh`,
  '--forest-scene-max-h': `${T.scene.maxHeightPx}px`,
  '--forest-scene-bg': T.scene.background,
  '--forest-sky-ambient-duration': `${T.sky.ambient.durationSec}s`,
  '--forest-sky-ambient-easing': T.sky.ambient.timingFunction,
  '--forest-sky-ambient-x-end': `${T.sky.ambient.translateEndXPx}px`,
  '--forest-sky-ambient-y-end': `${T.sky.ambient.translateEndYPx}px`,
  '--forest-sky-ambient-rot-end': `${T.sky.ambient.rotateEndDeg}deg`,
  '--forest-content-pad': T.content.padding,
  '--forest-frame-border-w': `${T.frame.borderWidthPx}px`,
  '--forest-frame-border-color': T.frame.borderColor,
  '--forest-frame-inner-glow': T.frame.innerHighlight
}))

const topMaskColor = computed(
  () => T.frame.topMaskColor || T.scene.background
)

/**
 * Rectangle du rendu réel du SVG ciel (object-fit: contain, centré), en coordonnées
 * du conteneur .forest-stack (= même boîte que les <img>).
 */
const skyImgRef = ref(null)
const svgFrameRect = ref({ left: 0, top: 0, width: 0, height: 0 })
/** Taille du .forest-stack (pour clip-path inset) */
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

/** Retrait clip / masque : intérieur du liseré, pas le bord extérieur du cadre. */
const frameClipInsetPx = computed(() => {
  const c = T.frame.clipInsetPx
  if (typeof c === 'number' && c >= 0) return c
  return T.frame.borderWidthPx + 1
})

/** Rectangle utile à l’intérieur du cadre décoratif (pour clip + masque haut). */
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

/** Hors de cette fenêtre intérieure, les calques SVG ne sont pas peints. */
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
/** Entre 0 et 1 après easing ; 0 = début d’entrée du bloc dans le viewport, 1 = effet terminé. */
const scrollProgress = ref(0)

/** Zoom léger + drift horizontal du ciel en fonction de scrollProgress. */
const skyScrollStyle = computed(() => {
  const t = scrollProgress.value
  const { scaleStart, scaleEnd, driftXMaxPx, transformOrigin } = T.sky.scroll
  const s = scaleEnd + (scaleStart - scaleEnd) * (1 - t)
  const skyX = (t - 0.5) * 2 * driftXMaxPx
  return {
    transform: `translate3d(${skyX.toFixed(2)}px, 0, 0) scale(${s.toFixed(4)})`,
    transformOrigin
  }
})

/**
 * Arbres : invisibles à t=0, puis entrée depuis le bas-droite (translate + scale)
 * et fondu jusqu’à l’état final (voir tuning.trees.scroll).
 */
const treesLayerStyle = computed(() => {
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

/**
 * Met à jour scrollProgress à partir de la position du bloc dans la fenêtre.
 *
 * Formule du brut : (vh - rect.top) / (vh + rect.height)
 * - Quand le haut du bloc est encore sous le bas de l’écran (rect.top > vh),
 *   le numérateur est ≤ 0 → brut ≤ 0 → après clamp, t = 0.
 * - Quand le bloc remonte, rect.top diminue, le rapport augmente vers 1.
 * - Le dénominateur (vh + hauteur du bloc) étire la plage pour que la transition
 *   se fasse sur une distance de scroll proportionnelle à la taille du composant.
 *
 * Ensuite : clamp [0,1], puis application de l’easing défini dans le tuning.
 */
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
  compute()
  measureSvgFrame()
}

/** Un seul calcul par frame (requestAnimationFrame) pour éviter de surcharger le scroll. */
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
})
</script>

<style scoped>
/* Hauteur et fond : variables --forest-scene-* (voir forestScrollScene.tuning.js → scene) */
.forest-scene {
  position: relative;
  width: 100%;
  height: clamp(
    var(--forest-scene-min-h),
    min(var(--forest-scene-pref-vw), var(--forest-scene-pref-vh)),
    var(--forest-scene-max-h)
  );
  overflow: hidden;
  background: var(--forest-scene-bg);
  isolation: isolate;
}

/* clip-path inline (stackClipStyle) = rectangle du cadre SVG */
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

/* Animation lente du ciel : durée / easing / extrémités via variables du tuning */
@media (prefers-reduced-motion: no-preference) {
  .forest-sky-edge-motion {
    animation-name: forestSkyEdge;
    animation-duration: var(--forest-sky-ambient-duration);
    animation-timing-function: var(--forest-sky-ambient-easing);
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
}

/* 0 % = repos ; 100 % = valeurs sky.ambient.* du fichier tuning */
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

/*
 * Même cadre pour ciel et arbres : tout le plan, object-fit contain = pas de crop,
 * images centrées dans la scène ; resize identique entre les deux.
 */
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

/* Bordure : position/taille = boîte du SVG (voir measureSvgFrame) */
.forest-frame {
  position: absolute;
  z-index: 8;
  pointer-events: none;
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 var(--forest-frame-border-w) var(--forest-frame-border-color),
    inset 0 0 0 calc(var(--forest-frame-border-w) + 1px) var(--forest-frame-inner-glow);
}

/*
 * Masque haut : même ton que le fond (ou tuning) pour cacher l’entrée des calques
 * au scroll ; le dégradé évite une ligne dure sous le cadre.
 */
.forest-top-mask {
  position: absolute;
  top: 0;
  z-index: 9;
  pointer-events: none;
  box-sizing: border-box;
}

.forest-content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--forest-content-pad);
}

/* Pas de mouvement : état figé lisible pour les personnes sensibles au mouvement */
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

  /* État final lisible : pas d’entrée animée, arbres visibles comme le ciel */
  .forest-img--trees {
    opacity: 1 !important;
  }
}
</style>
