<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-serif font-bold text-night">Facture / justificatif</h2>
      <p class="mt-1 text-sm text-night-400">
        Référencez une demande approuvée, puis déposez une ou plusieurs factures (magasins, tickets…) en une seule fois.
        Le total ne doit pas dépasser le plafond du devis (+{{ AMOUNT_TOLERANCE_PERCENT }}&nbsp;%).
      </p>
    </header>

    <form class="space-y-6" enctype="multipart/form-data" @submit.prevent="onSubmit">
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
          Libellé : {{ selectedDemande.description }}
          <span v-if="selectedDemande.facture_count">
            · Déjà facturé : {{ formatPen(selectedDemande.invoiced_pen ?? 0) }} ({{ selectedDemande.facture_count }} facture(s))
          </span>
          <span v-if="selectedDemande.draft_count">
            · {{ selectedDemande.draft_count }} en brouillon (non envoyées au trésorier)
          </span>
        </p>
      </div>

      <div
        v-if="selectedDemande?.draft_count && !postSubmitChoice"
        class="rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-900"
      >
        <p>
          {{ selectedDemande.draft_count }} facture(s) en brouillon pour ce devis.
          Ajoutez-en ou clôturez pour envoyer au trésorier.
        </p>
        <button
          type="button"
          class="mt-3 rounded-full border border-forest bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-leaf/10"
          :disabled="store.loading"
          @click="closeInvoicing"
        >
          Clore le devis — envoyer au trésorier
        </button>
      </div>

      <div
        v-if="postSubmitChoice"
        class="rounded-xl border border-bleu/30 bg-bleu/10 px-4 py-4 text-sm text-night"
      >
        <p class="font-medium text-forest">Factures enregistrées en brouillon</p>
        <p class="mt-1 text-xs text-night-500">
          Le trésorier ne les verra qu’après clôture du devis. Vous pouvez encore en ajouter tant que le total reste dans le plafond.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="continueAdding">
            Ajouter une facture supplémentaire
          </button>
          <button
            type="button"
            class="rounded-full border border-forest bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-leaf/10"
            :disabled="store.loading || !canCloseInvoicing"
            @click="closeInvoicing"
          >
            {{ store.loading ? 'Envoi…' : 'Clore le devis — envoyer au trésorier' }}
          </button>
        </div>
      </div>

      <template v-if="selectedDemande && !postSubmitChoice">
        <fieldset class="space-y-4 rounded-xl border border-night/10 bg-sand/30 p-4">
          <legend class="px-1 text-sm font-medium text-night">Informations communes</legend>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-night">Moyen de paiement *</span>
            <select v-model="form.payment_method" required class="admin-input">
              <option value="" disabled>Choisir…</option>
              <option v-for="m in PAYMENT_METHODS" :key="m.code" :value="m.code">{{ m.label }}</option>
            </select>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-1.5">
              <span class="text-sm font-medium text-night">Payé par *</span>
              <input v-model="form.paid_by" required class="admin-input" placeholder="Votre nom ou « AKUU »" />
            </label>
            <label class="block space-y-1.5">
              <span class="text-sm font-medium text-night">Lieu *</span>
              <input v-model="form.location" required class="admin-input" placeholder="Nauta, Iquitos…" />
            </label>
          </div>

          <details class="text-sm text-night-400">
            <summary class="cursor-pointer select-none text-night-600">Projet, nature et type de flux (figés par la demande)</summary>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <p><span class="text-night-500">Projet :</span> {{ labelFor(form.project, TRESORERIE_PROJECTS) }}</p>
              <p><span class="text-night-500">Nature :</span> {{ labelFor(form.category, TRESORERIE_CATEGORIES) }}</p>
              <p class="sm:col-span-2"><span class="text-night-500">Type de flux :</span> {{ labelFor(form.payment_type, PAYMENT_TYPES) }}</p>
            </div>
          </details>
        </fieldset>

        <section class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-medium text-night">Factures à déposer</h3>
              <p class="text-xs text-night-400">Une ligne par ticket ou magasin · date et montant propres à chaque facture</p>
            </div>
            <button
              type="button"
              class="text-sm font-medium text-leaf hover:text-forest"
              @click="addLine"
            >
              + Ajouter une facture
            </button>
          </div>

          <div
            class="rounded-xl border px-4 py-3 text-sm"
            :class="batchSummaryClass"
          >
            <p class="font-medium">
              Total saisi : {{ formatNativeAmount(batchTotalNative, form.currency) }}
              · Reste disponible : {{ formatNativeAmount(amountBounds.remainingNative, form.currency) }}
            </p>
            <p class="mt-1 text-xs opacity-90">
              Plafond cumulé demande +{{ AMOUNT_TOLERANCE_PERCENT }}&nbsp;% :
              {{ formatPen(selectedDemande.max_pen ?? amountBounds.maxTotalPen) }}
              ({{ formatNativeAmount(amountBounds.baseNative, form.currency) }} estimés)
            </p>
            <p v-if="batchError" class="mt-2 text-xs font-medium">{{ batchError }}</p>
          </div>

          <div
            v-for="(line, index) in lines"
            :key="line.id"
            class="space-y-4 rounded-xl border border-night/10 bg-white p-4 shadow-sm"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-night">Facture {{ index + 1 }}</span>
              <button
                v-if="lines.length > 1"
                type="button"
                class="text-xs text-terracotta hover:underline"
                @click="removeLine(line.id)"
              >
                Retirer
              </button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block space-y-1.5 sm:col-span-2">
                <span class="text-sm font-medium text-night">Titre / magasin *</span>
                <input
                  v-model="line.vendor_name"
                  required
                  class="admin-input"
                  placeholder="Ex. Ferretería El Sol, Taxi Nauta…"
                />
              </label>
              <label class="block space-y-1.5">
                <span class="text-sm font-medium text-night">Date de la dépense *</span>
                <input v-model="line.expense_date" type="date" required class="admin-input" />
              </label>
              <AdminCurrencyAmountField
                v-model="line.amount"
                :currency="form.currency"
                :label="currencyAmountLabel(form.currency)"
                currency-locked
                :rate="store.exchangeRate?.rate"
                :rate-source="store.exchangeRate?.source"
                :input-class="{ 'border-terracotta ring-terracotta/20': lineHasAmountError(line) }"
              />
              <label class="block space-y-1.5">
                <span class="text-sm font-medium text-night">N° facture / reçu</span>
                <input v-model="line.receipt_number" class="admin-input" />
              </label>
            </div>

            <AdminFileCapture
              :key="`${line.id}-${line.fileReset}`"
              label="Photo ou PDF facture *"
              gallery-label="PDF ou galerie"
              hint="PDF, JPG, PNG ou HEIC"
              @update:single="(file) => onLineFile(line.id, file)"
            />
            <p v-if="line.fileError" class="text-xs text-terracotta">{{ line.fileError }}</p>
          </div>
        </section>
      </template>

      <button
        v-if="!postSubmitChoice"
        type="submit"
        class="btn-primary w-full sm:w-auto"
        :disabled="store.loading || !selectedDemande || !canSubmit"
      >
        {{
          store.loading
            ? 'Enregistrement…'
            : lines.length > 1
              ? `Enregistrer ${lines.length} factures (brouillon)`
              : 'Enregistrer la facture (brouillon)'
        }}
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
  normalizeAmountPair,
  CURRENCY_PEN,
  CURRENCY_EUR
} from '@/data/currency.js'
import { penToEur } from '@/api/tresorerie/exchangeRate.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import AdminFileCapture from './AdminFileCapture.vue'
import AdminCurrencyAmountField from './AdminCurrencyAmountField.vue'

const emit = defineEmits(['closed'])

const store = useTresorerieStore()
const postSubmitChoice = ref(false)
const savedDemandRef = ref('')
let lineSeq = 0

const form = reactive({
  demand_reference: '',
  currency: CURRENCY_PEN,
  project: '',
  category: '',
  label: '',
  payment_type: '',
  payment_method: '',
  paid_by: '',
  location: ''
})

const lines = ref([createLine()])

function createLine() {
  lineSeq += 1
  return {
    id: lineSeq,
    expense_date: '',
    vendor_name: '',
    amount: null,
    receipt_number: '',
    file: null,
    fileError: '',
    fileReset: 0
  }
}

const selectedDemande = computed(() =>
  store.approvedDemandes.find((d) => d.reference === form.demand_reference) ?? null
)

const currencyLabel = computed(() =>
  normalizeCurrency(form.currency) === CURRENCY_EUR ? '€' : 'S/.'
)

const amountBounds = computed(() => {
  if (!selectedDemande.value) {
    return {
      baseNative: 0,
      maxTotalPen: 0,
      remainingNative: 0,
      remainingPen: 0
    }
  }
  const d = selectedDemande.value
  const baseNative = nativeEstimated(d)
  const maxTotalPen = d.max_pen ?? amountMaxWithTolerance(baseNative)
  const remainingPen = d.remaining_pen ?? maxTotalPen
  const rate = store.exchangeRate?.rate || 0.24
  const remainingNative =
    normalizeCurrency(form.currency) === CURRENCY_EUR
      ? penToEur(remainingPen, rate)
      : remainingPen
  return { baseNative, maxTotalPen, remainingNative, remainingPen }
})

function lineAmountPen(amount) {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return 0
  return normalizeAmountPair({
    currency: form.currency,
    amount: Number(amount),
    rate: store.exchangeRate?.rate
  }).amount_pen
}

function lineAmountNative(amount) {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return 0
  return Number(amount)
}

const batchTotalPen = computed(() =>
  lines.value.reduce((sum, line) => sum + lineAmountPen(line.amount), 0)
)

const batchTotalNative = computed(() =>
  lines.value.reduce((sum, line) => sum + lineAmountNative(line.amount), 0)
)

const batchError = computed(() => {
  if (!selectedDemande.value) return ''
  const remaining = amountBounds.value.remainingPen
  if (batchTotalPen.value <= 0) return ''
  if (batchTotalPen.value > remaining + 0.001) {
    return `Total supérieur au reste à facturer (${formatPen(remaining)} max pour ce lot).`
  }
  return ''
})

const batchSummaryClass = computed(() => {
  if (batchError.value) return 'border-terracotta/40 bg-terracotta/10 text-terracotta-900'
  if (batchTotalPen.value > 0) return 'border-leaf/30 bg-leaf/10 text-forest'
  return 'border-night/10 bg-sand/20 text-night-600'
})

const canSubmit = computed(() => {
  if (!selectedDemande.value || batchError.value) return false
  return lines.value.every(
    (line) =>
      line.expense_date &&
      line.vendor_name.trim() &&
      line.amount != null &&
      Number(line.amount) > 0 &&
      line.file
  )
})

const canCloseInvoicing = computed(() => {
  const d = selectedDemande.value
  return Boolean(d && (d.draft_count > 0 || postSubmitChoice.value))
})

function lineHasAmountError(line) {
  if (!line.amount || Number(line.amount) <= 0) return false
  return batchError.value !== ''
}

function onDemandeSelected() {
  postSubmitChoice.value = false
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
  resetLines()
}

function continueAdding() {
  postSubmitChoice.value = false
  resetLines()
}

async function closeInvoicing() {
  const ref = form.demand_reference || savedDemandRef.value
  if (!ref) return
  await store.closeDemandeInvoicing(ref)
  postSubmitChoice.value = false
  resetFormFields(true)
  emit('closed')
}

function resetLines() {
  lines.value = [createLine()]
}

function addLine() {
  lines.value.push(createLine())
}

function removeLine(id) {
  if (lines.value.length <= 1) return
  lines.value = lines.value.filter((line) => line.id !== id)
}

function onLineFile(id, file) {
  const line = lines.value.find((l) => l.id === id)
  if (!line) return
  line.file = file ?? null
  line.fileError = ''
}

function resetFormFields(clearReference = true) {
  if (clearReference) form.demand_reference = ''
  form.currency = CURRENCY_PEN
  form.project = ''
  form.category = ''
  form.label = ''
  form.payment_type = ''
  form.payment_method = ''
  form.paid_by = ''
  form.location = ''
  resetLines()
}

function validateLines() {
  let ok = true
  for (const line of lines.value) {
    line.fileError = ''
    if (!line.file) {
      line.fileError = 'Joignez une photo ou un PDF.'
      ok = false
    }
  }
  return ok
}

async function onSubmit() {
  if (!validateLines() || !canSubmit.value) return

  const shared = {
    demand_reference: form.demand_reference,
    currency: form.currency,
    project: form.project,
    category: form.category,
    label: form.label,
    payment_type: form.payment_type,
    payment_method: form.payment_method,
    paid_by: form.paid_by,
    location: form.location
  }

  const items = lines.value.map((line) => ({
    expense_date: line.expense_date,
    amount: line.amount,
    vendor_name: line.vendor_name.trim(),
    receipt_number: line.receipt_number.trim(),
    file: line.file
  }))

  const refBefore = form.demand_reference
  await store.submitFacturesBatch(shared, items)
  await store.loadApprovedDemandes()

  savedDemandRef.value = refBefore
  form.demand_reference = refBefore
  form.payment_method = shared.payment_method
  form.paid_by = shared.paid_by
  form.location = shared.location
  postSubmitChoice.value = true
  resetLines()
}

onMounted(async () => {
  await store.loadExchangeRate()
  await store.loadApprovedDemandes()
})
</script>
