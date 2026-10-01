<template>
  <div class="space-y-6">
    <!-- Période -->
    <section class="space-y-4 rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-center gap-2">
        <span class="mr-2 text-xs font-bold uppercase tracking-wide text-night-500">Période</span>
        <button type="button" :class="chipClass(allSelected)" @click="selected = []">Toutes</button>
        <button
          v-for="y in allYears"
          :key="y.year"
          type="button"
          :class="chipClass(!allSelected && selected.includes(y.year))"
          :aria-pressed="!allSelected && selected.includes(y.year)"
          @click="toggleYear(y.year)"
        >
          {{ y.year }}<span v-if="y.provisoire" class="ml-1 text-[11px] font-normal opacity-80">(prov.)</span>
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div class="flex items-center gap-2">
          <span class="mr-2 text-xs font-bold uppercase tracking-wide text-night-500">Regrouper</span>
          <div class="flex gap-1 rounded-full bg-cream-200 p-1" role="group" aria-label="Regroupement">
            <button type="button" :class="segClass(mode === 'year')" @click="mode = 'year'">Par année</button>
            <button type="button" :class="segClass(mode === 'total')" @click="mode = 'total'">Cumul de la période</button>
          </div>
        </div>
        <p class="text-sm text-night-500">{{ periodLabel }}</p>
      </div>
    </section>

    <!-- Chiffres clés -->
    <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Recettes</p>
        <p class="mt-2 font-serif text-2xl font-bold tabular-nums text-forest-700 sm:text-3xl">{{ eur(totals.produits) }}</p>
        <p class="mt-1 text-xs text-night-500">dons, subventions, cotisations…</p>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Dépenses</p>
        <p class="mt-2 font-serif text-2xl font-bold tabular-nums text-night sm:text-3xl">{{ eur(totals.charges) }}</p>
        <p class="mt-1 text-xs text-night-500">dont {{ missionPct }} % pour les projets</p>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Résultat</p>
        <p
          class="mt-2 font-serif text-2xl font-bold tabular-nums sm:text-3xl"
          :class="totals.resultat >= 0 ? 'text-forest-700' : 'text-terracotta-700'"
        >
          {{ signed(totals.resultat) }}
        </p>
        <p class="mt-1 text-xs text-night-500">recettes − dépenses</p>
      </article>
      <article class="rounded-2xl bg-forest-700 p-5 text-white shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-forest-100">Trésorerie</p>
        <p class="mt-2 font-serif text-2xl font-bold tabular-nums sm:text-3xl">{{ eur(lastYear?.tresorerie?.fin_eur) }}</p>
        <p class="mt-1 text-xs text-forest-100">
          {{ tresoNote }}
        </p>
      </article>
    </section>

    <!-- Produits / charges -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h3 class="text-base font-semibold text-forest-700">
          {{ mode === 'total' ? 'Recettes et dépenses de la période' : 'Recettes et dépenses par année' }}
        </h3>
        <div class="flex gap-4 text-xs text-night-500">
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-forest" />Recettes</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-bleu" />Dépenses</span>
        </div>
      </div>
      <div class="-mx-5 overflow-x-auto px-5">
      <div :class="bars.length > 4 ? 'min-w-[600px]' : ''">
      <div class="mt-4 flex gap-2 sm:gap-3">
        <div class="w-11 shrink-0 sm:w-12">
          <p class="mb-1 text-right text-[10px] font-semibold uppercase tracking-wide text-night-400">
            {{ chartScale.unit }}
          </p>
          <div class="flex h-56 flex-col justify-between text-right text-[10px] tabular-nums text-night-500 sm:text-[11px]">
            <span v-for="t in chartScale.ticks" :key="t.value">{{ t.label }}</span>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="relative h-56 border-b border-l border-night-200">
            <div
              v-for="t in chartScale.ticks.slice(1, -1)"
              :key="`grid-${t.value}`"
              class="pointer-events-none absolute left-0 right-0 border-t border-dashed border-night-100"
              :style="{ bottom: barPct(t.value, chartScale.top) }"
            />
            <div class="absolute inset-0 flex items-end gap-2 px-1 sm:gap-3">
              <div v-for="b in bars" :key="b.key" class="flex h-full flex-1 items-end justify-center gap-1">
                <div
                  class="w-1/3 max-w-[36px] rounded-t-md bg-forest"
                  :style="{ height: b.pH }"
                  :title="`${b.label} · recettes ${eur(b.produits)}`"
                />
                <div
                  class="w-1/3 max-w-[36px] rounded-t-md bg-bleu"
                  :style="{ height: b.cH }"
                  :title="`${b.label} · dépenses ${eur(b.charges)}`"
                />
              </div>
            </div>
          </div>
          <div class="mt-2 flex gap-2 sm:gap-3">
            <div v-for="b in bars" :key="`l-${b.key}`" class="flex-1 text-center">
              <p class="text-xs font-semibold sm:text-sm">{{ b.label }}</p>
              <p
                class="text-[11px] tabular-nums sm:text-xs"
                :class="b.produits - b.charges >= 0 ? 'text-forest-700' : 'text-terracotta-700'"
              >
                {{ short(b.produits - b.charges, true) }}
              </p>
            </div>
          </div>
          <p class="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-night-400">
            {{ mode === 'total' ? 'Période' : 'Année' }}
          </p>
        </div>
      </div>
      </div>
      </div>
    </section>

    <!-- D'où / Où -->
    <section class="grid gap-4 lg:grid-cols-2">
      <article class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
        <h3 class="text-base font-semibold text-forest-700">D'où vient l'argent</h3>
        <p class="mt-1 text-xs text-night-500">Recettes de la période, par origine</p>
        <ul class="mt-4 space-y-3">
          <li v-for="s in sources" :key="s.label" class="grid grid-cols-[minmax(0,7rem)_1fr_auto] sm:grid-cols-[minmax(0,13rem)_1fr_auto] items-center gap-3">
            <span class="truncate text-sm" :title="s.label">{{ s.label }}</span>
            <div class="h-2.5 overflow-hidden rounded-full bg-cream-200">
              <div class="h-full rounded-full bg-forest" :style="{ width: s.w }" />
            </div>
            <span class="text-right text-sm font-semibold tabular-nums">
              {{ eur(s.value) }} <span class="font-normal text-night-500">{{ s.pct }} %</span>
            </span>
          </li>
        </ul>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
        <h3 class="text-base font-semibold text-forest-700">Où va l'argent</h3>
        <p class="mt-1 text-xs text-night-500">Dépenses de la période, par projet</p>
        <ul class="mt-4 space-y-3">
          <li v-for="s in projects" :key="s.label" class="grid grid-cols-[minmax(0,7rem)_1fr_auto] sm:grid-cols-[minmax(0,13rem)_1fr_auto] items-center gap-3">
            <span class="truncate text-sm" :title="s.label">{{ s.label }}</span>
            <div class="h-2.5 overflow-hidden rounded-full bg-cream-200">
              <div class="h-full rounded-full bg-bleu" :style="{ width: s.w }" />
            </div>
            <span class="text-right text-sm font-semibold tabular-nums">
              {{ eur(s.value) }} <span class="font-normal text-night-500">{{ s.pct }} %</span>
            </span>
          </li>
        </ul>
      </article>
    </section>

    <!-- Loyers maison communautaire -->
    <section v-if="loyers.rows.length" class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-forest-700">Maison communautaire : loyers et dépenses</h3>
          <p class="mt-1 text-xs text-night-500">
            Les loyers des résidents financent l'entretien de la maison · période :
            <strong class="text-night">{{ eur(loyers.totalLoyers) }}</strong> de loyers pour
            <strong class="text-night">{{ eur(loyers.totalDepenses) }}</strong> de dépenses
          </p>
        </div>
        <div class="flex gap-4 text-xs text-night-500">
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-forest" />Loyers reçus</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-bleu" />Dépenses maison</span>
        </div>
      </div>
      <div class="mt-6 flex h-40 items-end gap-3 border-b border-night-100">
        <div v-for="r in loyers.rows" :key="r.year" class="flex h-full flex-1 items-end justify-center gap-1">
          <div class="w-1/3 max-w-[36px] rounded-t-md bg-forest" :style="{ height: r.lH }" :title="`${r.year} · loyers ${eur(r.loyers)}`" />
          <div class="w-1/3 max-w-[36px] rounded-t-md bg-bleu" :style="{ height: r.dH }" :title="`${r.year} · dépenses maison ${eur(r.depenses)}`" />
        </div>
      </div>
      <div class="mt-2 flex gap-3">
        <div v-for="r in loyers.rows" :key="`ly-${r.year}`" class="flex-1 text-center">
          <p class="text-xs font-semibold sm:text-sm">{{ r.year }}</p>
          <p class="text-[11px] tabular-nums text-forest-700 sm:text-xs">{{ r.loyers ? eur(r.loyers) : '—' }}</p>
        </div>
      </div>
    </section>

    <!-- Projets × années -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h3 class="text-base font-semibold text-forest-700">Dépenses par projet et par année</h3>
        <p class="text-xs text-night-500">Plus la case est foncée, plus la dépense est forte · clic sur une case : isoler l'année</p>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr class="text-xs text-night-500">
              <th scope="col" class="py-2 pr-2 text-left font-bold">Projet</th>
              <th v-for="y in selYears" :key="y.year" scope="col" class="py-2 text-center font-bold">{{ y.year }}</th>
              <th scope="col" class="py-2 pl-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in heatRows" :key="p.label">
              <th scope="row" class="py-2 pr-2 text-left font-semibold">{{ p.label }}</th>
              <td v-for="c in p.cells" :key="c.year" class="p-0">
                <button
                  type="button"
                  class="w-full rounded-md px-1 py-2 text-center text-xs tabular-nums transition hover:ring-2 hover:ring-bleu/40 disabled:cursor-default disabled:hover:ring-0"
                  :style="c.style"
                  :disabled="!c.value"
                  :title="`${p.label} ${c.year} : ${eur(c.value)}`"
                  @click="selected = [c.year]"
                >
                  {{ c.value ? short(c.value) : '–' }}
                </button>
              </td>
              <td class="py-2 pl-2 text-right text-xs font-bold tabular-nums">{{ eur(p.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Trésorerie -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <h3 class="text-base font-semibold text-forest-700">Trésorerie en fin d'exercice</h3>
      <p class="mt-1 text-xs text-night-500">Solde du compte en fin d'année, égal au relevé bancaire (année provisoire : dernier relevé)</p>
      <div class="-mx-5 overflow-x-auto px-5">
      <div :class="tresoBars.length > 4 ? 'min-w-[600px]' : ''">
      <div class="mt-6 flex h-40 items-end gap-2 border-b border-night-100 sm:gap-3">
        <div v-for="t in tresoBars" :key="t.year" class="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span class="text-[11px] font-semibold tabular-nums sm:text-xs">{{ short(t.value) }}</span>
          <div class="w-3/5 max-w-[48px] rounded-t-md bg-leaf-700" :style="{ height: t.h }" :title="`${t.year} : ${eur(t.value)}`" />
        </div>
      </div>
      <div class="mt-2 flex gap-2 sm:gap-3">
        <p v-for="t in tresoBars" :key="`tl-${t.year}`" class="flex-1 text-center text-xs font-semibold sm:text-sm">{{ t.year }}</p>
      </div>
      </div>
      </div>
    </section>

    <p class="text-xs text-night-400">
      Source : journaux 2017–{{ allYears.at(-1)?.year }} (banque), mêmes montants que les comptes de clôture ·
      mis à jour {{ generatedAt }}
      <span v-if="liveInfo"> · {{ liveInfo.year }} en direct depuis le journal Google</span>
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import historique from '@/data/compta-historique.json'
import { tresorerieApi } from '@/api/tresorerie/client.js'

const yearsData = ref(historique?.years ?? [])
const liveInfo = ref(null)

// Année en cours : chiffres en direct depuis le journal Google
onMounted(async () => {
  const current = new Date().getFullYear()
  try {
    const live = await tresorerieApi.getComptaAnnee(current)
    if (!live?.live) return
    const list = [...yearsData.value]
    const idx = list.findIndex((y) => y.year === current)
    const prev = list.find((y) => y.year === current - 1)
    const debut = prev?.tresorerie?.fin_eur ?? 0
    const entry = {
      ...(idx >= 0 ? list[idx] : {}),
      ...live,
      tresorerie: { debut_eur: debut, fin_eur: Math.round((debut + live.resultat_eur) * 100) / 100, calcule: true }
    }
    if (idx >= 0) list[idx] = entry
    else list.push(entry)
    yearsData.value = list
    liveInfo.value = live
  } catch { /* hors ligne : derniers chiffres exportés */ }
})
const allYears = computed(() => yearsData.value)
const selected = ref([])
const mode = ref('year')

const allSelected = computed(() => selected.value.length === 0)
const selYears = computed(() =>
  allSelected.value ? allYears.value : allYears.value.filter((y) => selected.value.includes(y.year))
)
const lastYear = computed(() => selYears.value.at(-1))
const tresoNote = computed(() => {
  const y = lastYear.value
  const t = y?.tresorerie
  if (!y || !t) return ''
  if (t.calcule) return `${y.year} en cours · calculé depuis le journal`
  if (y.provisoire) return `fin du dernier relevé ${y.year}`
  const ecart = Math.round((t.ecart_eur || 0) * 100) / 100
  if (!ecart) return `au 31/12/${y.year} · égal au relevé`
  const journal = Math.round((t.fin_eur + ecart) * 100) / 100
  return `au 31/12/${y.year} · relevé bancaire · le journal donne ${eur(journal)} (écart ${t.statut === 'documente' ? 'expliqué' : 'à vérifier'})`
})

function toggleYear(year) {
  const s = selected.value.includes(year)
    ? selected.value.filter((y) => y !== year)
    : [...selected.value, year]
  selected.value = s.length === allYears.value.length ? [] : s
}

const periodLabel = computed(() => {
  const ys = selYears.value.map((y) => y.year)
  if (allSelected.value) return `${ys.length} exercices · cliquez sur des années pour les combiner`
  return `${ys.length} exercice${ys.length > 1 ? 's' : ''} : ${ys.join(', ')}`
})

const sum = (fn) => selYears.value.reduce((a, y) => a + (fn(y) || 0), 0)

const totals = computed(() => {
  const produits = sum((y) => y.produits_eur)
  const charges = sum((y) => y.charges_eur)
  return { produits, charges, resultat: produits - charges }
})

const missionPct = computed(() => {
  const c1 = sum((y) => y.charges_postes?.C1)
  return totals.value.charges ? Math.round((c1 / totals.value.charges) * 100) : 0
})

function niceAxisMax(v) {
  if (v <= 0) return 1000
  const mag = 10 ** Math.floor(Math.log10(v))
  const norm = v / mag
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * mag
}

function axisLabel(v, useK) {
  if (useK) {
    return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: v >= 10000 ? 0 : 1 })} k €`
  }
  return `${Math.round(v).toLocaleString('fr-FR')} €`
}

const chartScale = computed(() => {
  let maxVal = 1
  if (mode.value === 'total') {
    maxVal = Math.max(totals.value.produits, totals.value.charges, 1)
  } else {
    maxVal = Math.max(...selYears.value.map((y) => Math.max(y.produits_eur, y.charges_eur)), 1)
  }
  const top = niceAxisMax(maxVal * 1.08)
  const useK = top >= 2000
  const steps = 4
  const ticks = []
  for (let i = steps; i >= 0; i--) {
    const value = (top / steps) * i
    ticks.push({ value, label: axisLabel(value, useK) })
  }
  return { top, ticks, unit: useK ? 'k €' : '€' }
})

const bars = computed(() => {
  const max = chartScale.value.top
  if (mode.value === 'total') {
    const ys = selYears.value
    const label = ys.length > 1 ? `${ys[0].year}–${ys.at(-1).year}` : String(ys[0]?.year ?? '')
    return [{
      key: 'total', label,
      produits: totals.value.produits, charges: totals.value.charges,
      pH: barPct(totals.value.produits, max), cH: barPct(totals.value.charges, max)
    }]
  }
  return selYears.value.map((y) => ({
    key: y.year, label: y.provisoire ? `${y.year}*` : String(y.year),
    produits: y.produits_eur, charges: y.charges_eur,
    pH: barPct(y.produits_eur, max), cH: barPct(y.charges_eur, max)
  }))
})

function rank(getMap) {
  const acc = {}
  selYears.value.forEach((y) => {
    Object.entries(getMap(y) || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v })
  })
  const rows = Object.entries(acc).filter(([, v]) => v > 0.5).sort((a, b) => b[1] - a[1])
  const total = rows.reduce((a, [, v]) => a + v, 0) || 1
  const max = rows[0]?.[1] || 1
  return rows.map(([label, value]) => ({
    label, value, pct: Math.round((value / total) * 100), w: `${Math.max(2, (value / max) * 100)}%`
  }))
}

const sources = computed(() => rank((y) => y.recettes_groupes))

const MAISON = 'Maison communautaire'
const loyers = computed(() => {
  const rows = selYears.value
    .map((y) => ({ year: y.year, loyers: y.loyers_maison_eur || 0, depenses: y.charges_projets?.[MAISON] || 0 }))
    .filter((r) => r.loyers > 0 || r.depenses > 0)
  const max = Math.max(...rows.map((r) => Math.max(r.loyers, r.depenses)), 1)
  return {
    rows: rows.map((r) => ({ ...r, lH: pct(r.loyers, max), dH: pct(r.depenses, max) })),
    totalLoyers: rows.reduce((a, r) => a + r.loyers, 0),
    totalDepenses: rows.reduce((a, r) => a + r.depenses, 0)
  }
})
const projects = computed(() => rank((y) => y.charges_projets))

const heatRows = computed(() => {
  const labels = projects.value.map((p) => p.label)
  let max = 1
  selYears.value.forEach((y) => labels.forEach((l) => { max = Math.max(max, y.charges_projets?.[l] || 0) }))
  return labels.map((label) => {
    const cells = selYears.value.map((y) => {
      const value = y.charges_projets?.[label] || 0
      const a = value ? 0.12 + 0.88 * Math.sqrt(value / max) : 0
      return {
        year: y.year, value,
        style: value
          ? { background: `rgba(4,72,143,${a.toFixed(2)})`, color: a > 0.5 ? '#FFFFFF' : '#3A4040' }
          : { background: '#F6F4EE', color: '#9AA0A0' }
      }
    })
    return { label, cells, total: cells.reduce((a, c) => a + c.value, 0) }
  })
})

const tresoBars = computed(() => {
  const max = Math.max(...selYears.value.map((y) => y.tresorerie?.fin_eur || 0), 1)
  return selYears.value.map((y) => ({
    year: y.provisoire ? `${y.year}*` : y.year,
    value: y.tresorerie?.fin_eur || 0,
    h: `${Math.max(3, ((y.tresorerie?.fin_eur || 0) / max) * 78)}%`
  }))
})

const generatedAt = historique?.generated_at
  ? new Date(historique.generated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—'

function barPct(v, max) { return `${Math.max(v > 0 ? 2 : 0, Math.round((v / max) * 100))}%` }
function pct(v, max) { return barPct(v, max) }
function eur(v) { return v == null ? '—' : `${Math.round(v).toLocaleString('fr-FR')} €` }
function signed(v) { return `${v >= 0 ? '+' : '−'}${eur(Math.abs(v))}` }
function short(v, withSign = false) {
  const sign = withSign ? (v >= 0 ? '+' : '−') : ''
  const a = Math.abs(v)
  const txt = a >= 1000 ? `${(a / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : `${Math.round(a)}`
  return `${sign}${txt}${withSign ? ' €' : ''}`
}
function chipClass(on) {
  return [
    'min-h-[40px] rounded-full border px-3.5 text-sm font-semibold transition',
    on ? 'border-forest bg-forest text-white' : 'border-night-200 bg-white text-night hover:border-forest/50'
  ]
}
function segClass(on) {
  return [
    'min-h-[36px] rounded-full px-4 text-sm font-semibold transition',
    on ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500 hover:text-night'
  ]
}
</script>
