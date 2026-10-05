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
          Chaque exercice compare ce qui est affecté aux projets locaux — dépenses terrain payées en
          soles (onglet « Dépenses Caisse Pérou ») et charges du journal portant un code projet — au
          reste des dépenses de l'association. Tout est ramené en euros au taux de change de l'exercice.
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold uppercase tracking-wide text-night-500">
          Total {{ firstYear }}–{{ lastYear }}
        </p>
        <p class="font-serif text-3xl font-bold text-forest-700">{{ formatEur(totalProjets) }}</p>
        <p class="text-xs text-night-400">
          {{ formatPen(totalPen) }} de terrain · sur {{ formatEur(totalGeneral) }} dépensés
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
        Autres dépenses
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
            <span class="text-night-400">(dont {{ formatPen(y.pen) }} terrain)</span>
            · <span class="font-semibold text-night-600">{{ formatEur(y.autres) }}</span> autres dépenses
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
          <span class="text-right">
            <span class="font-semibold tabular-nums text-night-800">{{ formatEur(p.eur) }}</span>
            <span v-if="p.pen" class="ml-1 text-xs tabular-nums text-night-400">
              + {{ formatPen(p.pen) }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatEur, formatPen } from '@/data/tresorerie-config.js'
import { prefetchPenEurRatesForDates } from '@/api/tresorerie/exchangeRate.js'

/**
 * Ce qui n'est PAS investi à Puerto Miguel : structure, frais de banque et dépenses non affectées.
 * Le reste (musée, maison communautaire, cours d'anglais…) compte comme argent investi sur place.
 * Deux listes : les libellés diffèrent entre le journal (EUR) et la caisse Pérou (soles).
 */
const HORS_PROJETS_TERRAIN = ['AKUUVision', 'Fonctionnement', 'Divers / non affecté']
const HORS_PROJETS_JOURNAL = ['AKUUVision', 'Fonctionnement', 'Autres / non affecté', 'Frais bancaires']

const props = defineProps({
  /**
   * Exercices au format compta/bilan :
   * terrain_pen = { « Musée Shapishiko »: 12 345.6 } en soles,
   * charges_projets = { « Musée Shapishiko »: 8 900.0 } en euros.
   */
  years: { type: Array, default: () => [] }
})

const activeYear = ref('')
/** Taux PEN→EUR par exercice, chargé à la demande (cache local 24 h). */
const rates = ref({})

const round2 = (value) => Math.round(value * 100) / 100

/** Agrégats bruts par exercice : ce qui est affecté aux projets locaux et le reste. */
const base = computed(() =>
  props.years
    .map((ex) => {
      const split = (map, excluded) => {
        let projets = 0
        let autres = 0
        for (const [key, value] of Object.entries(map || {})) {
          const amount = Number(value) || 0
          if (excluded.includes(key)) autres += amount
          else projets += amount
        }
        return { projets, autres }
      }
      const terrain = split(ex.terrain_pen, HORS_PROJETS_TERRAIN)
      const journal = split(ex.charges_projets, HORS_PROJETS_JOURNAL)
      return {
        year: ex.year,
        penProjets: round2(terrain.projets),
        penAutres: round2(terrain.autres),
        eurProjets: round2(journal.projets),
        eurAutres: round2(journal.autres)
      }
    })
    .filter((r) => r.penProjets || r.penAutres || r.eurProjets || r.eurAutres)
    .sort((a, b) => a.year - b.year)
)

/** Série affichée : les soles sont converties au taux de l'exercice, puis additionnées aux euros. */
const series = computed(() =>
  base.value.map((r) => {
    const rate = rates.value[r.year] ?? 0
    const projets = round2(r.eurProjets + r.penProjets * rate)
    const autres = round2(r.eurAutres + r.penAutres * rate)
    return { ...r, pen: r.penProjets, projets, autres, total: round2(projets + autres) }
  })
)

const totalProjets = computed(() => round2(series.value.reduce((s, r) => s + r.projets, 0)))
const totalGeneral = computed(() => round2(series.value.reduce((s, r) => s + r.total, 0)))
const totalPen = computed(() => round2(series.value.reduce((s, r) => s + r.pen, 0)))
/** Part des projets locaux sur l'ensemble de la période, en %. */
const pmShare = computed(() => Math.round(ratio(totalProjets.value, totalGeneral.value) * 100))
const max = computed(() => Math.max(...series.value.map((r) => r.total), 1))
const firstYear = computed(() => series.value[0]?.year ?? '')
const lastYear = computed(() => series.value.at(-1)?.year ?? '')

/** Taux de change de l'exercice (1er juillet, jour médian), en une seule passe. */
watch(
  base,
  async (rows, _previous, onCleanup) => {
    const years = rows.filter((r) => r.penProjets || r.penAutres).map((r) => r.year)
    if (!years.length) return
    let cancelled = false
    onCleanup(() => { cancelled = true })
    const byDate = await prefetchPenEurRatesForDates(years.map((y) => `${y}-07-01`))
    if (cancelled) return
    const next = {}
    for (const [date, payload] of Object.entries(byDate)) {
      if (payload?.rate) next[date.slice(0, 4)] = Number(payload.rate)
    }
    rates.value = { ...rates.value, ...next }
  },
  { immediate: true }
)

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

/** Détail par projet de l'exercice affiché : soles terrain + charges du journal. */
const projects = computed(() => {
  const ex = props.years.find((y) => String(y.year) === String(activeYear.value))
  if (!ex) return []
  const rows = new Map()
  const add = (key, field, value) => {
    if (!value || HORS_PROJETS_TERRAIN.includes(key) || HORS_PROJETS_JOURNAL.includes(key)) return
    const current = rows.get(key) ?? { project: key, eur: 0, pen: 0 }
    current[field] += value
    rows.set(key, current)
  }
  for (const [key, value] of Object.entries(ex.charges_projets || {})) add(key, 'eur', Number(value) || 0)
  for (const [key, value] of Object.entries(ex.terrain_pen || {})) add(key, 'pen', Number(value) || 0)
  return [...rows.values()].sort((a, b) => b.eur + b.pen - (a.eur + a.pen))
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
