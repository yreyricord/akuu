<template>
  <div class="min-h-screen bg-cream px-6 py-24">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-5xl md:text-6xl font-serif font-bold text-night mb-4 fade-in-up">{{ $t('formation.page_title') }}</h1>
      <p class="text-night/60 text-lg leading-relaxed mb-16 fade-in-up">{{ $t('formation.intro') }}</p>

      <div ref="riverContainerRef" class="relative">
        <svg
          ref="riverSvgRef"
          class="river-path absolute inset-0 w-full h-full pointer-events-none text-[#8B5E34] z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M50,0 C50,4.5 74,4.5 74,9 C74,13.5 32,13.5 32,18 C32,22.5 58,22.5 58,27 C58,31.5 18,31.5 18,36 C18,40.5 66,40.5 66,45 C66,50 46,50 46,55 C46,59.5 90,59.5 90,64 C90,68.5 36,68.5 36,73 C36,77.5 60,77.5 60,82 C60,85 40,85 40,88"
            fill="none"
            stroke="currentColor"
            stroke-width="0.4"
            stroke-linecap="round"
            stroke-dasharray="2 0.6"
            opacity="0.45"
          />
        </svg>

        <section
          v-for="(group, groupIndex) in FORMATION_GROUPS"
          :key="group.id"
          class="fade-in-up relative"
          :class="{ 'mt-16': groupIndex > 0 }"
        >
          <div class="relative h-48 md:h-72 rounded-3xl overflow-hidden mb-8">
            <img
              :src="group.image"
              :alt="$t(`formation.groups.group_${group.id}.title`)"
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-transparent" />
            <div class="absolute inset-x-0 bottom-0 p-5 md:p-6 flex items-center gap-3">
              <span class="w-8 h-1.5 rounded-full" :class="ACCENT_CLASSES[group.accent].rule" />
              <h2 class="text-white font-serif font-bold text-2xl md:text-4xl">
                {{ $t(`formation.groups.group_${group.id}.title`) }}
              </h2>
            </div>
          </div>
          <p class="relative text-night/60 mb-8">{{ $t(`formation.groups.group_${group.id}.description`) }}</p>

          <div
            v-for="(mod, modIndex) in modulesForGroup(group.id)"
            :key="mod.id"
            class="fade-in-up relative grid grid-cols-2 gap-6 items-center py-3"
          >
            <router-link
              v-if="modIndex % 2 === 0"
              :to="`/formation/module-${mod.id}`"
              class="justify-self-end flex items-center gap-3 text-right bg-white rounded-2xl px-4 py-3 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group"
            >
              <span class="text-night font-semibold leading-snug">
                {{ $t(`formation.modules.module_${mod.id}.title`) }}
              </span>
              <span
                class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-110"
                :class="ACCENT_CLASSES[group.accent].badge"
              >
                {{ String(mod.id).padStart(2, '0') }}
              </span>
            </router-link>
            <span v-else />

            <router-link
              v-if="modIndex % 2 === 1"
              :to="`/formation/module-${mod.id}`"
              class="justify-self-start flex items-center gap-3 text-left bg-white rounded-2xl px-4 py-3 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group"
            >
              <span
                class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-110"
                :class="ACCENT_CLASSES[group.accent].badge"
              >
                {{ String(mod.id).padStart(2, '0') }}
              </span>
              <span class="text-night font-semibold leading-snug">
                {{ $t(`formation.modules.module_${mod.id}.title`) }}
              </span>
            </router-link>
            <span v-else />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'
import { FORMATION_GROUPS, ACCENT_CLASSES, modulesForGroup } from '@/data/formation-modules.js'

useScrollAnimation()

// Draws the river progressively as the page scrolls: reveal% tracks where
// the viewport's vertical center sits within the river container's span,
// applied as a CSS mask so the existing dash texture/flow animation on the
// path itself is untouched.
const riverContainerRef = ref(null)
const riverSvgRef = ref(null)
let rafId = null

function updateRiverReveal () {
  rafId = null
  const container = riverContainerRef.value
  const svg = riverSvgRef.value
  if (!container || !svg) return
  const rect = container.getBoundingClientRect()
  if (rect.height === 0) return
  const progress = (window.innerHeight / 2 - rect.top) / rect.height
  const clamped = Math.min(1, Math.max(0, progress))
  svg.style.setProperty('--river-reveal', `${(clamped * 100).toFixed(1)}%`)
}

function onScroll () {
  if (rafId !== null) return
  rafId = requestAnimationFrame(updateRiverReveal)
}

onMounted(() => {
  updateRiverReveal()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.river-path {
  --river-reveal: 0%;
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black var(--river-reveal), transparent calc(var(--river-reveal) + 4%));
  mask-image: linear-gradient(to bottom, black 0%, black var(--river-reveal), transparent calc(var(--river-reveal) + 4%));
}

.river-path path {
  animation: river-flow 6s linear infinite;
}

@keyframes river-flow {
  to {
    stroke-dashoffset: -20;
  }
}
</style>
