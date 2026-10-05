<template>
  <div class="space-y-6">
    <header class="rounded-2xl border border-forest/20 bg-forest/5 p-5">
      <p class="text-[10px] font-bold uppercase tracking-wide text-forest-700">Lecture seule</p>
      <h2 class="mt-0.5 font-serif text-xl font-bold text-night">Transparence financière</h2>
      <p class="mt-1 text-sm text-night-600">
        Recettes, dépenses, résultat et trésorerie par exercice, ainsi que les dépenses terrain
        payées en soles au Pérou. Seuls les agrégats sont affichés : aucune dépense nominative,
        aucune pièce justificative.
      </p>
    </header>

    <p
      v-if="loading"
      class="rounded-xl border border-night-100 bg-white px-4 py-6 text-center text-sm text-night-500"
      role="status"
    >
      Chargement des exercices…
    </p>

    <p
      v-else-if="offline"
      class="rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-800"
      role="alert"
    >
      Les chiffres ne sont pas disponibles pour le moment. Réessayez plus tard ou contactez le trésorier.
    </p>

    <template v-else-if="rows.length">
      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-night-400">{{ kpi.label }}</p>
          <p class="mt-2 font-serif text-2xl font-bold tabular-nums" :class="kpi.tone">
            {{ eur(kpi.value) }}
          </p>
          <p class="mt-1 text-xs text-night-400">{{ kpi.note }}</p>
        </article>
      </section>

      <section class="overflow-hidden rounded-2xl border border-night-100 bg-white shadow-sm">
        <div class="border-b border-night-100 px-5 py-4">
          <h3 class="text-base font-semibold text-forest-700">Détail par exercice</h3>
          <p class="mt-1 text-xs text-night-400">
            {{ rows[0].year }} → {{ rows.at(-1).year }} · exercices clôturés et année en cours
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-night-100 text-left text-xs uppercase tracking-wide text-night-400">
                <th scope="col" class="px-5 py-3 font-semibold">Année</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Recettes</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Dépenses</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Résultat</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Trésorerie fin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.year" class="border-b border-night-50 last:border-0">
                <th scope="row" class="px-5 py-3 text-left font-semibold text-night">
                  {{ r.year }}
                  <span v-if="r.provisoire" class="ml-1 text-[11px] font-normal text-ochre-700">(provisoire)</span>
                </th>
                <td class="px-5 py-3 text-right tabular-nums text-night-700">{{ eur(r.produits_eur) }}</td>
                <td class="px-5 py-3 text-right tabular-nums text-night-700">{{ eur(r.charges_eur) }}</td>
                <td
                  class="px-5 py-3 text-right font-semibold tabular-nums"
                  :class="(r.resultat_eur ?? 0) < 0 ? 'text-terracotta-700' : 'text-forest-700'"
                >
                  {{ eur(r.resultat_eur) }}
                </td>
                <td class="px-5 py-3 text-right tabular-nums text-night-700">{{ eur(r.tresorerie?.fin_eur) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <AdminPuertoMiguelInvest :years="rows" />
    </template>

    <p v-else class="rounded-xl border border-night-100 bg-white px-4 py-6 text-center text-sm text-night-500">
      Aucun exercice publié pour le moment.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { mapExerciceToComptaYear } from '@/api/tresorerie/exercicesMap.js'
import { formatEur } from '@/data/tresorerie-config.js'
import { onPendingRefresh } from '@/composables/usePendingRefresh.js'
import AdminPuertoMiguelInvest from './AdminPuertoMiguelInvest.vue'

const loading = ref(true)
const offline = ref(false)
const yearsData = ref([])

const rows = computed(() => yearsData.value.map(mapExerciceToComptaYear))

const eur = (value) => formatEur(Number(value) || 0)

const sum = (key) => rows.value.reduce((total, r) => total + (Number(r[key]) || 0), 0)

/** Cumul de la période affichée + trésorerie du dernier exercice connu. */
const kpis = computed(() => {
  const last = rows.value.at(-1)
  return [
    { label: 'Recettes', value: sum('produits_eur'), note: `cumul ${rows.value.length} exercice(s)`, tone: 'text-forest-700' },
    { label: 'Dépenses', value: sum('charges_eur'), note: `cumul ${rows.value.length} exercice(s)`, tone: 'text-night' },
    {
      label: 'Résultat',
      value: sum('resultat_eur'),
      note: 'recettes − dépenses',
      tone: sum('resultat_eur') < 0 ? 'text-terracotta-700' : 'text-forest-700'
    },
    {
      label: `Trésorerie ${last?.year ?? ''}`,
      value: last?.tresorerie?.fin_eur ?? 0,
      note: last?.provisoire ? 'exercice en cours' : 'exercice clôturé',
      tone: 'text-forest-700'
    }
  ]
})

async function load({ force = false } = {}) {
  try {
    const res = await tresorerieApi.getTransparenceExercices({ force })
    if (res?.years?.length) {
      yearsData.value = res.years.slice().sort((a, b) => Number(a.year) - Number(b.year))
      offline.value = false
    } else {
      offline.value = true
    }
  } catch {
    offline.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

// Rechargement manuel depuis la barre de tâches (voir usePendingRefresh).
onPendingRefresh(async () => {
  tresorerieApi.invalidateTransparenceCache?.()
  await load({ force: true })
})
</script>
