<template>
  <section class="rounded-2xl border border-forest/25 bg-forest/5 p-4 shadow-sm">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>
        <span class="text-sm font-bold text-forest-800">Ajouter une écriture</span>
        <span class="mt-0.5 block text-xs text-night-500">Dépense terrain (soles) ou ligne banque (euros) · exercice ouvert uniquement</span>
      </span>
      <span class="text-forest-700">{{ open ? '−' : '+' }}</span>
    </button>

    <form v-if="open" class="mt-4 space-y-4 border-t border-forest/15 pt-4" @submit.prevent="onSubmit">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Origine">
        <button
          v-for="s in SOURCES"
          :key="s.id"
          type="button"
          class="admin-segment px-3 py-1.5 text-sm transition"
          :class="form.source === s.id ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500'"
          :aria-pressed="form.source === s.id"
          @click="form.source = s.id"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wide text-night-500">Date *</span>
          <input v-model="form.expense_date" type="date" required class="admin-input w-full py-2 text-sm" />
        </label>
        <label class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wide text-night-500">Projet *</span>
          <select v-model="form.project" required class="admin-input w-full py-2 text-sm">
            <option v-for="p in projectsList" :key="p.code" :value="p.code">{{ p.label }}</option>
          </select>
        </label>
      </div>

      <label class="block space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Libellé *</span>
        <input v-model="form.label" required class="admin-input w-full py-2 text-sm" placeholder="Ex. Entrée Natutama · Frais bancaire" />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wide text-night-500">Fournisseur / bénéficiaire</span>
          <input v-model="form.vendor_name" class="admin-input w-full py-2 text-sm" />
        </label>
        <label v-if="form.source === 'terrain'" class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wide text-night-500">Mode de paiement *</span>
          <select v-model="form.payment_method" required class="admin-input w-full py-2 text-sm">
            <option v-for="m in TERRAIN_PAYMENTS" :key="m.code" :value="m.code">{{ m.label }}</option>
          </select>
        </label>
        <label v-else class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wide text-night-500">Type *</span>
          <select v-model="form.entry_type" required class="admin-input w-full py-2 text-sm">
            <option value="depense">Dépense</option>
            <option value="recette">Recette</option>
          </select>
        </label>
      </div>

      <label v-if="form.source === 'terrain'" class="block space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Montant (S/.) *</span>
        <input
          v-model.number="form.amount_pen"
          type="number"
          min="0.01"
          step="0.01"
          required
          class="admin-input w-full max-w-xs py-2 text-sm tabular-nums"
        />
      </label>
      <label v-else class="block space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Montant (€) *</span>
        <input
          v-model.number="form.amount_eur"
          type="number"
          min="0.01"
          step="0.01"
          required
          class="admin-input w-full max-w-xs py-2 text-sm tabular-nums"
        />
      </label>

      <label class="block space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Notes (optionnel)</span>
        <input v-model="form.notes" class="admin-input w-full py-2 text-sm" placeholder="Contexte, réf. pièce papier…" />
      </label>

      <AdminFileCapture
        label="Justificatif (optionnel)"
        gallery-label="PDF ou photo"
        hint="PDF, JPG, PNG ou HEIC"
        @update:single="receiptFile = $event"
      />

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          class="min-h-[44px] rounded-full bg-forest px-5 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="!canSubmit || saving"
        >
          {{ saving ? 'Enregistrement…' : 'Ajouter au journal' }}
        </button>
        <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { PAYMENT_METHODS, TRESORERIE_PROJECTS } from '@/data/tresorerie-config.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import AdminFileCapture from './AdminFileCapture.vue'

const props = defineProps({
  year: { type: String, required: true },
  canEdit: { type: Boolean, default: false },
  projectsList: { type: Array, default: () => [...TRESORERIE_PROJECTS] }
})

const emit = defineEmits(['created'])

const SOURCES = [
  { id: 'terrain', label: 'Terrain (Detail_PM · soles)' },
  { id: 'banque', label: 'Banque (Journal · euros)' }
]
const TERRAIN_PAYMENTS = PAYMENT_METHODS.filter((m) =>
  ['especes', 'avance', 'cb', 'virement', 'yape_plin'].includes(m.code)
)

const open = ref(false)
const saving = ref(false)
const error = ref('')
const receiptFile = ref(null)

const today = new Date().toISOString().slice(0, 10)
const form = ref({
  source: 'terrain',
  expense_date: today,
  project: 'maison',
  label: '',
  vendor_name: '',
  payment_method: 'especes',
  entry_type: 'depense',
  amount_pen: null,
  amount_eur: null,
  notes: ''
})

const canSubmit = computed(() => props.canEdit && Number(props.year) >= 2017)

watch(() => props.year, (y) => {
  if (form.value.expense_date && !form.value.expense_date.startsWith(y)) {
    form.value.expense_date = `${y}-01-01`
  }
})

async function onSubmit() {
  if (!canSubmit.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      year: Number(props.year),
      source: form.value.source,
      expense_date: form.value.expense_date,
      project: form.value.project,
      label: form.value.label.trim(),
      vendor_name: form.value.vendor_name.trim(),
      notes: form.value.notes.trim()
    }
    if (form.value.source === 'terrain') {
      payload.amount_pen = form.value.amount_pen
      payload.payment_method = form.value.payment_method
    } else {
      payload.amount_eur = form.value.amount_eur
      payload.entry_type = form.value.entry_type
    }
    const res = await tresorerieApi.createJournalLine(payload, receiptFile.value)
    emit('created', res)
    form.value.label = ''
    form.value.vendor_name = ''
    form.value.notes = ''
    form.value.amount_pen = null
    form.value.amount_eur = null
    receiptFile.value = null
    open.value = false
  } catch (e) {
    error.value = e.message || 'Ajout impossible'
  } finally {
    saving.value = false
  }
}
</script>
