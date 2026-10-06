<template>
  <section
    v-if="series.length"
    class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6"
    aria-labelledby="pm-title"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h3 id="pm-title" class="text-base font-semibold text-forest-700">
          Argent investi à Puerto Miguel
        </h3>
        <p class="mt-1 max-w-xl text-sm text-night-500">
          Part des dépenses de chaque exercice affectée aux projets locaux (musée, maison
          communautaire, cours d'anglais…), par opposition à la structure, aux frais bancaires et aux
          dépenses non affectées.
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold uppercase tracking-wide text-night-500">
          Total {{ firstYear }}–{{ lastYear }}
        </p>
        <p class="font-serif text-3xl font-bold text-forest-700">{{ formatEur(totalProjets) }}</p>
        <p class="text-xs text-night-400">
          sur {{ formatEur(totalGeneral) }} dépensés · {{ pmShare }} % affectés aux projets locaux
        </p>
      </div>
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-night-500">
      <li class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-forest/80" aria-hidden="true" />
        Projets locaux
      </li>
      <li class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-ochre-300" aria-hidden="true" />
        Structure, frais bancaires, non affecté
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
                <span class="h-full bg-ochre-300" :style="{ width: share(y.autres, y.total) }" />
              </span>
            </span>
            <span class="w-28 shrink-0 text-right text-sm tabular-nums text-night-700">
              {{ formatEur(y.total) }}
            </span>
          </div>
          <p class="mt-1 text-xs text-night-500">
            <span class="font-semibold text-forest-700">{{ formatEur(y.projets) }}</span> projets locaux
            · <span class="font-semibold text-night-600">{{ formatEur(y.autres) }}</span> autres
            <span class="text-night-400">({{ Math.round(ratio(y.projets, y.total) * 100) }} %)</span>
            <span v-if="y.pen" class="text-night-400">
              · {{ formatPen(y.pen) }} payés sur place en soles
            </span>
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatEur, formatPen } from '@/data/tresorerie-config.js'

/**
 * Ce qui n'est PAS investi à Puerto Miguel : structure, frais de banque et dépenses non affectées.
 * Le reste (musée, maison communautaire, cours d'anglais…) compte comme argent investi sur place.
 * Les deux listes diffèrent : le journal écrit « Autres / non affecté », la caisse Pérou « Divers / non affecté ».
 */
const HORS_PROJETS_JOURNAL = ['AKUUVision', 'Fonctionnement', 'Autres / non affecté', 'Frais bancaires']
const HORS_PROJETS_TERRAIN = ['AKUUVision', 'Fonctionnement', 'Divers / non affecté']

const props = defineProps({
  /**
   * Exercices au format compta/bilan :
   * charges_eur = charges de l'exercice (source : journal comptable),
   * charges_projets = { « Musée Shapishiko »: 8 900.0 } en euros,
   * terrain_pen = { « Musée Shapishiko »: 12 345.6 } en soles (suivi terrain, informatif).
   */
  years: { type: Array, default: () => [] }
})

const activeYear = ref('')
const round2 = (value) => Math.round(value * 100) / 100

function split(map, excluded) {
  let projets = 0
  let autres = 0
  for (const [key, value] of Object.entries(map || {})) {
    const amount = Number(value) || 0
    if (excluded.includes(key)) autres += amount
    else projets += amount
  }
  return { projets, autres }
}

/**
 * Une ligne par exercice. Le total est le montant officiel du journal (charges_eur) ; la part
 * « autres » est déduite pour que les deux segments remplissent toujours la barre exactement.
 * Les soles ne sont jamais additionnés aux euros : ils détaillent une dépense déjà comptée.
 */
const series = computed(() =>
  props.years
    .map((ex) => {
      const total = round2(Number(ex.charges_eur) || 0)
      const projets = round2(split(ex.charges_projets, HORS_PROJETS_JOURNAL).projets)
      return {
        year: ex.year,
        total,
        projets,
        autres: round2(Math.max(0, total - projets)),
        pen: round2(split(ex.terrain_pen, HORS_PROJETS_TERRAIN).projets)
      }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => a.year - b.year)
)

const totalProjets = computed(() => round2(series.value.reduce((s, r) => s + r.projets, 0)))
const totalGeneral = computed(() => round2(series.value.reduce((s, r) => s + r.total, 0)))
/** Part des projets locaux sur l'ensemble de la période, en %. */
const pmShare = computed(() => Math.round(ratio(totalProjets.value, totalGeneral.value) * 100))
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
