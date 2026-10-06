<template>
  <div class="space-y-8">
    <!-- En-tête -->
    <header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-600 to-bleu px-6 py-7 text-white shadow-lg">
      <div class="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-leaf/25 blur-2xl" aria-hidden="true" />
      <div class="relative">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-leaf/90">Trésorerie AKUU</p>
        <h2 class="mt-1 font-serif text-2xl font-bold">Comptabilité</h2>
        <p class="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
          Chiffres issus des journaux validés et rapprochés des relevés bancaires.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <AdminTasksIndicator />
          <button
            type="button"
            class="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
            @click="refreshAll"
          >
            Rafraîchir les données
          </button>
        </div>
      </div>
    </header>

    <!-- 320 px : défilement horizontal plutôt que libellés cassés sur 2 lignes -->
    <nav class="-mx-1 flex gap-1 overflow-x-auto rounded-full bg-cream-200 p-1 [scrollbar-width:none] sm:mx-0 sm:w-fit" aria-label="Vues de la comptabilité">
      <button
        v-for="v in views"
        :key="v.id"
        type="button"
        class="min-h-[44px] shrink-0 grow whitespace-nowrap rounded-full px-4 text-sm font-semibold transition sm:grow-0"
        :class="view === v.id ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500 hover:text-night'"
        :aria-pressed="view === v.id"
        @click="view = v.id"
      >
        {{ v.label }}
      </button>
    </nav>

    <AdminComptaEcritures
      v-if="view === 'ecritures'"
      :key="`${ecrituresYear}-${metaVersion}-${journalRefreshKey}`"
      :initial-year="ecrituresYear"
      @journal-updated="caisseRefreshKey += 1"
    />

    <AdminComptaFactures v-if="view === 'factures'" />

    <AdminCaissePerouPanel
      v-if="view === 'caisse'"
      :refresh-key="caisseRefreshKey"
      @journal-updated="caisseRefreshKey += 1"
    />

    <AdminTresorerieMeta v-if="view === 'reglages'" @updated="metaVersion += 1" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminComptaEcritures from './AdminComptaEcritures.vue'
import AdminComptaFactures from './AdminComptaFactures.vue'
import AdminCaissePerouPanel from './AdminCaissePerouPanel.vue'
import AdminTresorerieMeta from './AdminTresorerieMeta.vue'
import AdminTasksIndicator from './AdminTasksIndicator.vue'
import { clearDataPending } from '@/composables/usePendingRefresh.js'

const route = useRoute()

/** Exercice transmis par l'onglet Bilan (?year=AAAA) : on ouvre directement ses écritures. */
const yearFromQuery = computed(() =>
  typeof route.query.year === 'string' && /^\d{4}$/.test(route.query.year) ? route.query.year : ''
)

/**
 * La vue d'ensemble des exercices vit dans l'onglet Transparence : ce module ouvre donc
 * directement sur les écritures, qui sont le travail courant du trésorier.
 */
const view = ref('ecritures')
const ecrituresYear = ref(yearFromQuery.value || String(new Date().getFullYear()))
const caisseRefreshKey = ref(0)
const journalRefreshKey = ref(0)
const metaVersion = ref(0)

function refreshAll() {
  journalRefreshKey.value += 1
  caisseRefreshKey.value += 1
  clearDataPending()
}

const views = [
  { id: 'ecritures', label: 'Écritures' },
  { id: 'factures', label: 'Factures' },
  { id: 'caisse', label: 'Caisse Pérou' },
  { id: 'reglages', label: 'Réglages' }
]
</script>
