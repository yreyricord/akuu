<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-serif font-bold text-night">Frais de fonctionnement</h2>
      <p class="mt-1 text-sm text-night-400">
        Saisie directe trésorier · banque, site web, assurances… · comptabilisé immédiatement au journal (sans demande préalable).
      </p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="rounded-xl border border-bleu/25 bg-bleu/5 px-4 py-3 text-sm text-bleu-800">
        Projet : <strong>Frais de fonctionnement</strong> · réservé aux dépenses courantes de l'association (France ou Pérou).
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Date de la dépense *</span>
          <input v-model="form.expense_date" type="date" required class="admin-input" />
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Nature *</span>
          <select v-model="form.category" required class="admin-input">
            <option value="" disabled>Choisir…</option>
            <option v-for="c in operatingCategories" :key="c.code" :value="c.code">{{ c.label }}</option>
          </select>
        </label>
      </div>

      <AdminCurrencyAmountField
        v-model="form.amount"
        :currency="form.currency"
        label="Montant *"
        :rate="store.exchangeRate?.rate"
        :rate-source="store.exchangeRate?.source"
        @update:currency="form.currency = $event"
      />

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Libellé *</span>
        <input
          v-model="form.label"
          required
          class="admin-input"
          placeholder="Ex. Frais bancaires trimestre · Hébergement site AKUU"
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Fournisseur / prestataire *</span>
          <input v-model="form.vendor_name" required class="admin-input" placeholder="Ex. BNP · Netlify · HelloAsso" />
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">N° facture / reçu</span>
          <input v-model="form.receipt_number" class="admin-input" />
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Type de flux *</span>
          <select v-model="form.payment_type" required class="admin-input">
            <option v-for="t in paymentTypes" :key="t.code" :value="t.code">{{ t.label }}</option>
          </select>
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Moyen de paiement *</span>
          <select v-model="form.payment_method" required class="admin-input">
            <option value="" disabled>Choisir…</option>
            <option v-for="m in PAYMENT_METHODS" :key="m.code" :value="m.code">{{ m.label }}</option>
          </select>
        </label>
      </div>

      <AdminFileCapture
        label="Justificatif (optionnel)"
        gallery-label="PDF ou galerie"
        hint="PDF, JPG, PNG ou HEIC — converti automatiquement en PDF"
        @update:single="onReceiptFile"
      />

      <button type="submit" class="btn-primary w-full sm:w-auto">
        Comptabiliser au journal
      </button>
      <p v-if="submitHint" class="text-sm text-forest-700">{{ submitHint }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import {
  TRESORERIE_CATEGORIES,
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  OPERATING_EXPENSE_CATEGORIES,
  DIRECT_EXPENSE_PAYMENT_TYPES
} from '@/data/tresorerie-config.js'
import { CURRENCY_EUR } from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import { useUploadQueue } from '@/store/uploadQueue.js'
import AdminCurrencyAmountField from './AdminCurrencyAmountField.vue'
import AdminFileCapture from './AdminFileCapture.vue'

const emit = defineEmits(['submitted'])

const store = useTresorerieStore()
const uploads = useUploadQueue()
const selectedFile = ref(null)
const submitHint = ref('')

const form = reactive({
  expense_date: '',
  category: '',
  currency: CURRENCY_EUR,
  amount: null,
  label: '',
  vendor_name: '',
  receipt_number: '',
  payment_type: 'carte_asso',
  payment_method: 'virement'
})

const operatingCategories = computed(() =>
  TRESORERIE_CATEGORIES.filter((c) => OPERATING_EXPENSE_CATEGORIES.includes(c.code))
)

const paymentTypes = computed(() =>
  PAYMENT_TYPES.filter((t) => DIRECT_EXPENSE_PAYMENT_TYPES.includes(t.code))
)

function onReceiptFile(file) {
  selectedFile.value = file ?? null
}

function resetForm() {
  form.expense_date = ''
  form.category = ''
  form.currency = CURRENCY_EUR
  form.amount = null
  form.label = ''
  form.vendor_name = ''
  form.receipt_number = ''
  form.payment_type = 'carte_asso'
  form.payment_method = 'virement'
  selectedFile.value = null
}

function onSubmit() {
  const payload = { ...form }
  const file = selectedFile.value
  const labelText = form.label.trim() || 'Frais de fonctionnement'
  uploads.enqueue({
    kind: 'expense',
    label: `Dépense · ${labelText}`,
    hasFile: Boolean(file),
    fileCount: file ? 1 : 0,
    run: ({ onProgress, signal }) =>
      store.submitDirectExpense(payload, file, { background: true, onProgress, signal }),
    describe: (created) => ({
      text: `${created.reference} comptabilisé · visible dans Compta.`,
      copyText: created.reference,
      link: created.drive_file_url || null
    }),
    onSuccess: () => {
      submitHint.value = ''
      emit('submitted')
    },
    onError: () => {
      submitHint.value = ''
    }
  })
  submitHint.value = 'Enregistrement lancé — progression en bas de l\'écran.'
  resetForm()
}

onMounted(() => store.loadExchangeRate())
</script>
