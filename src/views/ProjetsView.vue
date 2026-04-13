<template>
  <div>
    <PageHero
      :title="$t('projets.hero_title')"
      :subtitle="$t('projets.hero_subtitle')"
      image="/images/hero-projets.jpg"
    />

    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <!-- Filter bar -->
        <div class="flex flex-wrap justify-center gap-3 mb-12">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
            :class="activeFilter === filter.value
              ? 'bg-forest text-white shadow-md'
              : 'bg-white text-night/60 hover:text-forest hover:bg-forest-50 border border-forest/10'"
          >
            {{ $t(filter.labelKey) }}
          </button>
        </div>

        <!-- Project grid -->
        <TransitionGroup
          name="grid"
          tag="div"
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <ProjetCard
            v-for="projet in filteredProjets"
            :key="projet.id"
            :projet="projet"
          />
        </TransitionGroup>

        <p v-if="filteredProjets.length === 0" class="text-center text-night/40 py-12">
          {{ $t('projets.empty_state') }}
        </p>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/store'
import PageHero from '@/components/shared/PageHero.vue'
import ProjetCard from '@/components/projets/ProjetCard.vue'
import DonSection from '@/components/home/DonSection.vue'

const store = useDataStore()
const activeFilter = ref('all')

const filters = [
  { value: 'all', labelKey: 'projets.filter_all' },
  { value: 'en_cours', labelKey: 'projets.filter_en_cours' },
  { value: 'realise', labelKey: 'projets.filter_realise' },
  { value: 'en_preparation', labelKey: 'projets.filter_en_preparation' },
  { value: 'suspendu', labelKey: 'projets.filter_suspendu' }
]

const filteredProjets = computed(() => {
  if (activeFilter.value === 'all') return store.projets
  return store.projets.filter(p => p.statut === activeFilter.value)
})
</script>

<style scoped>
.grid-enter-active,
.grid-leave-active {
  transition: all 0.4s ease;
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
