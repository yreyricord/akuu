<template>
  <div
    class="relative grid md:grid-cols-2 gap-0 fade-in-up"
    :class="isEven ? 'md:text-right' : ''"
  >
    <!-- Ligne centrale verticale (visible sur md+) -->
    <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-forest/30 -translate-x-1/2" />

    <!-- Colonne contenu -->
    <div
      :class="[
        'relative pb-14',
        isEven ? 'md:order-2 md:pl-16 md:pr-0' : 'md:order-1 md:pr-16 md:pl-0'
      ]"
    >
      <!-- Point central sur la ligne -->
      <div
        class="hidden md:flex absolute top-6 items-center justify-center w-5 h-5 rounded-full ring-4 ring-cream shadow-md z-10"
        :class="isEven ? 'md:-left-[2.75rem]' : 'md:-right-[2.75rem]'"
        :style="{ backgroundColor: eraColor }"
      />

      <!-- Card -->
      <div class="group bg-white rounded-2xl p-6 shadow-sm border border-night/5 hover:shadow-lg hover:border-forest/20 transition-all duration-400">
        <!-- Tag année + catégorie -->
        <div class="flex items-center gap-3 mb-4" :class="isEven ? 'md:justify-end' : ''">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            :style="{ backgroundColor: eraColor + '15', color: eraColor }"
          >
            {{ eraLabel }}
          </span>
        </div>

        <h3 class="text-lg font-serif font-bold text-night mb-2 group-hover:text-forest transition-colors">
          {{ titre }}
        </h3>
        <p class="text-night/55 text-sm leading-relaxed">{{ description }}</p>
      </div>
    </div>

    <!-- Colonne année -->
    <div
      :class="[
        'hidden md:flex items-start pb-14',
        isEven ? 'md:order-1 md:justify-end md:pr-16' : 'md:order-2 md:justify-start md:pl-16'
      ]"
    >
      <div class="pt-3">
        <span class="text-5xl font-serif font-black leading-none text-night/20">
          {{ annee }}
        </span>
      </div>
    </div>

    <!-- Layout mobile : année + contenu inline -->
    <div class="md:hidden col-span-2 pb-10 pl-8 relative">
      <div class="absolute left-0 top-0 bottom-0 w-px bg-forest/15" />
      <div class="absolute left-0 top-6 w-2 h-2 rounded-full bg-forest -translate-x-[3px]" />

      <span class="text-2xl font-serif font-black text-night/40 block mb-2">{{ annee }}</span>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-night/5">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
          :style="{ backgroundColor: eraColor + '15', color: eraColor }"
        >
          {{ eraLabel }}
        </span>
        <h3 class="text-base font-serif font-bold text-night mb-1.5">{{ titre }}</h3>
        <p class="text-night/55 text-sm leading-relaxed">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  annee: { type: Number, required: true },
  titre: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '' },
  isLast: { type: Boolean, default: false },
  isEven: { type: Boolean, default: false }
})

// Couleur et label par ère
const era = computed(() => {
  if (props.annee <= 2017) return { color: '#2D6915', label: 'Fondation' }
  if (props.annee <= 2019) return { color: '#04488F', label: 'Développement' }
  if (props.annee === 2020) return { color: '#3A4040', label: 'Pause' }
  if (props.annee <= 2022) return { color: '#4071A6', label: 'Relance' }
  return { color: '#A6C639', label: 'Musée Shapishiko' }
})

const eraColor = computed(() => era.value.color)
const eraLabel = computed(() => era.value.label)
</script>
