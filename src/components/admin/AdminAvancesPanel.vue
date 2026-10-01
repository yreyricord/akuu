<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Avances à rembourser</h3>
        <p class="mt-1 text-xs text-night-400">
          Engagements trésorier, journal (prêts/avances) et factures avance bénévole non remboursées.
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
      title="Avances à rembourser"
      :detail="`Année ${year}`"
      :progress="loadProg.progress"
      hint=""
    />
    <p v-else-if="error" class="rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-700">
      {{ error }}
    </p>

    <div
      v-else
      class="rounded-2xl border px-4 py-4 sm:px-5"
      :class="pendingCount ? 'border-ochre/40 bg-ochre/5' : 'border-leaf/30 bg-leaf/5'"
    >
      <p class="text-xs font-bold uppercase tracking-wide text-night-400">Total à rembourser</p>
      <p class="mt-1 text-lg font-serif font-bold text-night">
        <template v-if="pendingCount">
          {{ pendingCount }} avance(s) · {{ formatEur(totalEur) }}
        </template>
        <template v-else>Aucune avance en attente pour {{ year }}</template>
      </p>
    </div>

    <AdminDataTable
      v-if="!loading && items.length"
      :columns="columns"
      :rows="items"
      row-key-field="id"
      empty-message="Aucune avance suivie."
    >
      <template #cell-beneficiary="{ row }">
        <div>
          <p class="font-medium text-night">{{ row.beneficiary }}</p>
          <p v-if="row.label" class="text-xs text-night-400">{{ row.label }}</p>
        </div>
      </template>
      <template #cell-amount_eur="{ row }">
        <span class="font-semibold tabular-nums">{{ formatEur(row.amount_eur) }}</span>
      </template>
      <template #cell-statut="{ row }">
        <span
          class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
          :class="row.statut === 'rembourse' ? 'bg-leaf/15 text-forest' : 'bg-ochre/15 text-ochre-800'"
        >
          {{ row.statut === 'rembourse' ? 'Remboursé' : 'À rembourser' }}
        </span>
      </template>
      <template #cell-source="{ row }">
        <span class="text-xs text-night-500">{{ sourceLabel(row.source) }}</span>
      </template>
      <template #cell-echeance="{ row }">
        <span class="text-sm">{{ row.echeance || '—' }}</span>
      </template>
    </AdminDataTable>

    <p v-if="notes.length" class="text-xs text-night-400">
      <span v-for="(n, i) in notes" :key="i" class="block">{{ n }}</span>
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { formatEur } from '@/data/tresorerie-config.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import AdminDataTable from './AdminDataTable.vue'
import AdminLoadingPanel from './AdminLoadingPanel.vue'

const year = ref(String(new Date().getFullYear()))
const loading = ref(false)
const loadProg = bindLoadingProgress(loading, { estimateMs: 15_000, label: 'Avances…' })
const error = ref(null)
const data = ref(null)

const yearOptions = computed(() => {
  const cur = new Date().getFullYear()
  return Array.from({ length: cur - 2016 }, (_, i) => String(cur - i))
})

const items = computed(() => data.value?.items ?? [])
const pendingCount = computed(() => data.value?.pending_count ?? 0)
const totalEur = computed(() => data.value?.total_a_rembourser_eur ?? 0)
const notes = computed(() => items.value.filter((i) => i.notes).map((i) => i.notes))

const columns = [
  { key: 'beneficiary', label: 'Bénéficiaire' },
  { key: 'project', label: 'Projet' },
  { key: 'amount_eur', label: 'Montant', align: 'right' },
  { key: 'echeance', label: 'Échéance' },
  { key: 'statut', label: 'Statut' },
  { key: 'source', label: 'Source' }
]

function sourceLabel(s) {
  const map = {
    engagement_tresorier: 'Engagement trésorier',
    reference: 'Référence',
    journal: 'Journal',
    facture: 'Facture'
  }
  return map[s] || s || '—'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await tresorerieApi.getAvances(Number(year.value))
  } catch (e) {
    error.value = e.message?.includes('Route inconnue')
      ? 'Cette fonction n’est pas encore active sur le serveur. Recopiez Avances.gs et App.gs dans Apps Script, puis Déployer → Nouvelle version.'
      : (e.message || 'Impossible de charger les avances')
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
