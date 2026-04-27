<template>
  <section
    ref="sectionRef"
    class="relative overflow-hidden border-b border-forest/15 text-white"
    aria-labelledby="home-anniversary-heading"
  >
    <!-- Photo visible à travers un seul voile dégradé (évite le « tout noir ») -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <img
        src="/images/mission-akuu.jpg"
        alt=""
        class="h-full w-full object-cover object-center scale-105 brightness-[0.72] saturate-[0.92]"
        loading="lazy"
        decoding="async"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-forest/78 via-night/68 to-night/80"
      />
    </div>
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.1]"
      style="background-image: radial-gradient(circle at 22% 45%, rgba(166, 198, 57, 0.28) 0, transparent 44%), radial-gradient(circle at 78% 72%, rgba(12, 13, 13, 0.22) 0, transparent 48%);"
      aria-hidden="true"
    />

    <div class="relative z-[1] container-narrow px-6 py-10 md:py-12">
      <!-- Boîte lisible sur la photo : fond + flou, montée légère au scroll -->
      <div
        class="anniversary-card mx-auto max-w-5xl rounded-2xl border border-white/20 bg-night/55 px-6 py-8 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md backdrop-saturate-150 md:rounded-3xl md:px-10 md:py-10"
        :class="contentRevealed ? 'anniversary-card--in' : 'anniversary-card--idle'"
      >
        <div class="max-w-3xl mx-auto text-center">
          <p class="text-leaf text-xs font-bold uppercase tracking-[0.28em] mb-3">
            {{ $t('home_anniversary.badge') }}
          </p>

          <h2
            id="home-anniversary-heading"
            class="font-serif font-bold leading-[1.1] text-white mb-3 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-2xl sm:text-3xl md:text-4xl"
          >
            <span>{{ $t('home_anniversary.title_before') }}</span>
            <span class="text-4xl sm:text-5xl md:text-6xl text-leaf tabular-nums tracking-tight min-w-[2ch]">{{ yearsDisplay }}</span>
            <span>{{ $t('home_anniversary.title_after') }}</span>
          </h2>

          <p class="text-leaf text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] mb-5">
            {{ $t('stats.years') }}
          </p>

          <p class="text-white text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {{ $t('home_anniversary.subtitle') }}
          </p>
        </div>

        <div
          class="mt-8 grid max-w-5xl grid-cols-2 gap-8 border-t border-white/15 pt-8 text-center md:mt-10 md:grid-cols-4 md:gap-6 lg:gap-10 md:pt-10 mx-auto"
        >
        <div class="flex flex-col items-center">
          <span class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tabular-nums text-white mb-2">
            {{ villagesDisplay }}
          </span>
          <span class="text-leaf text-xs sm:text-sm uppercase tracking-[0.15em] font-medium leading-snug">
            {{ $t('stats.village') }}
          </span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tabular-nums text-white mb-2">
            {{ volunteersDisplay }}<span class="text-leaf">+</span>
          </span>
          <span class="text-leaf text-xs sm:text-sm uppercase tracking-[0.15em] font-medium leading-snug">
            {{ $t('stats.volunteers') }}
          </span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tabular-nums text-white mb-2">
            {{ projectsDisplay }}<span class="text-leaf">+</span>
          </span>
          <span class="text-leaf text-xs sm:text-sm uppercase tracking-[0.15em] font-medium leading-snug">
            {{ $t('stats.projects') }}
          </span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tabular-nums text-white mb-2">
            {{ beneficiariesDisplay }}<span class="text-leaf">+</span>
          </span>
          <span class="text-leaf text-xs sm:text-sm uppercase tracking-[0.15em] font-medium leading-snug">
            {{ $t('stats.beneficiaries') }}
          </span>
        </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/** Durée en ms du compteur animé (bandeau anniversaire + chiffres). À ajuster ici. */
const STATS_COUNT_DURATION_MS = 3000

const sectionRef = ref(null)
const hasAnimated = ref(false)
const contentRevealed = ref(false)

const yearsDisplay = ref('10')
const villagesDisplay = ref('3')
const volunteersDisplay = ref('150')
const projectsDisplay = ref('10')
const beneficiariesDisplay = ref('500')

function animateCount (target, setDisplay, duration = STATS_COUNT_DURATION_MS) {
  setDisplay('0')
  const stepTime = 16
  const totalSteps = Math.max(1, duration / stepTime)
  const increment = target / totalSteps
  let current = 0
  const interval = setInterval(() => {
    current += increment
    if (current >= target) {
      setDisplay(String(target))
      clearInterval(interval)
    } else {
      setDisplay(String(Math.round(current)))
    }
  }, stepTime)
}

useIntersectionObserver(
  sectionRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      contentRevealed.value = true
    }
    if (!isIntersecting || hasAnimated.value) return
    hasAnimated.value = true
    animateCount(10, (v) => { yearsDisplay.value = v })
    animateCount(3, (v) => { villagesDisplay.value = v })
    animateCount(150, (v) => { volunteersDisplay.value = v })
    animateCount(10, (v) => { projectsDisplay.value = v })
    animateCount(500, (v) => { beneficiariesDisplay.value = v })
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
)

onMounted(() => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    contentRevealed.value = true
  }
})
</script>

<style scoped>
.anniversary-card {
  transition:
    opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.65s ease;
  will-change: opacity, transform;
}

.anniversary-card--idle {
  opacity: 0;
  transform: translate3d(0, 1.25rem, 0);
}

.anniversary-card--in {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

/* Texte lisible sur le panneau (léger relief sans halo excessif) */
.anniversary-card {
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .anniversary-card,
  .anniversary-card--idle,
  .anniversary-card--in {
    opacity: 1 !important;
    transform: none !important;
    transition: none;
  }
}
</style>
