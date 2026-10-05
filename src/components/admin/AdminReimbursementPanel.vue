<template>
  <section class="space-y-4">
    <!-- KPI bandeau -->
    <div
      class="rounded-2xl border px-4 py-4 sm:px-5"
      :class="kpiBorderClass"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-night-400">Remboursements bénévoles</p>
          <p class="mt-1 text-lg font-serif font-bold text-night">
            <template v-if="pending.length">
              {{ pending.length }} à effectuer
              <span class="text-base font-sans font-semibold text-forest">
                · {{ formatPen(totalPen) }}
                <span class="text-night-400">(≈ {{ formatEur(totalEur) }})</span>
              </span>
            </template>
            <template v-else>Aucun remboursement en attente</template>
          </p>
        </div>
        <span
          v-if="overdueCount"
          class="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-bold text-terracotta-700"
        >
          {{ overdueCount }} &gt; {{ ADVANCE_REGULARIZATION_DAYS }} j
        </span>
      </div>
    </div>

    <!-- Tableau remboursements -->
    <div v-if="pending.length">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-night">
        À rembourser ({{ pending.length }})
      </h3>
      <AdminDataTable
        :columns="columns"
        :rows="pending"
        row-key-field="reference"
        empty-message="Aucun remboursement en attente."
        :row-class="rowHighlight"
      >
        <template #cell-reference="{ row }">
          <span class="font-mono text-xs font-semibold text-forest">{{ row.reference }}</span>
        </template>
        <template #cell-submitter_email="{ row }">
          <span class="text-sm">{{ row.submitter_email }}</span>
        </template>
        <template #cell-amount_pen="{ row }">
          <div class="text-right">
            <p class="font-semibold tabular-nums text-night">{{ formatAmountWithConversion(row) }}</p>
          </div>
        </template>
        <template #cell-validated_at="{ row }">
          <div>
            <p class="text-sm">{{ formatDate(row.validated_at) }}</p>
            <p
              v-if="isOverdue(row)"
              class="text-xs font-semibold text-terracotta"
            >
              +{{ daysSince(row.validated_at) }} j
            </p>
          </div>
        </template>
        <template #cell-label="{ row }">
          <span class="line-clamp-2 text-sm">{{ row.label }}</span>
        </template>
        <template #cell-actions="{ row }">
          <button
            type="button"
            class="whitespace-nowrap inline-flex min-h-[44px] items-center rounded-full bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-600 disabled:opacity-50"
            :disabled="validationPending(row.reference)"
            @click="markPaid(row.reference)"
          >
            {{ validationPending(row.reference) ? '…' : 'Remboursé ✓' }}
          </button>
        </template>
      </AdminDataTable>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  ADVANCE_REGULARIZATION_DAYS,
  formatPen,
  formatEur,
  isReimbursementOverdue,
  sumPen,
  sumEur
} from '@/data/tresorerie-config.js'
import { formatAmountWithConversion } from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import { TASK_ESTIMATE_MS, useUploadQueue } from '@/store/uploadQueue.js'
import { markDataStale } from '@/composables/usePendingRefresh.js'
import AdminDataTable from './AdminDataTable.vue'

const props = defineProps({
  pending: { type: Array, default: () => [] }
})

const store = useTresorerieStore()
const uploads = useUploadQueue()

function validationPending(ref) {
  return uploads.activeMeta('validation', 'ref').has(ref)
}

const columns = [
  { key: 'reference', label: 'Réf.' },
  { key: 'submitter_email', label: 'Bénévole' },
  { key: 'amount_pen', label: 'Montant', align: 'right' },
  { key: 'validated_at', label: 'Validée le' },
  { key: 'label', label: 'Libellé' },
  { key: 'actions', label: '', align: 'right' }
]

const totalPen = computed(() => sumPen(props.pending))
const totalEur = computed(() => sumEur(props.pending))
const overdueCount = computed(() => props.pending.filter(isReimbursementOverdue).length)

const kpiBorderClass = computed(() =>
  overdueCount.value
    ? 'border-terracotta/30 bg-terracotta/5'
    : props.pending.length
      ? 'border-ochre/30 bg-ochre/5'
      : 'border-leaf/30 bg-leaf/5'
)

function isOverdue(row) {
  return isReimbursementOverdue(row)
}

function rowHighlight(row) {
  return isReimbursementOverdue(row) ? 'ring-1 ring-inset ring-terracotta/25' : ''
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function daysSince(iso) {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function markPaid(reference) {
  uploads.enqueue({
    kind: 'validation',
    label: `Remboursement · ${reference}`,
    meta: { ref: reference },
    hasFile: false,
    abortable: false,
    estimateMs: TASK_ESTIMATE_MS.validation,
    run: () => store.markReimbursed(reference, { background: true }),
    describe: () => ({ text: `${reference} marquée remboursée.`, copyText: reference }),
    onSuccess: () => markDataStale()
  })
}
</script>
