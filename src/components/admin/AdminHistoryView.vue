<template>
  <div class="space-y-8">
    <header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-serif font-bold text-night">Historique</h2>
          <p class="mt-1 text-sm text-night-400">Demandes, factures et journal d'audit</p>
        </div>
        <button
          type="button"
          class="min-h-[36px] rounded-full border border-night-200 px-4 text-xs font-semibold text-night hover:border-forest/40"
          :disabled="store.historyLoading"
          @click="store.loadHistory(true)"
        >
          {{ store.historyLoading ? `Chargement… ${store.historyProgress} %` : 'Actualiser' }}
        </button>
      </div>
    </header>

    <AdminLoadingPanel
      v-if="store.historyLoading"
      variant="inline"
      title="Chargement de l'historique"
      detail="Demandes, factures et audit depuis le tableur Google"
      :progress="store.historyProgress"
      :step-label="store.historyProgressLabel"
      hint=""
    />

    <p v-else-if="store.historyError" class="rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-700">
      {{ store.historyError }}
    </p>

    <section>
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-night">Audit</h3>
      <div class="max-h-64 overflow-y-auto rounded-2xl border border-night-100 bg-night-50/50 p-3">
        <ul class="space-y-2">
          <li v-for="a in store.history.audit" :key="a.id" class="text-xs text-night-600">
            <span class="font-mono text-night-400">{{ formatTs(a.timestamp) }}</span>
            · {{ a.actor_email }} · <strong>{{ a.action }}</strong> · {{ a.entity_type }}/{{ formatEntityId(a.entity_id) }}
          </li>
          <li v-if="!store.history.audit?.length" class="text-sm text-night-400">Aucun événement.</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-night">
        Toutes les demandes ({{ store.history.demandes?.length ?? 0 }})
      </h3>
      <AdminDataTable
        :columns="demandeColumns"
        :rows="store.history.demandes ?? []"
        row-key-field="reference"
        empty-message="Aucune demande."
      >
        <template #cell-reference="{ row }">
          <span class="font-mono text-xs font-semibold text-forest">{{ row.reference }}</span>
        </template>
        <template #cell-status="{ row }">
          <AdminStatusBadge :status="row.status" />
        </template>
        <template #cell-payment_type="{ row }">
          <AdminPaymentBadge :payment-type="row.payment_type" />
        </template>
        <template #cell-amount_pen_estimated="{ row }">
          <span class="font-semibold tabular-nums">{{ formatAmountWithConversion(row) }}</span>
        </template>
        <template #cell-project="{ row }">
          {{ labelFor(row.project, TRESORERIE_PROJECTS) }}
        </template>
        <template #cell-submitter_email="{ row }">
          <span class="text-xs">{{ row.submitter_email }}</span>
        </template>
      </AdminDataTable>
    </section>

    <section>
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-night">
        Toutes les factures ({{ store.history.factures?.length ?? 0 }})
      </h3>
      <AdminDataTable
        :columns="factureColumns"
        :rows="store.history.factures ?? []"
        row-key-field="reference"
        empty-message="Aucune facture."
      >
        <template #cell-reference="{ row }">
          <span class="font-mono text-xs font-semibold text-forest">{{ row.reference }}</span>
        </template>
        <template #cell-demand_reference="{ row }">
          <span class="font-mono text-xs text-night-400">{{ row.demand_reference }}</span>
        </template>
        <template #cell-status="{ row }">
          <AdminStatusBadge :status="row.status" type="facture" />
        </template>
        <template #cell-payment_type="{ row }">
          <AdminPaymentBadge :payment-type="row.payment_type" />
        </template>
        <template #cell-payment_method="{ row }">
          <span class="text-xs">{{ labelFor(row.payment_method, PAYMENT_METHODS) }}</span>
        </template>
        <template #cell-reimbursement="{ row }">
          <AdminReimbursementBadge :facture="row" />
        </template>
        <template #cell-amount_pen="{ row }">
          <div class="text-right">
            <p class="font-semibold tabular-nums">{{ formatAmountWithConversion(row) }}</p>
          </div>
        </template>
        <template #cell-submitter_email="{ row }">
          <span class="text-xs">{{ row.submitter_email }}</span>
        </template>
      </AdminDataTable>
    </section>
  </div>
</template>

<script setup>
import {
  TRESORERIE_PROJECTS,
  PAYMENT_METHODS,
  labelFor
} from '@/data/tresorerie-config.js'
import { formatAmountWithConversion } from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import AdminDataTable from './AdminDataTable.vue'
import AdminLoadingPanel from './AdminLoadingPanel.vue'
import AdminStatusBadge from './AdminStatusBadge.vue'
import AdminPaymentBadge from './AdminPaymentBadge.vue'
import AdminReimbursementBadge from './AdminReimbursementBadge.vue'

const store = useTresorerieStore()

const demandeColumns = [
  { key: 'reference', label: 'Réf.' },
  { key: 'status', label: 'Statut' },
  { key: 'payment_type', label: 'Paiement' },
  { key: 'amount_pen_estimated', label: 'Montant', align: 'right' },
  { key: 'project', label: 'Projet' },
  { key: 'submitter_email', label: 'Auteur' }
]

const factureColumns = [
  { key: 'reference', label: 'Réf.' },
  { key: 'demand_reference', label: 'Demande' },
  { key: 'status', label: 'Statut' },
  { key: 'expense_date', label: 'Date' },
  { key: 'vendor_name', label: 'Fournisseur' },
  { key: 'payment_type', label: 'Paiement' },
  { key: 'payment_method', label: 'Moyen' },
  { key: 'paid_by', label: 'Payé par' },
  { key: 'location', label: 'Lieu' },
  { key: 'reimbursement', label: 'Remboursement' },
  { key: 'amount_pen', label: 'Montant', align: 'right' },
  { key: 'submitter_email', label: 'Auteur' }
]

function formatEntityId(id) {
  const s = String(id || '').trim()
  return s.length > 8 ? `${s.slice(0, 8)}…` : s || '—'
}

function formatTs(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>
