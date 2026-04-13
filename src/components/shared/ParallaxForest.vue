<template>
  <div ref="containerEl" class="parallax-forest">
    <!-- Couche 3 — ciel (la plus lente) -->
    <img
      src="/images/svg/3.svg"
      class="parallax-layer"
      :style="{ transform: `translateY(${offsets[0]}px)` }"
      alt=""
      draggable="false"
      loading="eager"
      fetchpriority="high"
    />
    <!-- Couche 2 — arbre milieu -->
    <img
      src="/images/svg/2.svg"
      class="parallax-layer"
      :style="{ transform: `translateY(${offsets[1]}px)` }"
      alt=""
      draggable="false"
      loading="eager"
    />
    <!-- Couche 1 — premier plan (la plus rapide) -->
    <img
      src="/images/svg/1.svg"
      class="parallax-layer"
      :style="{ transform: `translateY(${offsets[2]}px)` }"
      alt=""
      draggable="false"
      loading="eager"
    />

    <!-- Contenu textuel par-dessus -->
    <div class="parallax-content">
      <slot />
    </div>

    <!-- Fondu bas -->
    <div class="parallax-fade" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// Vitesses relatives : 0 = fixe, 1 = vitesse max
// [ciel, arbre, premier-plan]
const SPEEDS   = [0, 0.3, 0.65]
const MAX_SHIFT = 90  // px de déplacement vertical max

const containerEl = ref(null)
const offsets = reactive([0, 0, 0])

let rafId = null

function compute() {
  const el = containerEl.value
  if (!el) return

  const rect = containerEl.value.getBoundingClientRect()
  const vh   = window.innerHeight

  // 0 = le composant vient d'entrer en bas du viewport
  // 1 = il vient de sortir par le haut
  const raw  = (vh - rect.top) / (vh + rect.height)
  const prog = Math.max(0, Math.min(1, raw))

  SPEEDS.forEach((speed, i) => {
    offsets[i] = -(prog * MAX_SHIFT * speed)
  })
}

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    compute()
    rafId = null
  })
}

onMounted(() => {
  compute()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', compute,  { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', compute)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.parallax-forest {
  position: relative;
  width: 100%;
  height: clamp(320px, 50vw, 640px);
  overflow: hidden;
  background: #1b2d3a;
}

.parallax-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: calc(100% + 90px); /* absorbe le déplacement max */
  object-fit: cover;
  object-position: center center;
  pointer-events: none;
  user-select: none;
  will-change: transform;
}

.parallax-content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

/* Fondu vers le fond de page (cream) */
.parallax-fade {
  position: absolute;
  inset-x: 0;
  bottom: 0;
  height: 100px;
  background: linear-gradient(to bottom, transparent, theme('colors.cream.DEFAULT', #FEFDFC));
  z-index: 6;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-layer {
    will-change: auto;
    transform: none !important;
    height: 100%;
  }
}
</style>
