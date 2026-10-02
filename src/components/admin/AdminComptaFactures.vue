<template>
  <div class="space-y-6">
    <!-- Ajouter une facture -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-forest-700">Ajouter une facture</h3>
          <p class="mt-1 text-sm text-night-500">
            Le fichier est renommé automatiquement (date_référence_montant_fournisseur) et rangé dans
            <strong class="text-night">3_Trésorerie/&lt;année&gt;/Factures</strong> sur le Drive.
          </p>
        </div>
        <div class="flex gap-1 rounded-full bg-cream-200 p-1" role="group" aria-label="Type d'ajout">
          <button type="button" :class="segClass(mode === 'attach')" :aria-pressed="mode === 'attach'" @click="mode = 'attach'">
            À une écriture existante
          </button>
          <button type="button" :class="segClass(mode === 'new')" :aria-pressed="mode === 'new'" @click="mode = 'new'">
            Nouvelle dépense
          </button>
        </div>
      </div>

      <!-- Rattacher -->
      <div v-if="mode === 'attach'" class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div class="space-y-3">
          <div v-if="yearBanner" class="rounded-xl px-4 py-3 text-sm" :class="yearBanner.cls">
            {{ yearBanner.text }}
            <button
              v-if="yearBanner.retry"
              type="button"
              class="ml-2 font-semibold underline"
              @click="loadLive(year)"
            >
              Réessayer
            </button>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label class="space-y-1">
              <span class="text-xs font-bold uppercase tracking-wide text-night-500">Année</span>
              <select v-model="year" class="admin-input min-w-[9rem] py-2 text-sm">
                <option :value="ALL_YEARS">Toutes les années</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label class="min-w-[12rem] flex-1 space-y-1">
              <span class="text-xs font-bold uppercase tracking-wide text-night-500">Rechercher</span>
              <input v-model.trim="search" type="search" class="admin-input w-full py-2 text-sm" placeholder="Libellé, montant, réf." />
            </label>
          </div>
          <AdminLoadingPanel
            v-if="loadingCandidates"
            variant="inline"
            :title="isAllYears ? 'Journaux 2017 → année courante' : `Journal ${year}`"
            :detail="isAllYears ? `Synchronisation ${loadProgress.done} / ${loadProgress.total} années` : 'Recherche des dépenses sans facture'"
            :progress="isAllYears ? syncPercent : yearProg.progress"
            hint=""
          />
          <p v-else class="text-sm text-night-500">
            <template v-if="isAllYears">
              <strong class="text-night">{{ candidates.length }}</strong> dépense(s) sans facture · toutes les années
              <span v-if="unloadedYears.length" class="text-ochre-700"> · {{ unloadedYears.length }} journal(aux) non chargé(s)</span>
              <span v-if="candidates.length > shown.length"> · {{ shown.length }} affichées, affinez la recherche</span>
            </template>
            <template v-else-if="journalLoaded(year)">
              <strong class="text-night">{{ candidates.length }}</strong> dépense(s) sans facture en {{ year }}
              <span v-if="candidates.length > shown.length"> · {{ shown.length }} affichées, affinez la recherche</span>
            </template>
            <span v-else class="text-ochre-700">Journal {{ year }} non disponible — choisissez une autre année ou réessayez.</span>
          </p>
          <ul class="max-h-[420px] space-y-1.5 overflow-y-auto pr-1" role="listbox" aria-label="Écritures sans facture">
            <li v-for="r in shown" :key="r.key">
              <button
                type="button"
                role="option"
                :aria-selected="selected?.key === r.key"
                class="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition"
                :class="selected?.key === r.key ? 'border-forest bg-forest/5 ring-1 ring-forest/30' : 'border-night-100 hover:border-forest/40'"
                @click="selected = r"
              >
                <span v-if="isAllYears" class="w-10 shrink-0 text-xs font-bold tabular-nums text-night-500">{{ r.year }}</span>
                <span class="w-20 shrink-0 text-xs tabular-nums text-night-500">{{ shortDate(r.date) }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium">{{ r.label }}</span>
                  <span class="block font-mono text-[11px] text-night-400">{{ r.ref }} · {{ r.source === 'terrain' ? 'terrain' : 'banque' }}</span>
                </span>
                <span class="shrink-0 text-sm font-semibold tabular-nums">{{ amount(r) }}</span>
              </button>
            </li>
            <li v-if="!shown.length && loadingCandidates" class="rounded-xl bg-cream-200 px-4 py-6 text-center text-sm text-night-500">
              Chargement… {{ isAllYears ? syncPercent : yearProg.progress }} %
            </li>
            <li v-else-if="!shown.length && !isAllYears && !journalLoaded(year)" class="rounded-xl bg-ochre-50 px-4 py-6 text-center text-sm text-ochre-800">
              {{ journalReason(year) || `Journal ${year} inaccessible.` }}
            </li>
            <li v-else-if="!shown.length" class="rounded-xl bg-cream-200 px-4 py-6 text-center text-sm text-night-500">
              {{ isAllYears ? 'Toutes les dépenses chargées ont leur facture.' : `Toutes les dépenses de ${year} ont leur facture.` }}
            </li>
          </ul>
        </div>

        <div class="space-y-4 rounded-xl bg-cream-100 p-4">
          <template v-if="selected">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-night-500">Écriture choisie</p>
              <p class="mt-1 font-semibold">{{ selected.label }}</p>
              <p class="text-sm text-night-500">
                {{ isAllYears ? `${selected.year} · ` : '' }}{{ formatDate(selected.date) }} · {{ amount(selected) }} · {{ selected.project }}
              </p>
            </div>
            <AdminFileCapture
              label="Facture"
              gallery-label="PDF ou galerie"
              hint="PDF, JPG, PNG ou HEIC — converti automatiquement en PDF"
              @update:single="(f) => (file = f)"
            />
            <div class="rounded-lg bg-white px-3 py-2">
              <p class="text-xs text-night-500">Nom sur le Drive</p>
              <p class="break-all font-mono text-xs">{{ previewName }}</p>
            </div>
            <button type="button" class="btn-primary w-full" :disabled="!file" @click="send">
              Envoyer la facture
            </button>
          </template>
          <p v-else class="py-10 text-center text-sm text-night-500">
            Choisissez une dépense dans la liste.
            <span v-if="sendingRefs.size" class="mt-2 block text-xs text-bleu">
              {{ sendingRefs.size }} envoi(s) en cours — suivi en bas de l'écran.
            </span>
          </p>
          <p v-if="message" class="rounded-lg px-3 py-2 text-sm" :class="message.ok ? 'bg-forest-100 text-forest-700' : 'bg-terracotta/10 text-terracotta-700'">
            {{ message.text }}
            <a v-if="message.url" :href="message.url" target="_blank" rel="noopener noreferrer" class="ml-1 font-semibold underline">Ouvrir</a>
          </p>
        </div>
      </div>

      <!-- Nouvelle dépense -->
      <div v-else class="mt-5">
        <p class="mb-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-night-600">
          Pour les frais de fonctionnement payés par AKUU (site, banque, assurance…). Les dépenses des projets
          passent par les bénévoles dans l'application (demande puis facture).
        </p>
        <AdminDirectExpenseForm />
      </div>
    </section>

    <!-- Factures par année -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h3 class="text-base font-semibold text-forest-700">Factures par année</h3>
        <a
          v-if="rootUrl"
          :href="rootUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-bleu hover:underline"
        >
          <PhFolderOpen :size="18" aria-hidden="true" /> Ouvrir 3_Trésorerie
        </a>
      </div>
      <AdminLoadingPanel
        v-if="loadingAll"
        class="mt-3"
        variant="inline"
        title="Synchronisation des journaux"
        :detail="`${loadProgress.done} / ${loadProgress.total} années`"
        :progress="syncPercent"
        hint=""
      />
      <div class="mt-4 space-y-3 md:hidden">
        <article
          v-for="y in yearRows"
          :key="`m-${y.year}`"
          class="rounded-xl border border-night-100 bg-cream-50 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="text-xl font-serif font-bold text-night hover:text-forest-700"
              @click="focusYear(y.year)"
            >
              {{ y.year }}
            </button>
            <span class="text-sm font-semibold tabular-nums">{{ y.factures }} facture(s)</span>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <div class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-cream-200">
              <div class="h-full rounded-full bg-forest" :style="{ width: `${y.pct}%` }" />
            </div>
            <span class="shrink-0 text-xs tabular-nums text-night-500">{{ y.withPiece }}/{{ y.depenses }} · {{ y.pct }} %</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-if="y.missing"
              type="button"
              class="admin-segment bg-ochre-100 px-3 text-sm text-ochre-700 hover:bg-ochre-200"
              @click="focusYear(y.year)"
            >
              {{ y.missing }} à compléter
            </button>
            <span v-else-if="y.journalLoaded" class="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-700">Complet</span>
            <a
              v-if="y.folderUrl"
              :href="y.folderUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="admin-segment inline-flex items-center gap-1 border border-night-100 px-3 text-sm text-night hover:border-bleu/50"
            >
              <PhFolderOpen :size="14" aria-hidden="true" />
              {{ y.exact ? 'Dossier Factures' : '3_Trésorerie' }}
            </a>
          </div>
        </article>
      </div>
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="w-full min-w-[640px] text-sm">
          <thead>
            <tr class="border-b border-night-100 text-left text-xs font-bold uppercase tracking-wide text-night-500">
              <th scope="col" class="py-2 pr-3">Année</th>
              <th scope="col" class="py-2 pr-3 text-right">Factures</th>
              <th scope="col" class="py-2 pr-3">Dépenses avec facture</th>
              <th scope="col" class="py-2 pr-3 text-right">À compléter</th>
              <th scope="col" class="py-2 text-right"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="y in yearRows" :key="y.year" class="border-b border-night-50 last:border-0">
              <th scope="row" class="py-3 pr-3 text-left font-serif text-lg font-bold">
                <button type="button" class="hover:text-forest-700 hover:underline" @click="focusYear(y.year)">{{ y.year }}</button>
              </th>
              <td class="py-3 pr-3 text-right font-semibold tabular-nums">{{ y.factures }}</td>
              <td class="py-3 pr-3">
                <div class="flex items-center gap-3">
                  <div class="h-2 w-40 overflow-hidden rounded-full bg-cream-200">
                    <div class="h-full rounded-full bg-forest" :style="{ width: `${y.pct}%` }" />
                  </div>
                  <span class="text-xs tabular-nums text-night-500">{{ y.withPiece }} / {{ y.depenses }} · {{ y.pct }} %</span>
                </div>
              </td>
              <td class="py-3 pr-3 text-right">
                <button
                  v-if="y.missing"
                  type="button"
                  class="admin-segment bg-ochre-100 px-3 text-sm text-ochre-700 hover:bg-ochre-200"
                  @click="focusYear(y.year)"
                >
                  {{ y.missing }} à compléter
                </button>
                <span v-else-if="y.journalLoaded" class="text-xs font-semibold text-forest-700">Complet</span>
                <span v-else class="text-xs text-night-400">—</span>
              </td>
              <td class="py-3 text-right">
                <a
                  v-if="y.folderUrl"
                  :href="y.folderUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="admin-segment inline-flex items-center gap-1 border border-night-100 px-3 text-sm text-night hover:border-bleu/50"
                >
                  <PhFolderOpen :size="14" aria-hidden="true" />
                  {{ y.exact ? 'Dossier Factures' : '3_Trésorerie' }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-night-400">
        « Dépenses avec facture » compte les dépenses banque et terrain, hors frais bancaires, virements et retraits
        (le relevé bancaire suffit pour ceux-là). Cliquez sur une année pour la sélectionner.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { PhFolderOpen } from '@phosphor-icons/vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { tresorerieGoogle } from '@/config/tresorerie-google.js'
import driveHealth from '@/data/drive-health.json'
import AdminFileCapture from './AdminFileCapture.vue'
import AdminDirectExpenseForm from './AdminDirectExpenseForm.vue'
import AdminLoadingPanel from './AdminLoadingPanel.vue'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import { useUploadQueue } from '@/store/uploadQueue.js'

/** Catégories pour lesquelles le relevé bancaire suffit (pas de facture attendue) */
const NO_INVOICE = ['frais bancaires', 'transferts et retraits terrain', 'virements internes', 'prêts / avances', 'remboursements de prêts / avances']

const EXERCICE_FIRST = 2017
const ALL_YEARS = 'all'
const mode = ref('attach')
const data = ref(null)
const corrections = ref([])
const year = ref(String(new Date().getFullYear()))
const search = ref('')
const selected = ref(null)
const file = ref(null)
const message = ref(null)
const uploads = useUploadQueue()
/** Écritures dont la facture est en cours d'envoi (masquées pour éviter un double envoi). */
const sendingRefs = computed(() => uploads.activeMeta('attach', 'ref'))
const loadingYear = ref(false)
const yearProg = bindLoadingProgress(loadingYear, { estimateMs: 24_000, label: 'Journal…' })
const loadingAll = ref(false)
const loadProgress = ref({ done: 0, total: 0 })
const syncPercent = computed(() => {
  const t = loadProgress.value.total
  if (!t) return 0
  return Math.round((loadProgress.value.done / t) * 100)
})
const journalStatus = ref({})
const journalReasons = ref({})

function defaultYearList() {
  const end = new Date().getFullYear()
  return Array.from({ length: end - EXERCICE_FIRST + 1 }, (_, i) => String(end - i))
}

/** Toujours 2017 → année courante (indépendant de l'API exercices). */
const yearOptions = computed(() => defaultYearList())
const isAllYears = computed(() => year.value === ALL_YEARS)
const loadingCandidates = computed(() => (isAllYears.value ? loadingAll.value : loadingYear.value))
const unloadedYears = computed(() => yearOptions.value.filter((y) => !journalLoaded(y)))

function ensureYearSlot(y) {
  if (!data.value) data.value = { years: {} }
  if (!data.value.years[y]) {
    data.value = { ...data.value, years: { ...data.value.years, [y]: [] } }
  }
}

function journalLoaded(y) {
  return journalStatus.value[String(y)] === 'live'
}

function journalReason(y) {
  return journalReasons.value[String(y)] || ''
}

onMounted(async () => {
  data.value = { years: {} }
  yearOptions.value.forEach(ensureYearSlot)
  try { corrections.value = await tresorerieApi.getCorrections() } catch { corrections.value = [] }

  await loadLive(year.value)
  pickBestYear()
  reloadAllInBackground()
})

/** Choisit la première année utilisable (manques > 0, sinon journal live). */
function pickBestYear() {
  if (year.value === ALL_YEARS) return
  const missing = yearOptions.value.find((y) => countMissing(y) > 0)
  if (missing) {
    year.value = missing
    return
  }
  const loaded = yearOptions.value.find((y) => journalLoaded(y))
  if (loaded && !journalLoaded(year.value)) year.value = loaded
}

async function reloadAllInBackground() {
  loadingAll.value = true
  const pending = yearOptions.value.filter((y) => !journalLoaded(y))
  loadProgress.value = { done: yearOptions.value.length - pending.length, total: yearOptions.value.length }
  const concurrency = 3
  let idx = 0
  async function worker() {
    while (idx < pending.length) {
      const y = pending[idx++]
      await loadLive(y, { quiet: true })
      loadProgress.value = { done: loadProgress.value.done + 1, total: loadProgress.value.total }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, () => worker())
  )
  loadingAll.value = false
  pickBestYear()
}

const live = ref(null)
async function loadLive(y, opts = {}) {
  y = String(y)
  if (!opts.quiet) loadingYear.value = true
  let ok = false
  try {
    const res = await tresorerieApi.getJournalAnnee(y)
    if (res?.live && data.value) {
      data.value = { ...data.value, years: { ...data.value.years, [y]: res.rows } }
      journalStatus.value = { ...journalStatus.value, [y]: 'live' }
      journalReasons.value = { ...journalReasons.value, [y]: '' }
      if (y === year.value) live.value = res
      ok = true
    } else {
      journalStatus.value = { ...journalStatus.value, [y]: 'failed' }
      journalReasons.value = {
        ...journalReasons.value,
        [y]: res?.reason || 'Google Sheet Journal_AKUU_' + y + ' introuvable sur le Drive.'
      }
      if (y === year.value) live.value = null
    }
  } catch (e) {
    journalStatus.value = { ...journalStatus.value, [y]: 'failed' }
    journalReasons.value = { ...journalReasons.value, [y]: e?.message || String(e) }
    ok = false
  } finally {
    if (!opts.quiet) loadingYear.value = false
  }
  return ok
}

watch(year, (y) => {
  selected.value = null
  search.value = ''
  message.value = null
  if (y === ALL_YEARS) {
    live.value = null
    if (unloadedYears.value.length) reloadAllInBackground()
    return
  }
  if (!journalLoaded(y) || !data.value?.years?.[y]?.length) loadLive(y)
  else live.value = { year: Number(y), live: true, rows: data.value.years[y] }
})

const attached = computed(() => new Set(
  corrections.value.filter((c) => c.type === 'attach' && c.status !== 'cancelled').map((c) => c.reference)
))
const deleted = computed(() => new Set(
  corrections.value.filter((c) => c.type === 'delete' && c.status !== 'cancelled').map((c) => c.reference)
))

function hasPiece(r) {
  return Boolean(r?.url || r?.piece || attached.value.has(r?.ref))
}

function countMissing(y) {
  if (!journalLoaded(y)) return 0
  const rows = data.value?.years?.[y] ?? []
  return rows
    .filter((r) => needsInvoice(r) && !deleted.value.has(r.ref))
    .filter((r) => !hasPiece(r)).length
}

const yearBanner = computed(() => {
  const y = year.value
  if (loadingYear.value || y === ALL_YEARS) return null
  if (journalStatus.value[y] === 'failed') {
    return {
      text: journalReasons.value[y] || `Journal ${y} inaccessible.`,
      cls: 'border border-ochre-200 bg-ochre-50 text-ochre-800',
      retry: true
    }
  }
  return null
})

function needsInvoice(r) {
  return r.type === 'depense' && !NO_INVOICE.includes((r.category || '').toLowerCase())
}

function candidateRowsForYear(y) {
  const rows = data.value?.years?.[y] ?? []
  return rows
    .map((r, i) => ({ ...r, key: `${y}-${r.ref}-${i}`, year: y }))
    .filter((r) => needsInvoice(r) && !hasPiece(r) && !deleted.value.has(r.ref) && !sendingRefs.value.has(r.ref))
}

const candidates = computed(() => {
  const q = search.value.toLowerCase()
  const years = isAllYears.value ? yearOptions.value : [year.value]
  const out = years.flatMap((y) => candidateRowsForYear(y))
  const filtered = q
    ? out.filter((r) => `${r.label} ${r.vendor} ${r.ref} ${amount(r)} ${r.year}`.toLowerCase().includes(q))
    : out
  return filtered.sort((a, b) => String(b.date).localeCompare(String(a.date)))
})
const shown = computed(() => candidates.value.slice(0, 80))

const previewName = computed(() => {
  const r = selected.value
  if (!r) return ''
  const isPen = r.pen != null
  const v = isPen ? r.pen : r.eur
  const amt = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(2).replace('.', '_')
  return `${r.date}_${r.ref}_${amt}${isPen ? 'PEN' : 'EUR'}_${slug(r.vendor || r.label)}.pdf`
})

/**
 * Envoi non bloquant : la file d'upload prend le relais, la sélection est
 * libérée tout de suite (on peut rattacher la facture suivante ou changer
 * d'onglet). Le journal de l'année est relu en arrière-plan après succès.
 */
function send() {
  const r = selected.value
  const f = file.value
  if (!r || !f) return
  const expenseYear = Number(r.year ?? year.value)
  const row = {
    reference: r.ref, year: expenseYear, expense_date: r.date,
    amount_eur: r.eur, amount_pen: r.pen, currency: r.pen != null ? 'PEN' : 'EUR',
    vendor_name: r.vendor, label: r.label
  }
  uploads.enqueue({
    kind: 'attach',
    label: `Facture · ${r.label}`,
    meta: { ref: r.ref },
    run: ({ onProgress, signal }) => tresorerieApi.attachInvoice(row, f, { onProgress, signal }),
    describe: (c) => ({
      text: c.status === 'applied'
        ? `Facture rangée : ${c.file_name}.`
        : `Facture enregistrée (${c.file_name}) — en attente d'application au journal.`,
      link: c.drive_file_url,
      copyText: c.file_name
    }),
    onSuccess: async (c) => {
      corrections.value = [...corrections.value, c]
      await loadLive(String(expenseYear), { quiet: true })
    }
  })
  message.value = {
    ok: true,
    text: 'Envoi lancé — progression en bas de l\'écran. Vous pouvez déjà choisir la dépense suivante.'
  }
  selected.value = null
  file.value = null
}

const rootUrl = tresorerieGoogle.driveFolders.find((f) => f.id === 'root')?.url ?? null

const yearRows = computed(() =>
  yearOptions.value.map((y) => {
    const rows = (data.value?.years?.[y] ?? []).filter((r) => needsInvoice(r) && !deleted.value.has(r.ref))
    const loaded = journalLoaded(y)
    const withPiece = rows.filter((r) => hasPiece(r)).length
    const dh = (driveHealth?.years ?? []).find((d) => String(d.year) === y)
    const depenses = loaded ? rows.length : (dh?.depenses ?? 0)
    const wp = loaded ? withPiece : (dh?.with_piece ?? 0)
    return {
      year: y,
      factures: dh?.factures_index ?? 0,
      depenses,
      withPiece: wp,
      missing: loaded ? rows.length - withPiece : Math.max(0, depenses - wp),
      pct: depenses ? Math.round((wp / depenses) * 100) : (loaded ? 100 : 0),
      journalLoaded: loaded,
      folderUrl: dh?.factures_drive_url || rootUrl,
      exact: Boolean(dh?.factures_folder_exact)
    }
  })
)

async function focusYear(y) {
  mode.value = 'attach'
  year.value = String(y)
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function slug(t) {
  const s = String(t || 'piece').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return (s || 'piece').slice(0, 48).replace(/-+$/g, '')
}
function amount(r) {
  return r.pen != null
    ? `${r.pen.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} S/`
    : `${(r.eur ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
}
function shortDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function formatDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function segClass(on) {
  return ['admin-segment', on ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500 hover:text-night']
}
</script>
