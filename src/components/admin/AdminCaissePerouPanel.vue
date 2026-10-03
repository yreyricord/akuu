<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Caisse espèces au Pérou</h3>
        <p class="mt-1 max-w-xl text-xs leading-relaxed text-night-500">
          Solde caisse = ouverture + retraits WU/DAB − dépenses payées en <strong>espèces trésorerie</strong> ou Yape/Plin.
          Les avances bénévoles et paiements carte ne passent pas par la caisse.
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm text-night-600">
        <span class="font-medium">Année</span>
        <select v-model="year" class="admin-input w-auto min-w-[5rem] py-1.5" @change="load">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>
    </div>

    <AdminLoadingPanel
      v-if="loading"
      variant="inline"
      title="Caisse Pérou"
      :detail="`Année ${year}`"
      :progress="loadProg.progress"
      :step-label="loadProg.stepLabel"
      hint=""
    />
    <p v-else-if="error" class="rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-700">
      {{ error }}
    </p>
    <p v-else-if="data && !data.live" class="text-sm text-night-400">Journal {{ year }} indisponible.</p>

    <template v-else-if="data?.live">
      <div class="rounded-2xl border px-5 py-5 shadow-sm" :class="soldeClass">
        <p class="text-xs font-bold uppercase tracking-wide text-night-500">Reste en caisse espèces (estimé)</p>
        <p class="mt-2 font-serif text-3xl font-bold tabular-nums text-night">
          {{ formatPen(data.caisse_pen_solde) }}
        </p>
        <p v-if="data.caisse_eur_equiv != null" class="mt-1 text-sm text-night-500">
          ≈ {{ formatEur(data.caisse_eur_equiv) }} au taux du {{ data.taux_date || 'jour' }}
          <span v-if="data.pen_per_eur">(1 € ≈ {{ data.pen_per_eur }} S/.)</span>
        </p>
        <p class="mt-3 text-xs text-night-400">
          <span v-if="data.caisse_pen_ouverture">Ouverture {{ formatPen(data.caisse_pen_ouverture) }} + </span>
          retraits {{ formatPen(data.caisse_pen_entrees) }}
          − espèces caisse {{ formatPen(data.caisse_pen_sorties) }}
          <span v-if="data.depenses_hors_caisse_pen"> · {{ formatPen(data.depenses_hors_caisse_pen) }} avances/carte (onglet Avances — à venir)</span>
        </p>
      </div>

      <div v-if="data.totals_by_mode" class="flex flex-wrap gap-2 text-xs">
        <span
          v-for="chip in modeChips"
          :key="chip.id"
          class="cursor-pointer rounded-full px-3 py-1 font-semibold transition"
          :class="filterMode === chip.id
            ? (chip.muted ? 'bg-night-600 text-white' : 'bg-forest text-white')
            : (chip.muted ? 'bg-cream-100 text-night-500 hover:bg-cream-200' : 'bg-cream-200 text-night-600 hover:bg-cream-300')"
          @click="filterMode = chip.id"
        >
          {{ chip.label }} · {{ formatPen(chip.total) }}
        </span>
      </div>

      <p v-if="data.alerte" class="rounded-xl border border-ochre-300 bg-ochre-50 px-4 py-3 text-sm text-ochre-900">
        {{ data.alerte }}
      </p>

      <!-- Lots de retrait (FIFO) -->
      <div v-if="data.lots?.length" class="rounded-xl border border-night-100 bg-white">
        <h4 class="border-b border-night-100 px-4 py-3 text-sm font-semibold text-forest">
          Lots de retrait — suivi bénévole
          <span class="ml-2 font-normal text-night-400">(FIFO · standard {{ data.montant_pen_standard ?? 700 }} S/.)</span>
        </h4>
        <p class="border-b border-night-50 px-4 py-2 text-xs text-night-500">
          Chaque retrait = un lot. Les dépenses espèces consomment les lots du plus ancien au plus récent.
          Saisir <code class="rounded bg-cream-200 px-1">amount_pen</code> ou <code class="rounded bg-cream-200 px-1">pen_recu=700</code> dans les notes du journal banque.
        </p>
        <div class="max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-cream-100 text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th class="px-3 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">Lot / retrait</th>
                <th class="px-3 py-2 text-right">Reçu S/.</th>
                <th class="px-3 py-2 text-right">Dépensé</th>
                <th class="px-3 py-2 text-right">Reste</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lot in data.lots"
                :key="lot.reference || lot.id"
                class="border-t border-night-50"
                :class="lot.reste_pen < 0 ? 'bg-terracotta/5' : ''"
              >
                <td class="whitespace-nowrap px-3 py-2 tabular-nums text-xs">{{ lot.date || '—' }}</td>
                <td class="max-w-[14rem] px-3 py-2">
                  <p class="truncate font-mono text-xs" :title="lot.reference">{{ lot.reference || lot.id }}</p>
                  <p class="truncate text-xs text-night-500" :title="lot.label">{{ lot.label }}</p>
                  <p v-if="lot.pen_estimated" class="text-[10px] text-ochre-700">PEN estimé (EUR converti)</p>
                </td>
                <td class="whitespace-nowrap px-3 py-2 text-right tabular-nums text-forest">+ {{ formatPen(lot.pen_recu) }}</td>
                <td class="whitespace-nowrap px-3 py-2 text-right tabular-nums">− {{ formatPen(lot.depenses_pen) }}</td>
                <td class="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums" :class="lot.reste_pen >= 0 ? 'text-night' : 'text-terracotta-700'">
                  {{ formatPen(lot.reste_pen) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Retraits au Pérou -->
      <div class="rounded-xl border border-night-100 bg-white">
        <h4 class="border-b border-night-100 px-4 py-3 text-sm font-semibold text-forest">
          Retraits au Pérou (entrées caisse)
          <span class="ml-2 font-normal text-night-400">({{ data.retraits_count }}) · {{ formatEur(data.retraits_eur) }}</span>
        </h4>
        <p class="border-b border-night-50 px-4 py-2 text-xs text-night-500">
          Corrigez les soles réellement reçus au distributeur (souvent 700 S/.). L’EUR vient du relevé bancaire et ne change pas.
        </p>
        <p v-if="!data.retraits?.length" class="px-4 py-6 text-sm text-night-400">Aucun retrait DAB / Western Union cette année.</p>
        <div v-else class="max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-cream-100 text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th class="px-3 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">Libellé</th>
                <th class="px-3 py-2 text-right">EUR</th>
                <th class="px-3 py-2 text-right">S/. reçus</th>
                <th class="px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in data.retraits"
                :key="row.reference"
                class="border-t border-night-50 bg-forest/[0.03]"
                :class="row.pen_estimated ? 'ring-1 ring-inset ring-ochre-200' : ''"
              >
                <td class="whitespace-nowrap px-3 py-2 tabular-nums text-xs">{{ row.date }}</td>
                <td class="max-w-[12rem] px-3 py-2">
                  <p class="truncate font-mono text-[10px] text-night-400" :title="(row.references || [row.reference]).join(', ')">
                    {{ row.references?.length > 1 ? `${row.references.length} écritures` : row.reference }}
                  </p>
                  <p class="truncate text-xs" :title="row.label">{{ row.label || '—' }}</p>
                </td>
                <td class="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-forest">+ {{ formatEur(row.amount_eur) }}</td>
                <td class="whitespace-nowrap px-3 py-2 text-right">
                  <input
                    type="number"
                    min="1"
                    step="50"
                    class="admin-input w-[5.5rem] py-1 text-right text-xs tabular-nums"
                    :value="penDrafts[row.reference] ?? row.amount_pen"
                    :disabled="savingRef === row.reference"
                    @input="penDrafts[row.reference] = $event.target.value"
                  />
                  <p v-if="row.pen_estimated" class="mt-0.5 text-[10px] text-ochre-700">estimé (EUR→PEN)</p>
                  <p v-else class="mt-0.5 text-[10px] text-forest-700">{{ row.pen_source || 'saisi' }}</p>
                </td>
                <td class="whitespace-nowrap px-2 py-2 text-right">
                  <button
                    v-if="penChanged(row)"
                    type="button"
                    class="rounded-lg bg-forest px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    :disabled="savingRef === row.reference"
                    @click="saveRetraitPen(row)"
                  >
                    {{ savingRef === row.reference ? '…' : 'OK' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Toutes les dépenses terrain -->
      <div class="rounded-xl border border-night-100 bg-white">
        <h4 class="border-b border-night-100 px-4 py-3 text-sm font-semibold text-night">
          Dépenses terrain au Pérou
          <span class="ml-2 font-normal text-night-400">
            ({{ filteredDepenses.length }}/{{ data.depenses_terrain_count ?? 0 }})
          </span>
        </h4>
        <p class="border-b border-night-50 px-4 py-2 text-xs text-night-500">
          Seules les dépenses <strong>espèces / Yape</strong> alimentent le solde caisse. Les avances bénévoles et cartes sont listées à part — hors caisse.
        </p>
        <p v-if="!filteredDepenses.length" class="px-4 py-6 text-sm text-night-400">Aucune dépense pour ce filtre.</p>
        <div v-else class="max-h-[28rem] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-cream-100 text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th class="px-2 py-2 text-left">Date</th>
                <th class="px-2 py-2 text-left">Libellé</th>
                <th class="px-2 py-2 text-left">Projet</th>
                <th class="px-2 py-2 text-left">Mode</th>
                <th class="px-2 py-2 text-right">S/.</th>
                <th class="px-2 py-2 text-center">Pièce</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredDepenses"
                :key="row.reference"
                class="border-t border-night-50"
                :class="row.caisse_cash ? 'bg-terracotta/[0.04]' : ''"
              >
                <td class="whitespace-nowrap px-2 py-2 tabular-nums text-xs">{{ row.date }}</td>
                <td class="max-w-[12rem] truncate px-2 py-2" :title="row.label">{{ row.label || '—' }}</td>
                <td class="whitespace-nowrap px-2 py-2 text-xs text-night-500">{{ row.project || '—' }}</td>
                <td class="px-2 py-2">
                  <select
                    class="admin-input max-w-[9rem] py-1 text-xs"
                    :value="row.payment_method || ''"
                    :disabled="savingRef === row.reference"
                    @change="onModeChange(row, $event.target.value)"
                  >
                    <option value="">— Non classé —</option>
                    <option v-for="m in TERRAIN_MODES" :key="m.code" :value="m.code">{{ m.label }}</option>
                  </select>
                </td>
                <td class="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums">
                  − {{ formatPen(row.amount_pen) }}
                </td>
                <td class="px-2 py-2 text-center">
                  <a
                    v-if="row.drive_file_url"
                    :href="row.drive_file_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-semibold text-bleu hover:underline"
                    :title="row.piece_filename || row.reference"
                  >PDF</a>
                  <span v-else class="text-xs text-night-300">—</span>
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t border-night-100 bg-cream-50 text-xs font-semibold">
              <tr>
                <td colspan="4" class="px-2 py-2 text-right text-night-500">
                  Total filtré
                  <span v-if="filterMode === 'caisse'" class="font-normal text-forest-700"> · compté dans le solde</span>
                </td>
                <td class="px-2 py-2 text-right tabular-nums">− {{ formatPen(filteredTotal) }}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { formatEur, formatPen, PAYMENT_METHODS } from '@/data/tresorerie-config.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import AdminLoadingPanel from './AdminLoadingPanel.vue'

const props = defineProps({
  refreshKey: { type: Number, default: 0 }
})

const emit = defineEmits(['journal-updated'])

const TERRAIN_MODES = PAYMENT_METHODS.filter((m) =>
  ['especes', 'avance', 'cb', 'virement', 'yape_plin', 'autre'].includes(m.code)
)
const CAISSE_MODES = ['especes', 'yape_plin']
const year = ref(String(new Date().getFullYear()))
const filterMode = ref('caisse')
const savingRef = ref(null)
const penDrafts = ref({})
const loading = ref(false)
const loadProg = bindLoadingProgress(loading, { estimateMs: 18_000, label: 'Calcul caisse…' })
const error = ref(null)
const data = ref(null)

const yearOptions = computed(() => {
  const cur = new Date().getFullYear()
  return Array.from({ length: cur - 2016 }, (_, i) => String(cur - i))
})

const modeChips = computed(() => {
  const t = data.value?.totals_by_mode || {}
  return [
    { id: 'caisse', label: 'Caisse', total: data.value?.depenses_caisse_pen ?? ((t.especes ?? 0) + (t.yape_plin ?? 0)) },
    { id: 'especes', label: 'Espèces', total: t.especes ?? 0 },
    { id: 'yape_plin', label: 'Yape/Plin', total: t.yape_plin ?? 0 },
    { id: 'non_classe', label: 'Non classé', total: t.non_classe ?? 0 }
  ]
})

const filteredDepenses = computed(() => {
  const rows = data.value?.depenses_terrain ?? []
  if (filterMode.value === 'caisse') {
    return rows.filter((r) => CAISSE_MODES.includes(r.payment_method))
  }
  if (filterMode.value === 'non_classe') return rows.filter((r) => !r.payment_method)
  return rows.filter((r) => r.payment_method === filterMode.value)
})

function penChanged(row) {
  const draft = penDrafts.value[row.reference]
  if (draft === undefined || draft === '') return false
  return Math.abs(Number(draft) - Number(row.amount_pen)) > 0.009
}

async function saveRetraitPen(row) {
  const key = row.reference
  const pen = Number(penDrafts.value[key])
  if (!pen || pen <= 0) {
    error.value = 'Montant PEN invalide'
    return
  }
  savingRef.value = key
  error.value = null
  try {
    const refs = row.references?.length ? row.references : [row.reference]
    for (const ref of refs) {
      await tresorerieApi.updateJournalLine({
        reference: ref,
        year: Number(year.value),
        amount_pen: pen
      })
    }
    delete penDrafts.value[key]
    await load()
    emit('journal-updated')
  } catch (e) {
    error.value = e.message || 'Enregistrement PEN impossible — redéployez JournalAnnee.gs + Corrections.gs'
  } finally {
    savingRef.value = null
  }
}

const filteredTotal = computed(() =>
  filteredDepenses.value.reduce((s, r) => s + (Number(r.amount_pen) || 0), 0)
)

const soldeClass = computed(() => {
  const s = data.value?.caisse_pen_solde
  if (s == null) return 'border-night-100 bg-white'
  if (s < 0) return 'border-terracotta/40 bg-terracotta/5'
  return 'border-leaf/40 bg-leaf/5'
})

async function onModeChange(row, paymentMethod) {
  if (!paymentMethod || paymentMethod === row.payment_method) return
  savingRef.value = row.reference
  try {
    await tresorerieApi.updateJournalLine({
      reference: row.reference,
      year: Number(year.value),
      payment_method: paymentMethod
    })
    await load()
    emit('journal-updated')
  } catch (e) {
    error.value = e.message || 'Mise à jour impossible'
  } finally {
    savingRef.value = null
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await tresorerieApi.getCaissePerou(Number(year.value))
  } catch (e) {
    error.value = e.message?.includes('Route inconnue')
      ? 'Recopiez CaissePerou.gs et App.gs dans Apps Script, puis Déployer → Nouvelle version.'
      : (e.message || 'Impossible de charger la caisse')
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.refreshKey, () => { if (props.refreshKey) load() })
</script>
