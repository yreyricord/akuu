<template>
  <div class="space-y-5">
    <!-- Filtres -->
    <section class="flex flex-wrap items-end gap-3 rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
      <label class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Année</span>
        <select v-model="year" class="admin-input min-w-[7rem] py-2 text-sm">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>
      <label class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Mois</span>
        <select v-model="month" class="admin-input min-w-[8rem] py-2 text-sm">
          <option value="">Tous</option>
          <option v-for="(m, i) in MONTHS" :key="m" :value="String(i + 1).padStart(2, '0')">{{ m }}</option>
        </select>
      </label>
      <label class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Projet</span>
        <select v-model="project" class="admin-input min-w-[11rem] py-2 text-sm">
          <option value="">Tous</option>
          <option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <div class="space-y-1">
        <span class="block text-xs font-bold uppercase tracking-wide text-night-500">Type</span>
        <div class="flex gap-1 rounded-full bg-cream-200 p-1" role="group" aria-label="Type d'écriture">
          <button
            v-for="t in TYPES"
            :key="t.id"
            type="button"
            class="admin-segment px-3 transition"
            :class="type === t.id ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500 hover:text-night'"
            :aria-pressed="type === t.id"
            @click="type = t.id"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <label class="min-w-[12rem] flex-1 space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Rechercher</span>
        <input v-model.trim="search" type="search" class="admin-input w-full py-2 text-sm" placeholder="Libellé, fournisseur, réf." />
      </label>
    </section>

    <!-- Totaux -->
    <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Écritures</p>
        <p class="mt-1 text-xl font-bold tabular-nums">{{ rows.length }}</p>
        <p class="text-xs text-night-500">{{ counts.banque }} banque · {{ counts.terrain }} terrain</p>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Recettes (banque)</p>
        <p class="mt-1 text-xl font-bold tabular-nums text-forest-700">{{ eur(totals.recettes) }}</p>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Dépenses (banque)</p>
        <p class="mt-1 text-xl font-bold tabular-nums text-bleu-700">{{ eur(totals.depenses) }}</p>
      </article>
      <article class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Dépenses terrain</p>
        <p class="mt-1 text-xl font-bold tabular-nums">{{ pen(totals.terrain) }}</p>
        <p class="text-xs text-night-500">en espèces, déjà financées par les retraits banque</p>
      </article>
    </section>

    <!-- Confirmation de suppression -->
    <section
      v-if="toDelete"
      class="space-y-3 rounded-2xl border border-terracotta/40 bg-terracotta/5 p-4"
      aria-live="polite"
    >
      <p class="text-sm">
        Supprimer <strong>{{ toDelete.label }}</strong>
        ({{ formatDate(toDelete.date) }} · {{ toDelete.eur != null ? eur(toDelete.eur) : pen(toDelete.pen) }} ·
        <span class="font-mono text-xs">{{ toDelete.ref }}</span>) ?
      </p>
      <label class="block space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Motif (obligatoire, gardé dans l'historique)</span>
        <input v-model.trim="deleteReason" type="text" class="admin-input w-full py-2 text-sm" placeholder="Ex. doublon de la ligne …" />
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="min-h-[40px] rounded-full bg-terracotta-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="deleteReason.length < 3 || deleting"
          @click="confirmDelete"
        >
          {{ deleting ? 'Suppression…' : 'Supprimer la ligne' }}
        </button>
        <button type="button" class="min-h-[40px] rounded-full border border-night-200 px-4 text-sm font-semibold" @click="toDelete = null">
          Annuler
        </button>
      </div>
      <p v-if="deleteError" class="text-sm text-terracotta-700">{{ deleteError }}</p>
    </section>
    <p v-if="deletedCount" class="text-xs text-night-500">
      {{ deletedCount }} ligne(s) supprimée(s) en {{ year }} (motifs gardés dans l'historique).
    </p>

    <p v-if="live && year === String(live.year)" class="flex flex-wrap items-center gap-2 text-xs text-forest-700">
      <span class="inline-block h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
      {{ year }} en direct depuis le journal Google — projet et mode de paiement modifiables (badge « Caisse » = espèces comptées au Pérou)
      <a :href="live.sheet_url" target="_blank" rel="noopener noreferrer" class="font-semibold text-bleu hover:underline">Ouvrir le journal</a>
    </p>
    <p v-else-if="!journalLoading && year >= String(new Date().getFullYear() - 1)" class="rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-900">
      Journal {{ year }} introuvable — vérifiez que <strong>Journal_AKUU_{{ year }}</strong> existe sur le Drive (Google Sheet) et que l’Apps Script est déployé.
    </p>
    <p v-else-if="!journalLoading && exerciceStatuts[year] === 'clos'" class="rounded-xl border border-night-200 bg-cream-100 px-4 py-3 text-sm text-night-700">
      Exercice {{ year }} clôturé — modifications impossibles. Demandez une réouverture dans l’onglet Exercices.
    </p>
    <p v-if="saveOk" class="text-sm text-forest-700">{{ saveOk }}</p>
    <p v-if="saveError" class="text-sm text-terracotta-700">{{ saveError }}</p>
    <AdminLoadingPanel
      v-if="journalLoading && yearRows.length"
      variant="inline"
      title="Mise à jour du journal"
      :detail="`Année ${year} · Google Drive`"
      :progress="journalProg.progress"
      :step-label="journalProg.stepLabel"
      hint=""
    />
    <AdminLoadingPanel
      v-if="journalLoading && !yearRows.length"
      title="Chargement des écritures"
      :detail="`Lecture du journal ${year} sur Google Drive…`"
      hint="La première lecture peut prendre 10 à 30 secondes."
      :progress="journalProg.progress"
      :step-label="journalProg.stepLabel"
    />

    <AdminDataTable
      v-if="!journalLoading || yearRows.length"
      :columns="columns"
      :rows="visibleRows"
      row-key-field="key"
      empty-message="Aucune écriture pour ces filtres."
    >
      <template #cell-date="{ row }">
        <span class="whitespace-nowrap text-sm tabular-nums">{{ formatDate(row.date) }}</span>
      </template>
      <template #cell-source="{ row }">
        <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="SOURCE[row.source].cls">
          {{ SOURCE[row.source].label }}
        </span>
      </template>
      <template #cell-label="{ row }">
        <span class="line-clamp-2 text-sm">{{ row.label }}</span>
        <span class="block font-mono text-[11px] text-night-400">{{ row.ref }}</span>
      </template>
      <template #cell-project="{ row }">
        <select
          v-if="canEditRow(row)"
          class="admin-input max-w-[11rem] py-1 text-xs"
          :value="normalizeProjectCode(row)"
          :disabled="savingRef === row.ref"
          @change="saveProject(row, $event.target.value)"
        >
          <option v-for="p in projectsList" :key="p.code" :value="p.code">{{ p.label }}</option>
        </select>
        <span v-else class="text-xs">{{ row.project }}</span>
      </template>
      <template #cell-payment="{ row }">
        <template v-if="row.source === 'terrain' && row.type === 'depense'">
          <select
            v-if="canEditRow(row)"
            class="admin-input max-w-[9rem] py-1 text-xs"
            :value="row.payment_method || 'especes'"
            :disabled="savingRef === row.ref"
            @change="savePayment(row, $event.target.value)"
          >
            <option v-for="m in TERRAIN_PAYMENTS" :key="m.code" :value="m.code">{{ m.label }}</option>
          </select>
          <span v-else class="text-xs">{{ paymentLabel(row.payment_method) }}</span>
          <span
            v-if="row.caisse_cash"
            class="ml-1 inline-flex rounded-full bg-leaf/15 px-1.5 py-0.5 text-[10px] font-semibold text-forest-700"
            title="Compté dans la caisse espèces au Pérou"
          >Caisse</span>
        </template>
        <span v-else class="text-xs text-night-300">—</span>
      </template>
      <template #cell-amount="{ row }">
        <span
          class="whitespace-nowrap font-semibold tabular-nums"
          :class="row.type === 'recette' ? 'text-forest-700' : 'text-night'"
        >
          {{ row.type === 'recette' ? '+' : '−' }}{{ row.eur != null ? eur(row.eur) : pen(row.pen) }}
        </span>
      </template>
      <template #cell-url="{ row }">
        <a
          v-if="row.url"
          :href="row.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-[32px] items-center text-xs font-semibold text-bleu hover:underline"
        >
          Voir
        </a>
        <span v-else class="text-xs text-night-300">—</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="canDelete"
          type="button"
          class="inline-flex min-h-[32px] items-center rounded-full px-2 text-xs font-semibold text-terracotta-700 hover:bg-terracotta/10"
          :aria-label="`Supprimer ${row.label}`"
          @click="askDelete(row)"
        >
          Supprimer
        </button>
      </template>
    </AdminDataTable>

    <div v-if="rows.length > visibleRows.length" class="text-center">
      <button
        type="button"
        class="min-h-[44px] rounded-full border border-forest px-5 text-sm font-semibold text-forest-700 hover:bg-forest/5"
        @click="limit += 100"
      >
        Afficher plus ({{ rows.length - visibleRows.length }} restantes)
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import { TRESORERIE_PROJECTS, PAYMENT_METHODS } from '@/data/tresorerie-config.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import AdminDataTable from './AdminDataTable.vue'
import AdminLoadingPanel from './AdminLoadingPanel.vue'

const emit = defineEmits(['journal-updated'])

const props = defineProps({
  initialYear: { type: String, default: '' }
})

const TERRAIN_PAYMENTS = PAYMENT_METHODS.filter((m) => ['especes', 'avance', 'cb', 'virement', 'yape_plin'].includes(m.code))
const projectsList = ref([...TRESORERIE_PROJECTS])
const saveOk = ref('')

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const TYPES = [
  { id: '', label: 'Tout' },
  { id: 'depense', label: 'Dépenses' },
  { id: 'recette', label: 'Recettes' }
]
const SOURCE = {
  banque: { label: 'Banque', cls: 'bg-bleu-100 text-bleu-700' },
  terrain: { label: 'Terrain', cls: 'bg-ochre-100 text-ochre-700' }
}
const baseColumns = [
  { key: 'date', label: 'Date' },
  { key: 'source', label: 'Origine' },
  { key: 'label', label: 'Libellé' },
  { key: 'project', label: 'Projet' },
  { key: 'payment', label: 'Paiement' },
  { key: 'amount', label: 'Montant', align: 'right' },
  { key: 'url', label: 'Pièce', align: 'center' }
]
const columns = computed(() => {
  const cols = [...baseColumns]
  if (canEdit.value) cols.push({ key: 'actions', label: '', align: 'right' })
  return cols
})

const data = ref(null)
const journalLoading = ref(false)
const journalProg = bindLoadingProgress(journalLoading, {
  estimateMs: 28_000,
  label: 'Lecture du journal Google…'
})
const year = ref(props.initialYear || String(new Date().getFullYear()))
const month = ref('')
const project = ref('')
const type = ref('')
const search = ref('')
const limit = ref(150)

function defaultYearList() {
  const end = new Date().getFullYear()
  return Array.from({ length: end - 2016 }, (_, i) => String(end - i))
}

function initYearSlots() {
  const years = {}
  defaultYearList().forEach((y) => { years[y] = [] })
  data.value = { years }
}

function mergeExerciceYears(ex) {
  ex?.years?.forEach((row) => {
    const k = String(row.year)
    if (!data.value.years[k]) {
      data.value = { ...data.value, years: { ...data.value.years, [k]: [] } }
    }
  })
}

function applyJournalResponse(y, res) {
  if (res?.live && data.value) {
    data.value = { ...data.value, years: { ...data.value.years, [y]: res.rows } }
    live.value = res
  } else {
    live.value = res || null
    if (data.value && !data.value.years[y]?.length) {
      data.value = { ...data.value, years: { ...data.value.years, [y]: [] } }
    }
  }
}

onMounted(() => {
  initYearSlots()
  const cached = tresorerieApi.peekJournalAnnee?.(year.value)
  if (cached) applyJournalResponse(year.value, cached)
  journalLoading.value = !cached

  loadLive(year.value)
  Promise.all([
    tresorerieApi.getExercices().then((ex) => {
      mergeExerciceYears(ex)
      const ys = Object.keys(data.value.years || {}).sort()
      if (!ys.includes(year.value) && ys.length) year.value = ys.at(-1)
    }),
    loadExerciceStatut(year.value),
    loadProjects(),
    tresorerieApi.getCorrections().then((c) => { corrections.value = c }).catch(() => { corrections.value = [] })
  ]).catch(() => {})
})

const live = ref(null)
async function loadLive(y, { force = false } = {}) {
  if (!force) {
    const cached = tresorerieApi.peekJournalAnnee?.(y)
    if (cached) {
      applyJournalResponse(y, cached)
      journalLoading.value = false
      return cached
    }
  }
  journalLoading.value = !force && !(data.value?.years?.[y]?.length) && !tresorerieApi.peekJournalAnnee?.(y)
  try {
    const res = await tresorerieApi.getJournalAnnee(y, { force })
    applyJournalResponse(y, res)
    return res
  } catch {
    live.value = null
    return null
  } finally {
    journalLoading.value = false
  }
}

watch(year, (y) => {
  loadLive(y)
  loadExerciceStatut(y)
})


const corrections = ref([])
const toDelete = ref(null)
const deleteReason = ref('')
const deleting = ref(false)
const deleteError = ref('')
const exerciceStatuts = ref({})
async function loadExerciceStatut(y) {
  try {
    const ex = await tresorerieApi.getExercice(y)
    exerciceStatuts.value = { ...exerciceStatuts.value, [y]: ex.statut }
  } catch { /* ignore */ }
}
const canDelete = computed(() => {
  const s = exerciceStatuts.value[year.value]
  return s === 'ouvert' || s === 'rouvert'
})
const canEdit = computed(() => {
  if (!live.value?.live || year.value !== String(live.value.year)) return false
  const s = exerciceStatuts.value[year.value]
  return s !== 'clos'
})
const savingRef = ref('')
const saveError = ref('')
const deletedRefs = computed(() => new Set(corrections.value.filter((c) => c.type === 'delete').map((c) => c.reference)))
const attachedUrls = computed(() => Object.fromEntries(
  corrections.value.filter((c) => c.type === 'attach').map((c) => [c.reference, c.drive_file_url])
))
const deletedCount = computed(() => (data.value?.years?.[year.value] ?? []).filter((r) => deletedRefs.value.has(r.ref)).length)

function askDelete(row) {
  toDelete.value = row
  deleteReason.value = ''
  deleteError.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function canEditRow(row) {
  return canEdit.value && row.editable !== false
}

async function loadProjects() {
  try {
    const meta = await tresorerieApi.getTresorerieMeta()
    if (meta?.projects?.length) projectsList.value = meta.projects
  } catch { /* défaut local */ }
}

function normalizeProjectCode(row) {
  const raw = row.project_code || row.project || ''
  const low = String(raw).toLowerCase().replace(/\s+/g, '_')
  const hit = projectsList.value.find((p) => p.code === low || p.label === row.project)
  return hit?.code || low || 'divers'
}

function projectCodeFromLabel(label) {
  const hit = projectsList.value.find((p) => p.label === label)
  return hit?.code || 'divers'
}

function paymentLabel(code) {
  return TERRAIN_PAYMENTS.find((m) => m.code === code)?.label || code || '—'
}

async function saveProject(row, projectCode) {
  const current = normalizeProjectCode(row)
  if (!projectCode || projectCode === current) return
  savingRef.value = row.ref
  saveError.value = ''
  saveOk.value = ''
  try {
    const res = await tresorerieApi.updateJournalLine({ reference: row.ref, year: Number(year.value), project: projectCode })
    await loadLive(year.value, { force: true })
    saveOk.value = `Projet mis à jour (${row.ref} → ${res.project || projectCode}).`
    emit('journal-updated')
  } catch (e) {
    saveError.value = e.message || 'Modification impossible'
  } finally {
    savingRef.value = ''
  }
}

async function savePayment(row, paymentMethod) {
  if (!paymentMethod || paymentMethod === row.payment_method) return
  savingRef.value = row.ref
  saveError.value = ''
  saveOk.value = ''
  try {
    await tresorerieApi.updateJournalLine({ reference: row.ref, year: Number(year.value), payment_method: paymentMethod })
    await loadLive(year.value, { force: true })
    saveOk.value = `Paiement mis à jour (${row.ref}).`
    emit('journal-updated')
  } catch (e) {
    saveError.value = e.message || 'Modification impossible'
  } finally {
    savingRef.value = ''
  }
}

async function confirmDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    const c = await tresorerieApi.requestDeletion({ reference: toDelete.value.ref, year: Number(year.value), reason: deleteReason.value })
    corrections.value = [...corrections.value, c]
    toDelete.value = null
    await loadLive(year.value, { force: true })
    emit('journal-updated')
  } catch (e) {
    deleteError.value = e.message
  } finally {
    deleting.value = false
  }
}

watch([year, month, project, type, search], () => { limit.value = 150 })

const yearOptions = computed(() => Object.keys(data.value?.years ?? {}).sort().reverse())

const yearRows = computed(() => {
  const base = data.value?.years?.[year.value] ?? []
  return base
    .filter((r) => !deletedRefs.value.has(r.ref))
    .map((r, i) => ({ ...r, url: r.url || attachedUrls.value[r.ref] || '', key: `${r.source}-${r.ref}-${i}` }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

const projectOptions = computed(() => [...new Set(yearRows.value.map((r) => r.project).filter(Boolean))].sort())

const rows = computed(() => {
  const q = search.value.toLowerCase()
  return yearRows.value.filter((r) => {
    if (month.value && (r.date || '').slice(5, 7) !== month.value) return false
    if (project.value && r.project !== project.value) return false
    if (type.value && r.type !== type.value) return false
    if (q && !`${r.label} ${r.vendor} ${r.ref} ${r.category}`.toLowerCase().includes(q)) return false
    return true
  })
})

const visibleRows = computed(() => rows.value.slice(0, limit.value))

const counts = computed(() => {
  const c = { banque: 0, terrain: 0 }
  rows.value.forEach((r) => { if (c[r.source] != null) c[r.source] += 1 })
  return c
})

const totals = computed(() => {
  const t = { recettes: 0, depenses: 0, terrain: 0 }
  rows.value.forEach((r) => {
    if (r.source === 'banque') {
      if (r.type === 'recette') t.recettes += r.eur || 0
      else t.depenses += r.eur || 0
    } else if (r.pen && r.caisse_cash !== false) {
      t.terrain += r.pen
    }
  })
  return t
})

function eur(v) { return `${(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` }
function pen(v) { return `${(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} S/` }
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
