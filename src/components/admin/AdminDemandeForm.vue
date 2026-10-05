<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-serif font-bold text-night">Demande de dépense (devis)</h2>
      <p class="mt-1 text-sm text-night-400">
        Toujours obligatoire avant achat · le trésorier valide et vous envoie une référence <code class="text-xs">AKUU-DEM-…</code>
      </p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Projet *</span>
          <select v-model="form.project" required class="admin-input">
            <option value="" disabled>Choisir…</option>
            <option v-for="p in TRESORERIE_PROJECTS" :key="p.code" :value="p.code">{{ p.label }}</option>
          </select>
        </label>

        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Nature de dépense *</span>
          <select v-model="form.category" required class="admin-input">
            <option value="" disabled>Choisir…</option>
            <option v-for="c in TRESORERIE_CATEGORIES" :key="c.code" :value="c.code">{{ c.label }}</option>
          </select>
        </label>
      </div>

      <AdminCurrencyAmountField
        v-model="form.amount"
        :currency="form.currency"
        label="Montant estimé *"
        :rate="exchangeRate?.rate"
        :rate-source="exchangeRate?.source"
        @update:currency="form.currency = $event"
      >
        <p v-if="validationHint" class="text-xs font-medium text-forest">{{ validationHint }}</p>
      </AdminCurrencyAmountField>

      <div
        v-if="needsDevisPhotos"
        class="rounded-xl border border-bleu/30 bg-bleu/5 px-4 py-3 text-sm text-bleu-700"
      >
        Dépense &gt; {{ DEVIS_PEN_THRESHOLD }} S/. · joignez <strong>au moins {{ MIN_DEVIS_ATTACHMENTS }} photos ou PDF</strong> des devis fournisseurs (validation trésorier avant achat).
      </div>
      <div
        v-else-if="amountPenEquivalent != null && amountPenEquivalent > 0"
        class="rounded-xl border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm text-forest-800"
      >
        Montant ≤ {{ DEVIS_PEN_THRESHOLD }} S/. · pas de photo de devis à joindre. Le montant et la description ci-dessous font office de devis pour le trésorier.
      </div>

      <div v-if="needsDevisPhotos">
        <AdminFileCapture
          v-model="devisFiles"
          :label="`Photos / PDF des devis fournisseurs * (min. ${MIN_DEVIS_ATTACHMENTS})`"
          multiple
          hint="Photo ou scan des devis papier · PDF, JPG, PNG ou HEIC"
          gallery-label="PDF ou galerie"
        />
        <p v-if="devisError" class="mt-2 text-xs text-terracotta">{{ devisError }}</p>
      </div>

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Type de flux prévu *</span>
        <select v-model="form.payment_type" required class="admin-input">
          <option value="" disabled>Choisir…</option>
          <option v-for="t in PAYMENT_TYPES" :key="t.code" :value="t.code">{{ t.label }}</option>
        </select>
      </label>

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Date besoin / achat prévu *</span>
        <input
          v-model="form.needed_by_date"
          type="date"
          required
          :min="todayMin"
          class="admin-input"
        />
        <p v-if="dateError" class="text-xs text-terracotta">{{ dateError }}</p>
      </label>

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Description détaillée *</span>
        <textarea v-model="form.description" required rows="3" class="admin-input" placeholder="Quoi, pourquoi, où…" />
      </label>

      <label class="block space-y-1.5">
        <span class="text-sm font-medium text-night">Justification (lien activité projet) *</span>
        <textarea v-model="form.justification" required rows="2" class="admin-input" placeholder="Lien avec le projet choisi" />
      </label>

      <button type="submit" class="btn-primary w-full sm:w-auto">
        Envoyer au trésorier
      </button>
      <p v-if="submitHint" class="text-sm text-forest-700">{{ submitHint }}</p>
    </form>

    <section class="border-t border-night-100 pt-6">
      <h3 class="text-sm font-semibold text-night uppercase tracking-wide">Mes demandes</h3>
      <p v-if="!store.myDemandes.length" class="mt-2 text-sm text-night-400">
        Aucune demande enregistrée pour {{ auth.user?.email }}.
        Les demandes n’apparaissent pas dans Compta tant qu’elles ne sont pas approuvées puis facturées.
      </p>
      <ul v-else class="mt-3 space-y-3">
        <li
          v-for="d in store.myDemandes"
          :key="d.id"
          class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-mono text-sm font-semibold text-forest">{{ d.reference }}</p>
              <p class="text-sm text-night-500">{{ labelFor(d.project, TRESORERIE_PROJECTS) }} · {{ formatAmountWithConversion(d) }}</p>
            </div>
            <AdminStatusBadge :status="d.status" />
          </div>
          <div v-if="d.status === 'awaiting_approval' && d.devis_status === 'rejected'" class="mt-3 space-y-3 rounded-xl border border-terracotta/30 bg-terracotta/5 p-3">
            <p class="text-sm font-semibold text-terracotta-700">Devis à corriger</p>
            <p v-if="d.devis_reject_reason" class="text-sm text-night-600">
              Message du trésorier : <em>{{ d.devis_reject_reason }}</em>
            </p>
            <AdminFileCapture
              v-model="devisResubmitFiles[d.reference]"
              :label="`Nouveaux devis (min. ${MIN_DEVIS_ATTACHMENTS})`"
              multiple
              hint="Joignez au moins 2 nouveaux devis PDF ou photos"
              gallery-label="PDF ou galerie"
            />
            <button
              type="button"
              class="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="devisBusy(d.reference) || !(devisResubmitFiles[d.reference]?.length >= MIN_DEVIS_ATTACHMENTS)"
              @click="resubmitDevis(d.reference)"
            >
              {{ devisBusy(d.reference) ? 'Envoi…' : 'Renvoyer les devis' }}
            </button>
          </div>
          <p v-else-if="d.reject_reason" class="mt-2 text-sm text-terracotta">Refus : {{ d.reject_reason }}</p>
          <button
            v-if="d.status === 'rejected'"
            type="button"
            class="mt-3 text-sm font-medium text-forest underline"
            @click="prefillResubmit(d)"
          >
            Resoumettre une nouvelle version
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import {
  TRESORERIE_PROJECTS,
  TRESORERIE_CATEGORIES,
  PAYMENT_TYPES,
  DEVIS_PEN_THRESHOLD,
  MIN_DEVIS_ATTACHMENTS,
  requiresDevisPhotoAttachments,
  getValidationLevel,
  VALIDATION_LEVEL_LABELS,
  labelFor
} from '@/data/tresorerie-config.js'
import { eurToPen, normalizeCurrency, CURRENCY_PEN, formatAmountWithConversion } from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import { useAuthStore } from '@/store/auth.js'
import { useUploadQueue } from '@/store/uploadQueue.js'
import { markDataStale, onPendingRefresh } from '@/composables/usePendingRefresh.js'
import AdminStatusBadge from './AdminStatusBadge.vue'
import AdminFileCapture from './AdminFileCapture.vue'
import AdminCurrencyAmountField from './AdminCurrencyAmountField.vue'

const emit = defineEmits(['submitted'])

const store = useTresorerieStore()
const auth = useAuthStore()
const uploads = useUploadQueue()
const resubmitParentId = ref(null)
const submitHint = ref('')
const dateError = ref('')
const devisError = ref('')
const devisFiles = ref([])
const devisResubmitFiles = ref({})

function todayIsoLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayMin = computed(() => todayIsoLocal())

const form = reactive({
  project: '',
  category: '',
  currency: CURRENCY_PEN,
  amount: null,
  payment_type: '',
  needed_by_date: '',
  description: '',
  justification: ''
})

const exchangeRate = computed(() => store.exchangeRate)
const amountPenEquivalent = computed(() => {
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (normalizeCurrency(form.currency) === 'EUR') {
    return eurToPen(amount, exchangeRate.value?.rate ?? 0.24)
  }
  return amount
})
const needsDevisPhotos = computed(() => requiresDevisPhotoAttachments(amountPenEquivalent.value))
const validationHint = computed(() => {
  const level = getValidationLevel(amountPenEquivalent.value)
  return level ? VALIDATION_LEVEL_LABELS[level] : null
})

function clearDevis() {
  devisFiles.value = []
  devisError.value = ''
}

function resetForm() {
  form.project = ''
  form.category = ''
  form.currency = CURRENCY_PEN
  form.amount = null
  form.payment_type = ''
  form.needed_by_date = ''
  form.description = ''
  form.justification = ''
  resubmitParentId.value = null
  clearDevis()
}

function validateNeededByDate() {
  dateError.value = ''
  if (!form.needed_by_date) return true
  if (form.needed_by_date < todayMin.value) {
    dateError.value = 'La date d\'achat prévue ne peut pas être antérieure à aujourd\'hui.'
    return false
  }
  return true
}

function validateDevis() {
  devisError.value = ''
  if (!needsDevisPhotos.value) return true
  if (devisFiles.value.length < MIN_DEVIS_ATTACHMENTS) {
    devisError.value = `Joignez au moins ${MIN_DEVIS_ATTACHMENTS} photos/PDF de devis (fourni : ${devisFiles.value.length}).`
    return false
  }
  return true
}

function devisBusy(reference) {
  return uploads.isBusy('demande', (m) => m.ref === reference)
}

function onSubmit() {
  if (!validateNeededByDate() || !validateDevis()) return
  const payload = {
    project: form.project,
    category: form.category,
    currency: form.currency,
    amount: form.amount,
    payment_type: form.payment_type,
    needed_by_date: form.needed_by_date,
    description: form.description,
    justification: form.justification
  }
  const files = needsDevisPhotos.value ? [...devisFiles.value] : []
  const parentId = resubmitParentId.value
  const label = parentId
    ? `Nouvelle version · ${form.description.slice(0, 40)}`
    : `Demande · ${form.description.slice(0, 40)}`
  uploads.enqueue({
    kind: 'demande',
    label,
    hasFile: files.length > 0,
    fileCount: files.length || 1,
    meta: { type: parentId ? 'resubmit' : 'create' },
    run: ({ onProgress, signal }) =>
      parentId
        ? store.resubmitDemande(parentId, payload, files, { background: true, onProgress, signal })
        : store.submitDemande(payload, files, { background: true, onProgress, signal }),
    describe: (created) => ({
      text: parentId
        ? `Nouvelle version ${created.reference} envoyée.`
        : `Demande ${created.reference} envoyée au trésorier.`,
      copyText: created.reference
    }),
    onSuccess: () => {
      submitHint.value = ''
      markDataStale()
    },
    onError: () => {
      submitHint.value = ''
    }
  })
  submitHint.value = 'Envoi lancé — suivez la progression en bas de l\'écran.'
  resetForm()
  emit('submitted')
}

function prefillResubmit(d) {
  resubmitParentId.value = d.id
  form.project = d.project
  form.category = d.category
  form.currency = normalizeCurrency(d.currency)
  form.amount = form.currency === 'EUR' ? d.amount_eur_estimated : d.amount_pen_estimated
  form.payment_type = d.payment_type
  form.needed_by_date = d.needed_by_date >= todayMin.value ? d.needed_by_date : ''
  dateError.value = ''
  form.description = d.description
  form.justification = d.justification
  clearDevis()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resubmitDevis(reference) {
  const files = devisResubmitFiles.value[reference] || []
  uploads.enqueue({
    kind: 'demande',
    label: `Devis · ${reference}`,
    hasFile: true,
    fileCount: files.length,
    meta: { ref: reference },
    run: ({ onProgress, signal }) =>
      store.resubmitDemandeDevis(reference, files, { background: true, onProgress, signal }),
    describe: () => ({
      text: `Nouveaux devis envoyés pour ${reference}.`,
      copyText: reference
    }),
    onSuccess: () => {
      devisResubmitFiles.value[reference] = []
      markDataStale()
    }
  })
}

onMounted(async () => {
  await store.loadExchangeRate()
  await store.refreshMine()
})

// Rechargement manuel depuis la barre de tâches (voir usePendingRefresh).
onPendingRefresh(() => store.refreshMine(true))
</script>
