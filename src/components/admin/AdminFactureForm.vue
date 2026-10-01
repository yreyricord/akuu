<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-serif font-bold text-night">Facture / justificatif</h2>
      <p class="mt-1 text-sm text-night-400">
        Après achat · référence demande approuvée · une ou plusieurs factures par demande (ex. achats dans plusieurs magasins)
      </p>
    </header>

    <form class="space-y-4" enctype="multipart/form-data" @submit.prevent="onSubmit">
      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Référence demande approuvée *</span>
        <select
          v-model="form.demand_reference"
          required
          class="admin-input"
          @change="onDemandeSelected"
        >
          <option value="" disabled>Sélectionner AKUU-DEM-…</option>
          <option v-for="d in store.approvedDemandes" :key="d.reference" :value="d.reference">
            {{ d.reference }} · {{ labelFor(d.project, TRESORERIE_PROJECTS) }} · reste {{ formatPen(d.remaining_pen ?? 0) }}
          </option>
        </select>
        <p v-if="!store.approvedDemandes.length" class="text-xs text-ochre-700">
          Aucune demande disponible : pas de demande approuvée, ou plafond déjà entièrement facturé.
        </p>
      </label>

      <div
        v-if="selectedDemande"
        class="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-forest"
      >
        <p class="font-medium">Demande approuvée · {{ formatAmountWithConversion(selectedDemande) }}</p>
        <p class="mt-1 text-xs text-forest/80">
          Projet, nature, libellé et type de flux sont figés par la demande.
          <span v-if="selectedDemande.facture_count">
            Déjà facturé : {{ formatPen(selectedDemande.invoiced_pen ?? 0) }} ({{ selectedDemande.facture_count }} facture(s)).
          </span>
          Cette facture : ≤ {{ formatNativeAmount(amountBounds.max, form.currency) }} restants
          (plafond total +{{ AMOUNT_TOLERANCE_PERCENT }} % = {{ formatPen(selectedDemande.max_pen ?? amountBounds.maxTotal) }}).
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Date de la dépense *</span>
          <input v-model="form.expense_date" type="date" required class="admin-input" />
        </label>
        <AdminCurrencyAmountField
          v-model="form.amount"
          :currency="form.currency"
          :label="currencyAmountLabel(form.currency)"
          @update:currency="form.currency = $event"
          :rate="store.exchangeRate?.rate"
          :rate-source="store.exchangeRate?.source"
          :max="selectedDemande ? amountBounds.max : undefined"
          :disabled="!selectedDemande"
          currency-locked
          :input-class="{ 'border-terracotta ring-terracotta/20': amountError }"
        >
          <p v-if="amountError" class="text-xs text-terracotta">{{ amountError }}</p>
        </AdminCurrencyAmountField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Projet *</span>
          <select v-model="form.project" required class="admin-input" disabled>
            <option value="" disabled>Choisir…</option>
            <option v-for="p in TRESORERIE_PROJECTS" :key="p.code" :value="p.code">{{ p.label }}</option>
          </select>
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Nature *</span>
          <select v-model="form.category" required class="admin-input" disabled>
            <option value="" disabled>Choisir…</option>
            <option v-for="c in TRESORERIE_CATEGORIES" :key="c.code" :value="c.code">{{ c.label }}</option>
          </select>
        </label>
      </div>

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Libellé descriptif *</span>
        <input
          v-model="form.label"
          required
          disabled
          class="admin-input opacity-80"
          placeholder="Ex. Taxi Nauta → Puerto Miguel"
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Type de flux *</span>
          <select v-model="form.payment_type" required class="admin-input" disabled>
            <option value="" disabled>Choisir…</option>
            <option v-for="t in PAYMENT_TYPES" :key="t.code" :value="t.code">{{ t.label }}</option>
          </select>
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Moyen de paiement *</span>
          <select v-model="form.payment_method" required class="admin-input" :disabled="!selectedDemande">
            <option value="" disabled>Choisir…</option>
            <option v-for="m in PAYMENT_METHODS" :key="m.code" :value="m.code">{{ m.label }}</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Payé par *</span>
          <input
            v-model="form.paid_by"
            required
            class="admin-input"
            placeholder="Votre nom ou « AKUU »"
            :disabled="!selectedDemande"
          />
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Lieu *</span>
          <input
            v-model="form.location"
            required
            class="admin-input"
            placeholder="Nauta, Iquitos…"
            :disabled="!selectedDemande"
          />
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Fournisseur / commerçant *</span>
          <input v-model="form.vendor_name" required class="admin-input" :disabled="!selectedDemande" />
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">N° facture / reçu</span>
          <input v-model="form.receipt_number" class="admin-input" :disabled="!selectedDemande" />
        </label>
      </div>

      <AdminFileCapture
        label="Photo ou PDF facture *"
        :disabled="!selectedDemande"
        gallery-label="PDF ou galerie"
        hint="PDF, JPG, PNG ou HEIC — converti en PDF et nommé automatiquement (date, AKUU-FAC, montant, fournisseur)"
        @update:single="onReceiptFile"
      />

      <button
        type="submit"
        class="btn-primary w-full sm:w-auto"
        :disabled="store.loading || !selectedDemande"
      >
        {{ store.loading ? 'Envoi…' : 'Soumettre la facture' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import {
  TRESORERIE_PROJECTS,
  TRESORERIE_CATEGORIES,
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  AMOUNT_TOLERANCE_PERCENT,
  labelFor,
  formatPen
} from '@/data/tresorerie-config.js'
import {
  currencyAmountLabel,
  formatAmountWithConversion,
  formatNativeAmount,
  amountMaxWithTolerance,
  nativeEstimated,
  normalizeCurrency,
  CURRENCY_PEN
} from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import AdminFileCapture from './AdminFileCapture.vue'
import AdminCurrencyAmountField from './AdminCurrencyAmountField.vue'

const emit = defineEmits(['submitted'])

const store = useTresorerieStore()
const selectedFile = ref(null)
const amountError = ref('')

const form = reactive({
  demand_reference: '',
  expense_date: '',
  currency: CURRENCY_PEN,
  amount: null,
  project: '',
  category: '',
  label: '',
  payment_type: '',
  payment_method: '',
  paid_by: '',
  location: '',
  vendor_name: '',
  receipt_number: ''
})

const selectedDemande = computed(() =>
  store.approvedDemandes.find((d) => d.reference === form.demand_reference) ?? null
)

const amountBounds = computed(() => {
  if (!selectedDemande.value) return { min: 0, max: 0, base: 0, maxTotal: 0 }
  const d = selectedDemande.value
  const base = nativeEstimated(d)
  const maxTotal = d.max_pen ?? amountMaxWithTolerance(base)
  const remaining = d.remaining_pen ?? maxTotal
  return { min: 0, max: remaining, base, maxTotal, remaining }
})

function onDemandeSelected() {
  amountError.value = ''
  const d = selectedDemande.value
  if (!d) {
    resetFormFields(false)
    return
  }
  form.project = d.project
  form.category = d.category
  form.payment_type = d.payment_type
  form.label = d.description
  form.currency = normalizeCurrency(d.currency)
  form.amount = nativeEstimated(d)
}

function validateAmount() {
  amountError.value = ''
  if (!selectedDemande.value || form.amount == null) return true
  const max = amountBounds.value.max
  if (Number(form.amount) > 0 && Number(form.amount) <= max + 0.001) return true
  amountError.value = `Montant supérieur au reste à facturer. Maximum pour cette facture : ${formatNativeAmount(max, form.currency)}.`
  return false
}

function onReceiptFile(file) {
  selectedFile.value = file ?? null
}

function resetFormFields(clearReference = true) {
  if (clearReference) form.demand_reference = ''
  form.expense_date = ''
  form.currency = CURRENCY_PEN
  form.amount = null
  form.project = ''
  form.category = ''
  form.label = ''
  form.payment_type = ''
  form.payment_method = ''
  form.paid_by = ''
  form.location = ''
  form.vendor_name = ''
  form.receipt_number = ''
  amountError.value = ''
  selectedFile.value = null
}

async function onSubmit() {
  if (!validateAmount()) return
  if (!selectedFile.value) {
    amountError.value = 'Joignez une photo ou un PDF de la facture.'
    return
  }
  await store.submitFacture({
    demand_reference: form.demand_reference,
    expense_date: form.expense_date,
    currency: form.currency,
    amount: form.amount,
    project: form.project,
    category: form.category,
    label: form.label,
    payment_type: form.payment_type,
    payment_method: form.payment_method,
    paid_by: form.paid_by,
    location: form.location,
    vendor_name: form.vendor_name,
    receipt_number: form.receipt_number
  }, selectedFile.value)
  resetFormFields(true)
  emit('submitted')
}

onMounted(async () => {
  await store.loadExchangeRate()
  await store.loadApprovedDemandes()
})
</script>
