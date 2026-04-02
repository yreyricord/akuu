<template>
  <section ref="sectionRef" class="bg-gradient-to-r from-forest-800 via-forest to-forest-600 text-white py-16 md:py-20">
    <div class="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
      <div v-for="stat in stats" :key="stat.labelKey" class="flex flex-col items-center">
        <span class="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-2 tabular-nums">
          {{ stat.display }}{{ stat.suffix }}
        </span>
        <span class="text-leaf text-xs sm:text-sm uppercase tracking-[0.15em] font-medium">
          {{ $t(stat.labelKey) }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const sectionRef = ref(null)
const hasAnimated = ref(false)

const stats = reactive([
  { value: 2016, display: '2016', suffix: '', labelKey: 'stats.founded', isYear: true },
  { value: 10, display: '0', suffix: ' ans', labelKey: 'stats.years', isYear: false },
  { value: 3, display: '0', suffix: '', labelKey: 'stats.village', isYear: false },
  { value: 150, display: '0', suffix: '+', labelKey: 'stats.volunteers', isYear: false }
])

useIntersectionObserver(sectionRef, ([{ isIntersecting }]) => {
  if (isIntersecting && !hasAnimated.value) {
    hasAnimated.value = true
    stats.forEach((stat) => {
      if (stat.isYear) {
        stat.display = String(stat.value)
        return
      }
      let current = 0
      const duration = 1500
      const stepTime = 16
      const totalSteps = duration / stepTime
      const increment = stat.value / totalSteps
      const interval = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          stat.display = String(stat.value)
          clearInterval(interval)
        } else {
          stat.display = String(Math.round(current))
        }
      }, stepTime)
    })
  }
})
</script>
