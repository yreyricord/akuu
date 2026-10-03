<template>
  <section class="space-y-4">
    <header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-600 to-bleu px-5 py-5 text-white shadow-lg">
      <div class="pointer-events-none absolute -right-2 top-1/2 z-0 -translate-y-1/2 select-none" aria-hidden="true">
        <img
          src="/images/collibri-akuu.png"
          alt=""
          class="caisse-colibri h-24 w-auto opacity-90 drop-shadow-[0_8px_24px_rgba(166,198,57,0.35)] sm:h-28"
        />
      </div>
      <div class="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-leaf/20 blur-2xl" aria-hidden="true" />
      <div class="relative z-[1] flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="caisse-icon-shell flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
            <PhCashRegister class="caisse-icon text-leaf" :size="32" weight="duotone" aria-hidden="true" />
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-leaf/90">Trésorerie terrain</p>
            <h3 class="font-serif text-xl font-bold leading-tight sm:text-2xl">Caisse au Pérou</h3>
          </div>
        </div>
        <label class="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur-sm">
          <span class="font-medium text-white/90">Année</span>
          <select
            v-model="year"
            class="min-w-[5rem] cursor-pointer rounded-lg border-0 bg-white/95 py-1 pl-2 pr-7 text-sm font-semibold text-forest-700 focus:ring-2 focus:ring-leaf/50"
            @change="load"
          >
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>
      </div>
    </header>

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
      </div>

      <!-- Retraits -->
      <div class="overflow-hidden rounded-2xl border border-night-100 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-forest/15 bg-gradient-to-r from-forest/[0.06] to-transparent px-4 py-3">
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wide text-forest">Retraits</h4>
            <p class="mt-0.5 text-xs text-night-500">{{ data.retraits_count }} écriture(s) journal</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <div class="min-w-[8.5rem] rounded-xl border border-forest/25 bg-white px-3 py-2 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-wider text-forest/80">Entrées S/.</p>
              <p class="font-serif text-xl font-bold tabular-nums leading-tight text-forest">
                + {{ formatPen(retraitsEntreesPen) }}
              </p>
              <p
                v-if="Math.abs(retraitsTotals.penJournal - retraitsEntreesPen) > 0.5"
                class="mt-0.5 text-[10px] leading-snug text-night-400"
              >
                suivi bénévole · Σ journal {{ formatPen(retraitsTotals.penJournal) }}
              </p>
            </div>
            <div class="min-w-[7.5rem] rounded-xl border border-bleu/25 bg-white px-3 py-2 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-wider text-bleu/80">Débit €</p>
              <p class="font-serif text-xl font-bold tabular-nums leading-tight text-bleu">+ {{ formatEur(retraitsTotals.eur) }}</p>
            </div>
          </div>
        </div>
        <p v-if="!data.retraits?.length" class="px-4 py-6 text-sm text-night-400">Aucun retrait cette année.</p>
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

      <!-- Dépenses -->
      <div class="overflow-hidden rounded-2xl border border-night-100 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-terracotta/15 bg-gradient-to-r from-terracotta/[0.06] to-transparent px-4 py-3">
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wide text-terracotta-700">Dépenses</h4>
            <p class="mt-0.5 text-xs text-night-500">{{ depensesRows.length }} ligne(s)</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <div class="min-w-[7.5rem] rounded-xl border border-terracotta/25 bg-white px-3 py-2 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-wider text-terracotta-700/80">Sorties S/.</p>
              <p class="font-serif text-xl font-bold tabular-nums leading-tight text-terracotta-700">− {{ formatPen(depensesTotal) }}</p>
            </div>
            <div v-if="depensesTotalEur != null" class="min-w-[7.5rem] rounded-xl border border-night-200 bg-white px-3 py-2 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-wider text-night-500">Équiv. €</p>
              <p class="font-serif text-xl font-bold tabular-nums leading-tight text-night-700">≈ {{ formatEur(depensesTotalEur) }}</p>
            </div>
          </div>
        </div>
        <p v-if="!depensesRows.length" class="px-4 py-6 text-sm text-night-400">Aucune dépense cette année.</p>
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
                v-for="row in depensesRows"
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
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { PhCashRegister } from '@phosphor-icons/vue'
import { formatEur, formatPen, PAYMENT_METHODS } from '@/data/tresorerie-config.js'
import { penToEur } from '@/api/tresorerie/exchangeRate.js'
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
const year = ref(String(new Date().getFullYear()))
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

const depensesRows = computed(() => data.value?.depenses_terrain ?? [])

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

const penEurRate = computed(() => data.value?.pen_to_eur ?? null)

function penAsEur(pen) {
  const rate = penEurRate.value
  if (!rate || !pen) return null
  return penToEur(pen, rate)
}

function effectiveRetraitPen(row) {
  const draft = penDrafts.value[row.reference]
  if (draft !== undefined && draft !== '') return Number(draft) || 0
  return Number(row.amount_pen) || 0
}

const retraitsTotals = computed(() => {
  const rows = data.value?.retraits ?? []
  const refPen = data.value?.retraits_pen_reference
  const entreesPen = data.value?.caisse_pen_entrees
  let eur = 0
  let penJournal = 0
  for (const r of rows) {
    eur += Number(r.amount_eur) || 0
    penJournal += effectiveRetraitPen(r)
  }
  return {
    eur,
    penJournal,
    penEur: penAsEur(entreesPen ?? refPen ?? penJournal)
  }
})

/** Même montant que le solde caisse (API), pas la somme des lignes journal. */
const retraitsEntreesPen = computed(() => {
  const d = data.value
  if (!d) return 0
  return Number(d.caisse_pen_entrees ?? d.retraits_pen_reference ?? retraitsTotals.value.penJournal) || 0
})

const depensesTotal = computed(() =>
  depensesRows.value.reduce((s, r) => s + (Number(r.amount_pen) || 0), 0)
)

const depensesTotalEur = computed(() => penAsEur(depensesTotal.value))

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

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .caisse-icon {
    animation: caisseRegisterPulse 2.4s ease-in-out infinite;
    transform-origin: center bottom;
  }

  .caisse-icon-shell {
    animation: caisseShellGlow 3s ease-in-out infinite;
  }

  .caisse-colibri {
    animation: caisseColibriHover 9s linear infinite;
    transform-origin: center center;
    will-change: transform;
  }
}

@keyframes caisseRegisterPulse {
  0%, 100% { transform: translateY(0) scale(1); }
  15% { transform: translateY(-2px) scale(1.06); }
  30% { transform: translateY(0) scale(1); }
  45% { transform: translateY(-1px) scale(1.03); }
  60% { transform: translateY(0) scale(1); }
}

@keyframes caisseShellGlow {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 0 rgba(166, 198, 57, 0); }
  50% { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25), 0 0 20px rgba(166, 198, 57, 0.25); }
}

@keyframes caisseColibriHover {
  0% { transform: translate3d(0, 0, 0) rotate(2deg) scale(1); }
  25% { transform: translate3d(-8px, -10px, 0) rotate(-2deg) scale(1.04); }
  50% { transform: translate3d(0, -14px, 0) rotate(2deg) scale(1.06); }
  75% { transform: translate3d(8px, -8px, 0) rotate(-1deg) scale(1.03); }
  100% { transform: translate3d(0, 0, 0) rotate(2deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .caisse-icon,
  .caisse-icon-shell,
  .caisse-colibri {
    animation: none;
  }
}
</style>
