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
          Dépenses terrain payées en soles (onglet « Dépenses Caisse Pérou »). Chaque exercice compare
          l'argent réellement affecté aux projets locaux à ce qui reste sur la même caisse
          (AKUUVision, Fonctionnement, Divers).
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold uppercase tracking-wide text-night-500">
          Total {{ firstYear }}–{{ lastYear }}
        </p>
        <p class="font-serif text-3xl font-bold text-forest-700">{{ formatPen(totalProjets) }}</p>
        <p class="text-xs text-night-400">
          sur {{ formatPen(totalPerou) }} dépensés en Caisse Pérou · {{ series.length }} exercice(s)
        </p>
      </div>
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-night-500">
      <li class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-forest/80" aria-hidden="true" />
        Projets locaux ({{ pmShare }} %)
      </li>
      <li class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-ochre-300" aria-hidden="true" />
        Reste de la caisse Pérou
      </li>
    </ul>

    <ul class="mt-5 space-y-3">
      <li v-for="y in series" :key="y.year" class="flex items-start gap-3">
        <button
          type="button"
          class="w-12 shrink-0 pt-0.5 text-left text-sm font-semibold tabular-nums"
          :class="String(y.year) === activeYear ? 'text-forest-700' : 'text-night-500 hover:text-night'"
          :aria-pressed="String(y.year) === activeYear"
          @click="activeYear = String(y.year)"
        >
          {{ y.year }}
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="h-6 flex-1 overflow-hidden rounded-full bg-cream-200">
              <span class="flex h-full overflow-hidden rounded-full" :style="{ width: barWidth(y.total) }">
                <span class="h-full bg-forest/80" :style="{ width: share(y.projets, y.total) }" />
                <span class="h-full bg-ochre-300" :style="{ width: share(y.reste, y.total) }" />
              </span>
            </span>
            <span class="w-28 shrink-0 text-right text-sm tabular-nums text-night-700">
              {{ formatPen(y.total) }}
            </span>
          </div>
          <p class="mt-1 text-xs text-night-500">
            <span class="font-semibold text-forest-700">{{ formatPen(y.projets) }}</span> projets locaux
            · <span class="font-semibold text-night-600">{{ formatPen(y.reste) }}</span> reste
            <span class="text-night-400">({{ Math.round(ratio(y.projets, y.total) * 100) }} %)</span>
          </p>
        </div>
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
 * Ces montants ne sont pas perdus : ils forment « le reste » de la caisse Pérou, auquel
 * chaque exercice est comparé.
 */
const PM_EXCLUDED_PROJECTS = ['AKUUVision', 'Fonctionnement', 'Divers / non affecté']

const props = defineProps({
  /** Exercices au format compta/bilan, chacun portant terrain_pen : { « Musée Shapishiko »: 12 345.6 }. */
  years: { type: Array, default: () => [] }
})

const activeYear = ref('')

const round2 = (value) => Math.round(value * 100) / 100

/** Série pluriannuelle : projets locaux vs reste de la caisse Pérou, années sans dépense omises. */
const series = computed(() =>
  props.years
    .map((ex) => {
      let projets = 0
      let reste = 0
      for (const [project, pen] of Object.entries(ex.terrain_pen || {})) {
        const value = Number(pen) || 0
        if (PM_EXCLUDED_PROJECTS.includes(project)) reste += value
        else projets += value
      }
      return { year: ex.year, projets: round2(projets), reste: round2(reste), total: round2(projets + reste) }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => a.year - b.year)
)

const totalProjets = computed(() => round2(series.value.reduce((s, r) => s + r.projets, 0)))
const totalPerou = computed(() => round2(series.value.reduce((s, r) => s + r.total, 0)))
/** Part des projets locaux sur l'ensemble de la période, en %. */
const pmShare = computed(() => Math.round(ratio(totalProjets.value, totalPerou.value) * 100))
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

function ratio(part, whole) {
  return whole > 0 ? part / whole : 0
}

/** Largeur de la barre entière, pour garder la comparaison entre exercices. */
function barWidth(value) {
  return `${Math.max((value / max.value) * 100, 3)}%`
}

/** Largeur d'un segment à l'intérieur de la barre. */
function share(part, whole) {
  return `${ratio(part, whole) * 100}%`
}
</script>
