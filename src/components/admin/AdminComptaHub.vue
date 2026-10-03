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

    <AdminComptaOverview v-if="view === 'overview'" />

    <template v-if="view === 'ecritures'">
      <p v-if="error" class="rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-800">
        Saisies de l'application indisponibles ({{ error }}) · les écritures des journaux s'affichent quand même.
      </p>
      <AdminComptaEcritures
        :key="`${ecrituresYear}-${metaVersion}`"
        :initial-year="ecrituresYear"
        @journal-updated="caisseRefreshKey += 1"
      />
    </template>

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
import {
  TRESORERIE_PROJECTS,
  TRESORERIE_CATEGORIES,
  formatPen,
  formatEur,
  labelFor,
  sumPen,
  sumEur
} from '@/data/tresorerie-config.js'
import { formatAmountWithConversion } from '@/data/currency.js'
import { filterJournal } from '@/data/compta-summary.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import AdminDataTable from './AdminDataTable.vue'
import AdminComptaOverview from './AdminComptaOverview.vue'
import AdminComptaEcritures from './AdminComptaEcritures.vue'
import AdminComptaFactures from './AdminComptaFactures.vue'
import AdminCaissePerouPanel from './AdminCaissePerouPanel.vue'
import AdminTresorerieMeta from './AdminTresorerieMeta.vue'
import driveHealthData from '@/data/drive-health.json'

const store = useTresorerieStore()
const driveHealth = driveHealthData?.ok != null ? driveHealthData : null
const loading = ref(false)
const error = ref(null)
const filterProject = ref('')
const filterYear = ref('')
const filterMonth = ref('')
const journalSectionRef = ref(null)
const view = ref('overview')
const ecrituresYear = ref(String(new Date().getFullYear()))
const caisseRefreshKey = ref(0)
const metaVersion = ref(0)
const views = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'ecritures', label: 'Écritures' },
  { id: 'factures', label: 'Factures' },
  { id: 'caisse', label: 'Caisse Pérou' },
  { id: 'reglages', label: 'Réglages' }
]

const journalColumns = [
  { key: 'expense_date', label: 'Date' },
  { key: 'reference', label: 'Réf.' },
  { key: 'project', label: 'Projet' },
  { key: 'category', label: 'Nature' },
  { key: 'amount_pen', label: 'Montant', align: 'right' },
  { key: 'label', label: 'Libellé' },
  { key: 'submitter_email', label: 'Bénévole' },
  { key: 'drive_file_url', label: 'Pièce', align: 'center' }
]

const summary = computed(() => store.compta.summary)
const journal = computed(() => store.compta.journal ?? [])

const maxProjectPen = computed(() =>
  Math.max(...(summary.value?.by_project?.map((p) => p.amount_pen) ?? [1]), 1)
)

const filteredJournal = computed(() => {
  const rows = filterJournal(journal.value, {
    project: filterProject.value,
    year: filterYear.value,
    month: filterMonth.value
  })
  return [...rows].sort((a, b) => {
    const da = new Date(a.expense_date || a.journal_at || 0).getTime()
    const db = new Date(b.expense_date || b.journal_at || 0).getTime()
    return db - da
  })
})

const filteredTotalPen = computed(() => sumPen(filteredJournal.value))
const filteredTotalEur = computed(() => sumEur(filteredJournal.value))

const yearOptions = computed(() => {
  const years = new Set()
  journal.value.forEach((row) => {
    const raw = row.expense_date || row.journal_at
    if (raw) years.add(new Date(raw).getFullYear())
  })
  if (!years.size) years.add(new Date().getFullYear())
  return [...years].sort((a, b) => b - a)
})

const monthOptions = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
]

const monthLabel = computed(() => {
  const m = monthOptions.find((o) => o.value === String(summary.value?.month))
  return m?.label ?? ''
})

const kpis = computed(() => {
  const s = summary.value
  if (!s) return []
  return [
    {
      label: `Dépenses ${s.year}`,
      primary: formatPen(s.total_pen_ytd),
      secondary: `≈ ${formatEur(s.total_eur_ytd)}`,
      accent: 'border-t-4 border-forest'
    },
    {
      label: monthLabel.value || 'Ce mois',
      primary: formatPen(s.total_pen_month),
      secondary: `≈ ${formatEur(s.total_eur_month)}`,
      accent: 'border-t-4 border-leaf'
    },
    {
      label: 'Écritures',
      primary: String(s.entry_count),
      secondary: 'journal comptable',
      accent: 'border-t-4 border-bleu'
    },
    {
      label: 'Projets actifs',
      primary: String(s.by_project?.length ?? 0),
      secondary: 'avec dépenses',
      accent: 'border-t-4 border-ochre'
    }
  ]
})

function projectBarWidth(item) {
  const pct = (item.amount_pen / maxProjectPen.value) * 100
  return `${Math.max(pct, 4)}%`
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

const archiveYears = computed(() =>
  (driveHealth?.years ?? []).filter(
    (y) => y.factures_index > 0 || y.depenses > 0 || y.detail_pm_lines > 0
  )
)

const archiveYearsDesc = computed(() => [...archiveYears.value].sort((a, b) => b.year - a.year))

const maxArchiveFactures = computed(() =>
  Math.max(...archiveYears.value.map((y) => y.factures_index), 1)
)

const YEAR_BAR_COLORS = [
  'bg-forest',
  'bg-leaf',
  'bg-bleu',
  'bg-ochre',
  'bg-terracotta',
  'bg-night-400',
  'bg-forest-600',
  'bg-leaf-600',
  'bg-bleu-600',
  'bg-ochre-600'
]

function yearBarColor(year) {
  return YEAR_BAR_COLORS[(year - 2017) % YEAR_BAR_COLORS.length]
}

function yearBarWidth(y) {
  const total = driveHealth?.totals?.factures_total || 1
  const pct = (y.factures_index / total) * 100
  return y.factures_index ? `${Math.max(pct, 2)}%` : '0%'
}

function yearFacturePct(y) {
  const pct = (y.factures_index / maxArchiveFactures.value) * 100
  return `${Math.max(pct, y.factures_index ? 6 : 0)}%`
}

function selectArchiveYear(year) {
  ecrituresYear.value = String(year)
  view.value = 'ecritures'
  filterYear.value = String(year)
  filterMonth.value = ''
  requestAnimationFrame(() => {
    journalSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function folderIconClass(icon) {
  const map = {
    root: 'bg-forest/10 text-forest',
    factures: 'bg-terracotta/10 text-terracotta',
    releves: 'bg-bleu/10 text-bleu',
    comptes: 'bg-leaf/15 text-forest',
    historique: 'bg-ochre/15 text-ochre-700'
  }
  return map[icon] ?? 'bg-night-100 text-night-500'
}

function formatHealthDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function clearFilters() {
  filterProject.value = ''
  filterYear.value = ''
  filterMonth.value = ''
}

</script>
