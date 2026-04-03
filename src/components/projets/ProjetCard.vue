<template>
  <component
    :is="projet.lien ? 'router-link' : 'div'"
    :to="projet.lien || undefined"
    class="card group cursor-pointer"
  >
    <div class="relative aspect-[16/10] overflow-hidden">
      <img
        :src="projet.image"
        :alt="$t(`projets.catalog.${projet.id}.title`)"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <span
        class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
        :class="statusClass"
      >
        {{ $t(`projets.status.${projet.statut}`) }}
      </span>
    </div>
    <div class="p-5">
      <div class="flex items-baseline justify-between mb-2">
        <h3 class="text-lg font-serif font-bold text-night group-hover:text-forest transition-colors">
          {{ $t(`projets.catalog.${projet.id}.title`) }}
        </h3>
        <span class="text-sm text-night/40 shrink-0 ml-2">{{ $t('projets.since') }} {{ projet.annee_debut }}</span>
      </div>
      <p class="text-night/60 text-sm leading-relaxed">{{ $t(`projets.catalog.${projet.id}.description`) }}</p>
      <div v-if="projet.lien" class="mt-4 flex items-center gap-1 text-forest text-sm font-medium">
        <span>{{ $t('projets.discover') }}</span>
        <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  projet: { type: Object, required: true }
})

const statusClass = computed(() => ({
  'bg-leaf': props.projet.statut === 'en_cours',
  'bg-night/50': props.projet.statut === 'realise',
  'bg-ochre': props.projet.statut === 'en_preparation',
  'bg-amber-500': props.projet.statut === 'suspendu'
}))
</script>
