<template>
  <div class="bg-cream-200 min-h-screen">
    <!-- Couverture -->
    <header class="ag-cover relative overflow-hidden text-white px-4 pt-28 pb-14 md:pt-36 md:pb-20">
      <div class="container-narrow">
        <p class="text-[11px] md:text-xs font-semibold tracking-[0.18em] text-leaf-200 uppercase">
          Assemblée générale · {{ data.meta.periodLabel }}
        </p>
        <h1 class="mt-3 font-serif font-bold text-white">10 ans d'action</h1>
        <p class="mt-4 max-w-2xl text-base md:text-lg text-bleu-pur">
          Entrées, sorties, projets : dix ans de comptes expliqués simplement.
          Les chiffres reprennent les relevés bancaires et les journaux comptables.
        </p>
      </div>
      <img
        src="/images/collibri-akuu.png"
        alt=""
        aria-hidden="true"
        class="ag-cover-colibri pointer-events-none absolute right-0 sm:right-2 md:right-6 lg:right-10 xl:right-16 top-[6.5rem] sm:top-[7.25rem] md:top-[8.75rem] h-[8.25rem] w-auto sm:h-36 md:h-[10.5rem] lg:h-48 object-contain drop-shadow-[0_8px_28px_rgba(166,198,57,0.45)] will-change-transform select-none"
        loading="eager"
        decoding="async"
      />
    </header>

    <!-- Chiffres clés -->
    <section class="px-4 -mt-8 md:-mt-10 relative z-10">
      <div class="container-narrow grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <article
          v-for="kpi in kpis"
          :key="kpi.label"
          class="fade-in-up bg-white rounded-2xl p-4 md:p-5 shadow-lg border-t-4"
          :class="kpi.border"
        >
          <p class="text-[10px] font-semibold tracking-[0.09em] text-night-400 uppercase leading-tight">
            {{ kpi.label }}
          </p>
          <p class="mt-2 font-serif font-bold text-xl md:text-2xl text-night tabular-nums">
            {{ euro(kpi.value) }}
          </p>
          <p class="mt-1 text-xs text-night-400 leading-snug">{{ kpi.hint }}</p>
        </article>
      </div>
    </section>

    <!-- Où va l'argent -->
    <section class="section-padding">
      <div class="container-narrow">
        <div class="text-center mb-12 md:mb-16">
          <div
            class="comptes-ag-fillon-incrustation mx-auto mb-3 md:mb-4 inline-flex overflow-hidden rounded-2xl bg-night shadow-md ring-2 ring-night/15"
          >
            <img
              src="/images/comptes-ag/fillon-incrustation.jpg"
              alt=""
              aria-hidden="true"
              class="h-20 w-20 md:h-28 md:w-28 object-cover object-[center_12%] select-none pointer-events-none"
              loading="lazy"
              decoding="async"
            />
          </div>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-night mb-4">
            Où va l'argent
          </h2>
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="block w-12 h-0.5 rounded-full bg-forest" />
            <svg class="w-5 h-5 text-forest" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
            <span class="block w-12 h-0.5 rounded-full bg-forest" />
          </div>
          <p class="text-lg max-w-2xl mx-auto text-night/60">
            Répartition des {{ euro(data.totals.spent) }} sortis du compte depuis 2017
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-4 md:gap-5">
          <article
            v-for="dest in data.destinations"
            :key="dest.id"
            class="fade-in-up bg-white rounded-3xl p-5 md:p-6 shadow-lg border-t-[6px] flex flex-col"
            :class="destinationStyle[dest.id].border"
          >
            <p class="text-[10px] font-semibold tracking-[0.09em] uppercase" :class="destinationStyle[dest.id].label">
              {{ dest.label }}
            </p>
            <p class="mt-2 font-serif font-bold text-3xl text-night tabular-nums">{{ euro(dest.amount) }}</p>
            <p class="text-sm text-night-400">{{ formatShare(dest.share) }} des dépenses</p>

            <div class="mt-3 h-2 rounded-full bg-night-100 overflow-hidden" role="presentation">
              <div
                class="h-full rounded-full transition-[width] duration-1000 ease-out"
                :class="destinationStyle[dest.id].bar"
                :style="{ width: `${(dest.amount / maxDestination) * 100}%` }"
              />
            </div>

            <p class="mt-4 text-sm text-night-500 leading-relaxed">{{ dest.description }}</p>

            <ul class="mt-4 space-y-2 border-t border-night-100 pt-3">
              <li
                v-for="line in dest.lines"
                :key="line.label"
                class="flex items-baseline justify-between gap-3 text-sm"
              >
                <span class="text-night-500">{{ line.label }}</span>
                <span class="font-semibold text-night tabular-nums whitespace-nowrap">{{ euro(line.amount) }}</span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Évolution annuelle -->
    <section class="section-padding pt-0">
      <div class="container-narrow">
        <SectionTitle subtitle="Ressources retenues et dépenses, exercice par exercice">
          Évolution dans le temps
        </SectionTitle>

        <div class="fade-in-up bg-white rounded-3xl p-5 md:p-8 shadow-lg">
          <FinancesTimelineChart :points="data.years" />

          <div class="mt-6 flex flex-wrap gap-2">
            <button
              v-for="year in data.years"
              :key="year.year"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="selectedYear === year.year ? 'bg-forest text-white' : 'bg-cream-200 text-night-500 hover:bg-cream-300'"
              @click="selectedYear = selectedYear === year.year ? null : year.year"
            >
              {{ year.label }}
            </button>
            <button
              v-if="selectedYear"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold text-forest underline underline-offset-4 min-h-0"
              @click="selectedYear = null"
            >
              Toute la période
            </button>
          </div>

          <div class="mt-6 rounded-2xl bg-cream-200 p-4 md:p-5">
            <p class="text-[10px] font-semibold tracking-[0.09em] uppercase text-night-400">
              {{ activeYear ? `Exercice ${activeYear.label}` : 'Ensemble de la période' }}
            </p>
            <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="stat in activeYearStats" :key="stat.label">
                <p class="text-xs text-night-400">{{ stat.label }}</p>
                <p class="font-serif font-bold text-lg text-night tabular-nums">{{ stat.value }}</p>
              </div>
            </div>
            <p class="mt-3 text-sm text-night-500 leading-relaxed">{{ activeYearComment }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ressources et dépenses par projet -->
    <section class="section-padding pt-0">
      <div class="container-narrow">
        <SectionTitle subtitle="Recettes regroupées et dépenses ventilées par projet, exercice par exercice">
          Par catégorie
        </SectionTitle>

        <div class="fade-in-up grid gap-4 md:gap-5">
          <article class="bg-white rounded-3xl p-5 md:p-8 shadow-lg">
            <h3 class="font-serif font-bold text-xl text-night">Ressources</h3>
            <p class="mt-1 text-sm text-night-400 mb-5">
              Subventions et prix · Dons · Loyer · Autres
            </p>
            <CategoryStackedChart
              :flow="data.categoryFlows.resources"
              aria-label="Ressources par grand poste et par exercice"
            />
          </article>

          <article class="bg-white rounded-3xl p-5 md:p-8 shadow-lg">
            <h3 class="font-serif font-bold text-xl text-night">Dépenses par projet</h3>
            <p class="mt-1 text-sm text-night-400 mb-5">
              Musée, maison, cours d’anglais, AKUUVision, fonctionnement…
            </p>
            <CategoryStackedChart
              :flow="data.categoryFlows.projects"
              aria-label="Dépenses par projet et par exercice"
            />
          </article>
        </div>
      </div>
    </section>

    <!-- Dépenses par projet -->
    <section class="section-padding pt-0">
      <div class="container-narrow">
        <SectionTitle subtitle="Chaque part correspond à une part réelle des dépenses totales : survolez ou cliquez une tranche">
          Dépenses par projet
        </SectionTitle>

        <div class="fade-in-up bg-white rounded-3xl p-5 md:p-8 shadow-lg">
          <ProjectSpendingPie
            :slices="projectPieSlices"
            :total="data.projectSpending.total"
          />
        </div>

        <p class="mt-4 text-sm text-night-400">
          Aucune dépense identifiable n'a encore été trouvée pour le projet Bagazan.
          Les écarts avec les synthèses annuelles restent documentés dans le classeur de contrôle.
        </p>
      </div>
    </section>

    <!-- Dépenses à confirmer -->
    <section
      v-if="data.projectClassification.unconfirmedItems.length"
      class="section-padding pt-0"
    >
      <div class="container-narrow">
        <SectionTitle :subtitle="`${data.projectClassification.unconfirmedItems.length} opérations · ${euro(data.projectClassification.unconfirmedAmount)} au total`">
          Dépenses à confirmer
        </SectionTitle>

        <div class="fade-in-up bg-white rounded-3xl p-5 md:p-7 shadow-lg max-h-[32rem] overflow-y-auto">
          <ol class="space-y-3">
            <li
              v-for="item in data.projectClassification.unconfirmedItems"
              :key="item.id"
              class="flex gap-3 text-sm border-b border-night-100 pb-3 last:border-0 last:pb-0"
            >
              <span class="font-semibold text-ochre-600 tabular-nums shrink-0 w-8">
                {{ item.id }}.
              </span>
              <span class="min-w-0">
                <span class="block font-medium text-night">
                  {{ formatDate(item.date) }} · {{ euro(item.amount) }}
                </span>
                <span class="block text-night-500 leading-relaxed">{{ item.label }}</span>
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- D'où vient l'argent + comparaison logistique -->
    <section class="section-padding pt-0">
      <div class="container-narrow grid gap-4 md:gap-5">
        <article class="fade-in-up bg-white rounded-3xl p-5 md:p-7 shadow-lg">
          <h3 class="font-serif font-bold text-2xl text-night">D'où vient l'argent</h3>
          <p class="mt-1 text-sm text-night-400">
            {{ euro(data.totals.resources) }} de ressources retenues sur la période
          </p>

          <ul class="mt-6 space-y-4">
            <li v-for="item in data.income" :key="item.label">
              <div class="flex items-baseline justify-between gap-3 text-sm mb-1.5">
                <span class="font-medium text-night">{{ item.label }}</span>
                <span class="text-night-400 tabular-nums whitespace-nowrap">
                  {{ euro(item.amount) }} · {{ formatShare((item.amount / data.totals.resources) * 100) }}
                </span>
              </div>
              <div class="h-2.5 rounded-full bg-night-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-forest transition-[width] duration-1000 ease-out"
                  :style="{ width: `${(item.amount / data.totals.resources) * 100}%` }"
                />
              </div>
            </li>
          </ul>
        </article>

        <article class="fade-in-up bg-white rounded-3xl p-5 md:p-7 shadow-lg">
          <h3 class="font-serif font-bold text-2xl text-night">Frais de fonctionnement</h3>
          <p class="mt-1 text-sm text-night-400">
            Site web, banque et autres services administratifs, baisse nette depuis 2024
          </p>

          <div class="mt-6">
            <LogisticsTrendChart :history="data.logisticsHistory" />
          </div>

          <div class="mt-6 rounded-2xl bg-cream-200 p-4 md:p-5">
            <div class="flex items-baseline justify-between gap-3">
              <p class="font-serif font-bold text-xl text-night">
                Moyenne {{ data.logisticsAverage.periodLabel }}
              </p>
              <p class="font-serif font-bold text-xl text-night tabular-nums">
                {{ euro(data.logisticsAverage.total) }} / an
              </p>
            </div>
            <ul class="mt-3 space-y-1.5">
              <li
                v-for="line in data.logisticsAverage.lines"
                :key="line.label"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="inline-flex items-center gap-2 text-night-500">
                  <i class="w-2.5 h-2.5 rounded-sm" :class="logisticsColor[line.label]" aria-hidden="true" />
                  {{ line.label }}
                </span>
                <span class="font-semibold text-night tabular-nums whitespace-nowrap">
                  {{ euro(line.amount) }} / an
                </span>
              </li>
            </ul>
          </div>

          <div v-if="logistics2026" class="mt-6 rounded-2xl border border-night-100 p-4 md:p-5">
            <div class="flex items-baseline justify-between gap-3">
              <p class="font-serif font-bold text-lg text-night">
                2026 · projection annuelle
              </p>
              <p class="font-serif font-bold text-lg text-night tabular-nums">
                {{ euro(logistics2026.total) }}
              </p>
            </div>
            <ul class="mt-2 space-y-1.5">
              <li
                v-for="line in logistics2026.lines"
                :key="line.label"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="inline-flex items-center gap-2 text-night-500">
                  <i class="w-2.5 h-2.5 rounded-sm" :class="logisticsColor[line.label]" aria-hidden="true" />
                  {{ line.label }}
                </span>
                <span class="font-semibold text-night tabular-nums whitespace-nowrap">{{ euro(line.amount) }}</span>
              </li>
            </ul>
            <p class="mt-2 text-xs text-night-400">
              Constaté à fin septembre : {{ euro(logistics2026.actualTotal) }}
            </p>
          </div>

          <p class="mt-5 text-sm text-night-500 leading-relaxed">
            <span class="font-medium text-night">Autres outils et services :</span>
            {{ data.logisticsOtherNote }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import CategoryStackedChart from '@/components/comptes-ag/CategoryStackedChart.vue'
import FinancesTimelineChart from '@/components/comptes-ag/FinancesTimelineChart.vue'
import LogisticsTrendChart from '@/components/comptes-ag/LogisticsTrendChart.vue'
import ProjectSpendingPie from '@/components/comptes-ag/ProjectSpendingPie.vue'
import SectionTitle from '@/components/shared/SectionTitle.vue'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'
import data from '@/data/finances-ag.json'

useScrollAnimation()

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2
})

function euro (value) {
  return euroFormatter.format(value ?? 0)
}

function formatShare (value) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} %`
}

function formatDate (value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function formatShortDate (value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value))
}

const selectedYear = ref(null)

const destinationStyle = {
  terrain: { border: 'border-forest', label: 'text-forest', bar: 'bg-forest' },
  france: { border: 'border-bleu', label: 'text-bleu', bar: 'bg-bleu' },
  logistique: { border: 'border-ochre', label: 'text-ochre-600', bar: 'bg-ochre' }
}

const kpis = computed(() => [
  {
    label: 'Solde bancaire',
    value: data.totals.cashAfterEngagements,
    hint: 'Prévisionnel après remboursements et paiements non encore reçus (Fin septembre)',
    border: 'border-forest'
  },
  {
    label: 'Encaissé depuis 2017',
    value: data.totals.received,
    hint: 'Tout ce qui est arrivé sur le compte',
    border: 'border-bleu'
  },
  {
    label: 'Dépensé depuis 2017',
    value: data.totals.spent,
    hint: 'Tout ce qui en est sorti',
    border: 'border-terracotta'
  }
])

const maxDestination = Math.max(...data.destinations.map((item) => item.amount))
const logistics2026 = data.logisticsByYear.find((item) => item.year === 2026)

const projectNotesById = Object.fromEntries(
  data.projects
    .filter((item) => item.note || item.lineItems?.length)
    .map((item) => [item.id, { note: item.note, lineItems: item.lineItems }])
)

const projectPieSlices = computed(() =>
  data.projectSpending.slices.map((slice) => ({
    ...slice,
    share: data.projectSpending.total
      ? (slice.amount / data.projectSpending.total) * 100
      : 0,
    ...projectNotesById[slice.id]
  }))
)

const logisticsColor = {
  'Site web et hébergement': 'bg-bleu',
  'Frais bancaires': 'bg-ochre',
  'Autres outils et services': 'bg-forest'
}

const activeYear = computed(
  () => data.years.find((year) => year.year === selectedYear.value) ?? null
)

const activeYearStats = computed(() => {
  const year = activeYear.value
  if (!year) {
    return [
      { label: 'Encaissé', value: euro(data.totals.received) },
      { label: 'Dépensé', value: euro(data.totals.spent) },
      { label: 'Ressources du projet', value: euro(data.totals.resources) },
      { label: 'Exercices couverts', value: `${data.years.length}` }
    ]
  }
  return [
    { label: 'Encaissé', value: euro(year.credits) },
    { label: 'Dépensé', value: euro(year.debits) },
    { label: 'Ressources du projet', value: euro(year.resources) },
    {
      label: 'Solde en fin d\'année',
      value: year.closing === null ? 'exercice en cours' : euro(year.closing)
    }
  ]
})

const YEAR_COMMENTS = {
  2017: "Première année, création de l'association et première subvention reçue",
  2018: "Inauguration de la maison communautaire, premiers cours d'anglais et premiers loyers reçus",
  2019: "Année la plus dense en ressources : subventions, loyers et prestations se cumulent.",
  2020: "L'activité se réduit, mais la trésorerie accumulée reste intacte, arrivée du COVID-19",
  2021: "Année calme : peu d'entrées, très peu de sorties, association en pause pour cause de COVID-19",
  2022: "Le fonctionnement courant se poursuit restructuration des objectifs, association en pause pour cause de COVID-19",
  2023: "Les dépenses repartent avant le lancement du chantier du musée.",
  2024: "Année du musée : la réserve accumulée depuis 2019 finance le chantier, démarrage de la restauration de la maison communautaire.",
  2025: "La campagne Shapishiko relance les dons, premier vrai crowdfunding de l'association. Construction du musée.",
  2026: "Amenagement du musée, première inauguration officielle."
}

const activeYearComment = computed(() => {
  const year = activeYear.value
  if (!year) {
    return `Sur dix exercices, ${euro(data.totals.received)} sont entrés et ${euro(data.totals.spent)} sont sortis, soit un flux bancaire net positif de ${euro(data.totals.received - data.totals.spent)}.`
  }
  return `${YEAR_COMMENTS[year.year]} Couverture : ${year.coverage.toLowerCase()}.`
})
</script>

<style scoped>
.ag-cover {
  background: radial-gradient(120% 150% at 88% 0%, #0a63b4 0%, #04488F 43%, #022a54 78%);
}

/* Incrustation « Où va l'argent » : fond sombre + opacité optionnelle (--fillon-incrustation-opacity) */
.comptes-ag-fillon-incrustation {
  opacity: var(--fillon-incrustation-opacity, 1);
}

@media (prefers-reduced-motion: no-preference) {
  .ag-cover-colibri {
    animation: agColibriHover 11s linear infinite;
    transform-style: preserve-3d;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ag-cover-colibri {
    animation: none;
  }
}

@keyframes agColibriHover {
   0% { transform: translate3d(  0.0px,   0.0px,     0px) rotate( 3.0deg) scale(1.080); }
   5% { transform: translate3d(  3.7px,  -0.5px,   8.8px) rotate( 2.9deg) scale(1.065); }
  10% { transform: translate3d(  7.1px,  -2.1px,  14.3px) rotate( 2.4deg) scale(1.025); }
  15% { transform: translate3d(  9.7px,  -4.5px,  14.3px) rotate( 1.8deg) scale(0.975); }
  20% { transform: translate3d( 11.4px,  -7.6px,   8.8px) rotate( 0.9deg) scale(0.935); }
  25% { transform: translate3d( 12.0px, -11.0px,   0.0px) rotate( 0.0deg) scale(0.920); }
  30% { transform: translate3d( 11.4px, -14.4px,  -8.8px) rotate(-0.9deg) scale(0.935); }
  35% { transform: translate3d(  9.7px, -17.5px, -14.3px) rotate(-1.8deg) scale(0.975); }
  40% { transform: translate3d(  7.1px, -19.9px, -14.3px) rotate(-2.4deg) scale(1.025); }
  45% { transform: translate3d(  3.7px, -21.5px,  -8.8px) rotate(-2.9deg) scale(1.065); }
  50% { transform: translate3d(  0.0px, -22.0px,   0.0px) rotate(-3.0deg) scale(1.080); }
  55% { transform: translate3d( -3.7px, -21.5px,   8.8px) rotate(-2.9deg) scale(1.065); }
  60% { transform: translate3d( -7.1px, -19.9px,  14.3px) rotate(-2.4deg) scale(1.025); }
  65% { transform: translate3d( -9.7px, -17.5px,  14.3px) rotate(-1.8deg) scale(0.975); }
  70% { transform: translate3d(-11.4px, -14.4px,   8.8px) rotate(-0.9deg) scale(0.935); }
  75% { transform: translate3d(-12.0px, -11.0px,   0.0px) rotate( 0.0deg) scale(0.920); }
  80% { transform: translate3d(-11.4px,  -7.6px,  -8.8px) rotate( 0.9deg) scale(0.935); }
  85% { transform: translate3d( -9.7px,  -4.5px, -14.3px) rotate( 1.8deg) scale(0.975); }
  90% { transform: translate3d( -7.1px,  -2.1px, -14.3px) rotate( 2.4deg) scale(1.025); }
  95% { transform: translate3d( -3.7px,  -0.5px,  -8.8px) rotate( 2.9deg) scale(1.065); }
 100% { transform: translate3d(  0.0px,   0.0px,   0.0px) rotate( 3.0deg) scale(1.080); }
}
</style>
