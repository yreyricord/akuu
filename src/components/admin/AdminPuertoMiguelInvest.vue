<template>
  <section
    v-if="series.length"
    class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6"
    aria-labelledby="pm-title"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h3 id="pm-title" class="text-base font-semibold text-forest-700">Argent investi à Puerto Miguel</h3>
        <p class="mt-1 max-w-xl text-sm text-night-500">
          Dépenses terrain payées en soles (onglet « Dépenses Caisse Pérou »), hors AKUUVision,
          Fonctionnement et Divers — soit l'argent réellement affecté aux projets locaux.
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold uppercase tracking-wide text-night-500">
          Total {{ firstYear }}–{{ lastYear }}
        </p>
        <p class="font-serif text-3xl font-bold text-forest-700">{{ formatPen(total) }}</p>
        <p class="text-xs text-night-400">
          {{ series.length }} exercice(s) avec dépenses terrain
        </p>
      </div>
    </div>

    <ul class="mt-5 space-y-2">
      <li v-for="y in series" :key="y.year" class="flex items-center gap-3">
        <button
          type="button"
          class="w-12 shrink-0 text-left text-sm font-semibold tabular-nums"
          :class="String(y.year) === activeYear ? 'text-forest-700' : 'text-night-500 hover:text-night'"
          :aria-pressed="String(y.year) === activeYear"
          @click="activeYear = String(y.year)"
        >
          {{ y.year }}
        </button>
        <span class="h-6 flex-1 overflow-hidden rounded-full bg-cream-200">
          <span class="block h-full rounded-full bg-forest/80" :style="{ width: barWidth(y.total) }" />
        </span>
        <span class="w-32 shrink-0 text-right text-sm tabular-nums text-night-700">{{ formatPen(y.total) }}</span>
      </li>
    </ul>

    <div v-if="projects.length" class="mt-6 border-t border-night-100 pt-4">
      <h4 class="text-sm font-semibold text-night-700">Détail {{ activeYear }} par projet</h4>
      <ul class="mt-3 grid gap-2 sm:grid-cols-2">
        <li v-for="p in projects" :key="p.project" class="flex items-baseline justify-between gap-3 text-sm">
          <span class="text-night-600">{{ p.project }}</span>
          <span class="font-semibold tabular-nums text-night-800">{{ formatPen(p.pen) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatPen } from '@/data/tresorerie-config.js'

/**
 * Projets exclus du total « investi à Puerto Miguel » : AKUUVision n'est pas un projet local,
 * Fonctionnement est un frais de structure et Divers n'est pas affecté.
 */
const PM_EXCLUDED_PROJECTS = ['AKUUVision', 'Fonctionnement', 'Divers / non affecté']

const props = defineProps({
  /** Exercices au format compta/bilan, chacun portant terrain_pen : { « Musée Shapishiko »: 12 345.6 }. */
  years: { type: Array, default: () => [] }
})

const activeYear = ref('')

/** Série pluriannuelle : total soles par exercice, hors projets exclus, années sans dépense omises. */
const series = computed(() =>
  props.years
    .map((ex) => {
      const total = Object.entries(ex.terrain_pen || {}).reduce(
        (sum, [project, pen]) => (PM_EXCLUDED_PROJECTS.includes(project) ? sum : sum + (Number(pen) || 0)),
        0
      )
      return { year: ex.year, total: Math.round(total * 100) / 100 }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => a.year - b.year)
)

const total = computed(() => Math.round(series.value.reduce((s, r) => s + r.total, 0) * 100) / 100)
const max = computed(() => Math.max(...series.value.map((r) => r.total), 1))
const firstYear = computed(() => series.value[0]?.year ?? '')
const lastYear = computed(() => series.value.at(-1)?.year ?? '')

/** Garde toujours une année affichée : la plus récente avec dépenses, tant qu'aucune n'est choisie. */
watch(
  series,
  (rows) => {
    if (!rows.length) {
      activeYear.value = ''
      return
    }
    if (!rows.some((r) => String(r.year) === String(activeYear.value))) {
      activeYear.value = String(rows.at(-1).year)
    }
  },
  { immediate: true }
)

/** Détail par projet de l'exercice affiché (mêmes exclusions). */
const projects = computed(() => {
  const ex = props.years.find((y) => String(y.year) === String(activeYear.value))
  return Object.entries(ex?.terrain_pen || {})
    .map(([project, pen]) => ({ project, pen: Number(pen) || 0 }))
    .filter((r) => r.pen > 0 && !PM_EXCLUDED_PROJECTS.includes(r.project))
    .sort((a, b) => b.pen - a.pen)
})

function barWidth(value) {
  return `${Math.max((value / max.value) * 100, 3)}%`
}
</script>
