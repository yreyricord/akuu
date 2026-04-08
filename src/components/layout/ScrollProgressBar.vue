<template>
  <!--
    Barre horizontale sous la rangée du menu (top-16 / md:top-20 = h du flex nav).
    z-40 : sous la nav (z-50), donc sous le logo qui dépasse du bandeau blanc.
  -->
  <div
    class="pointer-events-none fixed left-0 right-0 top-16 md:top-20 z-40 h-1.5 sm:h-[9px] motion-reduce:h-[3px] overflow-hidden bg-night/10 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]"
    :class="showBar ? 'opacity-100' : 'opacity-0'"
    role="progressbar"
    :aria-valuenow="ariaNow"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="$t('common.scroll_progress_aria')"
    :aria-hidden="showBar ? 'false' : 'true'"
  >
    <div
      class="h-full w-full origin-left motion-safe:transition-transform motion-safe:duration-100 motion-safe:ease-out will-change-transform"
      :style="barStyle"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

/** Pixels scrollables minimum pour afficher la barre (évite un flash sur pages courtes) */
const MIN_SCROLLABLE_PX = 280

const route = useRoute()
const progress = ref(0)
const scrollablePx = ref(0)
const mounted = ref(false)

const showBar = computed(
  () => mounted.value && scrollablePx.value >= MIN_SCROLLABLE_PX
)

const ariaNow = computed(() => Math.round(progress.value * 100))

const barStyle = computed(() => ({
  transform: `scaleX(${progress.value})`,
  background: 'linear-gradient(90deg, #04488F, #2D6915, #A6C639)'
}))

function measure() {
  const el = document.documentElement
  const body = document.body
  const h = Math.max(
    el.scrollHeight,
    body.scrollHeight
  )
  const vh = window.innerHeight
  const max = h - vh
  scrollablePx.value = max
  if (max <= 0) {
    progress.value = 0
    return
  }
  progress.value = Math.min(1, Math.max(0, window.scrollY / max))
}

let raf = null
function onScrollOrResize() {
  if (raf != null) return
  raf = requestAnimationFrame(() => {
    raf = null
    measure()
  })
}

onMounted(() => {
  mounted.value = true
  measure()
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
  window.visualViewport?.addEventListener('resize', onScrollOrResize, { passive: true })
  window.visualViewport?.addEventListener('scroll', onScrollOrResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScrollOrResize)
  window.removeEventListener('resize', onScrollOrResize)
  window.visualViewport?.removeEventListener('resize', onScrollOrResize)
  window.visualViewport?.removeEventListener('scroll', onScrollOrResize)
  if (raf != null) cancelAnimationFrame(raf)
})

watch(
  () => route.path,
  () => {
    nextTick(() => {
      requestAnimationFrame(() => measure())
    })
  }
)
</script>
