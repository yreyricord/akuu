<template>
  <section
    ref="sectionRef"
    class="relative overflow-hidden border-b border-forest/15 bg-gradient-to-r from-forest via-forest/95 to-night text-white"
    aria-labelledby="home-anniversary-heading"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.07]"
      style="background-image: radial-gradient(circle at 20% 50%, #A6C639 0, transparent 45%), radial-gradient(circle at 80% 80%, #fff 0, transparent 40%);"
      aria-hidden="true"
    />

    <div class="relative container-narrow px-6 py-10 md:py-12">
      <div class="max-w-3xl mx-auto text-center">
        <p class="text-leaf/90 text-xs font-bold uppercase tracking-[0.28em] mb-3">
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

        <p class="text-leaf/90 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] mb-5">
          {{ $t('stats.years') }}
        </p>

        <p class="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          {{ $t('home_anniversary.subtitle') }}
        </p>
      </div>

      <div
        class="mt-10 md:mt-12 pt-8 md:pt-10 border-t border-white/10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 lg:gap-10 text-center"
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
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/** Durée en ms du compteur animé (bandeau anniversaire + chiffres). À ajuster ici. */
const STATS_COUNT_DURATION_MS = 3000

const sectionRef = ref(null)
const hasAnimated = ref(false)

const yearsDisplay = ref('0')
const villagesDisplay = ref('0')
const volunteersDisplay = ref('0')
const projectsDisplay = ref('0')
const beneficiariesDisplay = ref('0')

function animateCount (target, setDisplay, duration = STATS_COUNT_DURATION_MS) {
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

useIntersectionObserver(sectionRef, ([{ isIntersecting }]) => {
  if (!isIntersecting || hasAnimated.value) return
  hasAnimated.value = true
  animateCount(10, (v) => { yearsDisplay.value = v })
  animateCount(3, (v) => { villagesDisplay.value = v })
  animateCount(150, (v) => { volunteersDisplay.value = v })
  animateCount(10, (v) => { projectsDisplay.value = v })
  animateCount(500, (v) => { beneficiariesDisplay.value = v })
})
</script>
