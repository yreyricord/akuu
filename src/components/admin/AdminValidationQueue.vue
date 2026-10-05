<template>
  <div class="space-y-8">
    <header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-serif font-bold text-night">Validation trésorier</h2>
          <p class="mt-1 text-sm text-night-400">Demandes et factures en attente · message au bénévole obligatoire en cas de refus</p>
        </div>
        <button
          type="button"
          class="min-h-[44px] rounded-full border border-night-200 px-4 text-sm font-semibold text-night hover:border-forest/40"
          :disabled="refreshing"
          @click="reload"
        >
          {{ refreshing ? 'Actualisation…' : 'Actualiser' }}
        </button>
      </div>
    </header>

    <p
      v-if="liveNotice"
      class="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-forest"
      role="status"
    >
      {{ liveNotice }}
    </p>

    <p v-if="store.validationError" class="rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-700">
      {{ store.validationError }} — vérifiez que l’Apps Script est déployé (route <code class="text-xs">validation/queue</code>).
    </p>

    <AdminReimbursementPanel :pending="store.pendingReimbursements" />

    <section>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">
        Demandes à traiter ({{ demandesActionable.length }})
      </h3>
      <p v-if="!demandesActionable.length && !demandesAwaitingVolunteer.length" class="mt-2 text-sm text-night-400">
        Aucune demande en attente.
      </p>
      <p v-else-if="!demandesActionable.length" class="mt-2 text-sm text-night-400">
        Aucune action trésorier — voir ci-dessous les demandes en attente de nouveaux devis.
      </p>
      <ul class="mt-3 space-y-4">
        <li
          v-for="d in demandesActionable"
          :id="'validation-' + d.reference"
          :key="d.id"
          class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm transition-shadow duration-500"
          :class="highlightRef === d.reference ? 'ring-2 ring-forest ring-offset-2 shadow-md' : ''"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-mono text-sm font-semibold text-forest">{{ d.reference }}</p>
              <p class="text-sm text-night-500">{{ d.submitter_email }}</p>
            </div>
            <AdminStatusBadge :status="d.status" />
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <AdminPaymentBadge :payment-type="d.payment_type" />
            <AdminDevisStatusBadge :demande="d" />
          </div>
          <dl class="mt-3 grid gap-1 text-sm text-night-600 sm:grid-cols-2">
            <div><dt class="inline font-medium">Projet :</dt> {{ labelFor(d.project, TRESORERIE_PROJECTS) }}</div>
            <div><dt class="inline font-medium">Nature :</dt> {{ labelFor(d.category, TRESORERIE_CATEGORIES) }}</div>
            <div><dt class="inline font-medium">Montant :</dt> {{ formatAmountWithConversion(d) }}</div>
            <div><dt class="inline font-medium">Besoin :</dt> {{ d.needed_by_date }}</div>
          </dl>
          <p class="mt-2 text-sm">{{ d.description }}</p>
          <p class="mt-1 text-xs text-night-400">{{ d.justification }}</p>
          <p
            v-if="isOwnSubmission(d.submitter_email) && canTreasurerActOn(d.submitter_email)"
            class="mt-2 rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-forest-800"
          >
            Votre propre demande — validation autorisée (admin / mode test, tracée en audit).
          </p>
          <p
            v-else-if="isOwnSubmission(d.submitter_email)"
            class="mt-2 rounded-lg border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-terracotta-700"
          >
            Votre propre demande — un autre trésorier doit approuver et valider les devis.
          </p>
          <div v-if="d.devis_attachments?.length" class="mt-2 rounded-xl border border-bleu/20 bg-bleu/5 px-3 py-3 text-sm">
            <p class="font-semibold text-night">{{ d.devis_attachments.length }} devis joint(s)</p>
            <ul class="mt-2 space-y-2">
              <li v-for="(f, i) in d.devis_attachments" :key="i" class="flex items-center justify-between gap-2">
                <span class="truncate text-xs text-night-600">{{ f.name }}</span>
                <a
                  v-if="f.drive_file_url"
                  :href="f.drive_file_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-white px-4 text-sm font-semibold text-bleu"
                >
                  Voir
                </a>
              </li>
            </ul>
          </div>
          <p
            v-else-if="needsDevisReview(d)"
            class="mt-2 text-xs font-semibold text-terracotta"
          >
            Attention : dépense &gt; {{ DEVIS_PEN_THRESHOLD }} S/. sans photos de devis jointes
          </p>

          <div v-if="rejectingDevis === d.reference" class="mt-3 space-y-2">
            <label class="block text-xs font-medium text-night">Message au bénévole (devis) *</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="admin-input"
              placeholder="Ex. Devis trop cher — merci de joindre une alternative moins chère, ou un devis détaillé pour les fournitures scolaires."
            />
            <p v-if="rejectError && rejectingDevis === d.reference" class="text-xs text-terracotta">{{ rejectError }}</p>
            <div class="admin-action-row">
              <button type="button" class="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white" @click="confirmRejectDevis(d.reference)">
                Confirmer refus des devis
              </button>
              <button type="button" class="rounded-full border border-night-200 px-4 py-2 text-sm text-night-500" @click="cancelReject">
                Annuler
              </button>
            </div>
          </div>

          <div v-else-if="rejectingDemande === d.reference" class="mt-3 space-y-2">
            <label class="block text-xs font-medium text-night">Message au bénévole (demande entière) *</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="admin-input"
              placeholder="Ex. Dépense non prévue au budget projet, ou doublon avec une demande existante."
            />
            <p v-if="rejectError && rejectingDemande === d.reference" class="text-xs text-terracotta">{{ rejectError }}</p>
            <div class="admin-action-row">
              <button type="button" class="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white" @click="confirmRejectDemande(d.reference)">
                Confirmer refus
              </button>
              <button type="button" class="rounded-full border border-night-200 px-4 py-2 text-sm text-night-500" @click="cancelReject">
                Annuler
              </button>
            </div>
          </div>
          <div v-else class="mt-4 space-y-2">
            <div v-if="canValidateDevis(d) && canTreasurerActOn(d.submitter_email)" class="admin-action-row">
              <button
                type="button"
                class="rounded-full bg-bleu px-4 py-2 text-sm font-semibold text-white"
                :disabled="validationPending(d.reference)"
                @click="validateDevis(d.reference)"
              >
                {{ validationPending(d.reference) ? '…' : 'Valider les photos de devis' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta"
                @click="startRejectDevis(d.reference)"
              >
                Refuser les photos de devis
              </button>
            </div>
            <p v-if="needsDevisReview(d) && !canApprove(d) && d.devis_status === 'pending'" class="text-xs text-ochre-700">
              Validez les photos de devis avant d'approuver la demande.
            </p>
            <div class="admin-action-row">
              <button
                type="button"
                class="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canApprove(d) || validationPending(d.reference) || !canTreasurerActOn(d.submitter_email)"
                @click="approve(d.reference)"
              >
                Approuver la demande
              </button>
              <button
                type="button"
                class="rounded-full border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta"
                @click="startRejectDemande(d.reference)"
              >
                Refuser
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="demandesAwaitingVolunteer.length">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night-500">
        En attente du bénévole ({{ demandesAwaitingVolunteer.length }})
      </h3>
      <p class="mt-1 text-xs text-night-400">
        Devis refusés — le bénévole doit renvoyer de nouvelles pièces dans l’onglet <strong>Demande</strong>. Aucune action trésorier tant qu’il n’a pas renvoyé.
      </p>
      <ul class="mt-3 space-y-4">
        <li
          v-for="d in demandesAwaitingVolunteer"
          :id="'validation-' + d.reference"
          :key="'wait-' + d.id"
          class="rounded-2xl border border-dashed border-night-200 bg-cream-100/80 p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-mono text-sm font-semibold text-forest">{{ d.reference }}</p>
              <p class="text-sm text-night-500">{{ d.submitter_email }}</p>
            </div>
            <AdminDevisStatusBadge :demande="d" />
          </div>
          <p class="mt-2 text-sm text-night-600">{{ d.description }}</p>
          <p
            v-if="d.devis_reject_reason"
            class="mt-2 rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-2 text-xs text-ochre-900"
          >
            Votre message au bénévole : <strong>{{ d.devis_reject_reason }}</strong>
          </p>
          <div v-if="rejectingDemande === d.reference" class="mt-3 space-y-2">
            <label class="block text-xs font-medium text-night">Message au bénévole (refus définitif de la demande) *</label>
            <textarea v-model="rejectReason" rows="3" class="admin-input" placeholder="Ex. Dépense annulée — ne pas renvoyer de devis." />
            <p v-if="rejectError && rejectingDemande === d.reference" class="text-xs text-terracotta">{{ rejectError }}</p>
            <div class="admin-action-row">
              <button type="button" class="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white" @click="confirmRejectDemande(d.reference)">
                Confirmer refus
              </button>
              <button type="button" class="rounded-full border border-night-200 px-4 py-2 text-sm text-night-500" @click="cancelReject">
                Annuler
              </button>
            </div>
          </div>
          <div v-else class="mt-3">
            <button
              type="button"
              class="rounded-full border border-terracotta/50 px-4 py-2 text-sm font-semibold text-terracotta"
              @click="startRejectDemande(d.reference)"
            >
              Refuser la demande entière
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">
        Factures ({{ store.pendingFactures.length }} · {{ pendingFactureGroups.length }} lot(s))
      </h3>
      <p class="mt-1 text-xs text-night-400">
        Une validation par demande/devis — toutes les factures du lot passent au journal en une fois.
      </p>
      <p v-if="!pendingFactureGroups.length" class="mt-2 text-sm text-night-400">Aucune facture en attente.</p>
      <ul class="mt-3 space-y-4">
        <li
          v-for="group in pendingFactureGroups"
          :id="'validation-' + (group.demand_reference || group.factures[0]?.reference)"
          :key="group.demand_reference || group.factures[0]?.id"
          class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm transition-shadow duration-500"
          :class="groupHighlighted(group) ? 'ring-2 ring-forest ring-offset-2 shadow-md' : ''"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p v-if="group.demand_reference" class="font-mono text-sm font-semibold text-forest">
                Demande {{ group.demand_reference }}
              </p>
              <p v-else class="font-mono text-sm font-semibold text-forest">
                {{ group.factures[0]?.reference }}
              </p>
              <p class="text-xs text-night-400">{{ group.submitter_email }}</p>
            </div>
            <span class="rounded-full bg-ochre/20 px-2.5 py-0.5 text-xs font-semibold text-ochre-700">
              {{ group.factures.length }} facture(s)
            </span>
          </div>

          <dl
            v-if="group.factures[0]"
            class="mt-3 grid gap-1 rounded-xl border border-night/10 bg-sand/20 px-3 py-2 text-sm text-night-600 sm:grid-cols-2"
          >
            <div><dt class="inline font-medium">Payé par :</dt> {{ group.factures[0].paid_by || '—' }}</div>
            <div><dt class="inline font-medium">Moyen :</dt> {{ labelFor(group.factures[0].payment_method, PAYMENT_METHODS) }}</div>
            <div><dt class="inline font-medium">Lieu :</dt> {{ group.factures[0].location || '—' }}</div>
            <div class="sm:col-span-2"><dt class="inline font-medium">Libellé demande :</dt> {{ group.factures[0].label || '—' }}</div>
          </dl>

          <ul class="mt-3 space-y-3">
            <li
              v-for="f in group.factures"
              :key="f.id"
              class="rounded-xl border border-night/10 bg-sand/20 p-3 text-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-xs font-semibold text-forest">{{ f.reference }}</p>
                <AdminPaymentBadge :payment-type="f.payment_type" />
              </div>
              <dl class="mt-2 grid gap-1 text-night-600 sm:grid-cols-2">
                <div><dt class="inline font-medium">Montant :</dt> {{ formatAmountWithConversion(f) }}</div>
                <div><dt class="inline font-medium">Date :</dt> {{ f.expense_date }}</div>
                <div class="sm:col-span-2"><dt class="inline font-medium">Fournisseur :</dt> {{ f.vendor_name }}</div>
              </dl>
              <a
                v-if="f.drive_file_url"
                :href="f.drive_file_url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-flex items-center text-xs font-semibold text-bleu hover:underline"
              >
                Voir la pièce
              </a>

              <div v-if="rejectingFacture === f.reference" class="mt-3 space-y-2">
                <label class="block text-xs font-medium text-night">Message au bénévole (facture) *</label>
                <textarea
                  v-model="rejectReason"
                  rows="3"
                  class="admin-input"
                  placeholder="Ex. Montant incorrect, photo illisible…"
                />
                <p v-if="rejectError && rejectingFacture === f.reference" class="text-xs text-terracotta">{{ rejectError }}</p>
                <div class="admin-action-row">
                  <button type="button" class="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white" @click="confirmRejectFacture(f.reference)">
                    Confirmer refus
                  </button>
                  <button type="button" class="rounded-full border border-night-200 px-4 py-2 text-sm text-night-500" @click="cancelReject">
                    Annuler
                  </button>
                </div>
              </div>
              <button
                v-else
                type="button"
                class="mt-2 text-xs font-semibold text-terracotta hover:underline"
                @click="startRejectFacture(f.reference)"
              >
                Refuser cette facture
              </button>
            </li>
          </ul>

          <p class="mt-3 text-sm font-medium text-night">
            Total lot : {{ formatPen(group.total_pen) }}
            <span v-if="group.total_eur" class="text-night-400">({{ formatEur(group.total_eur) }})</span>
          </p>

          <p
            v-if="isOwnSubmission(group.submitter_email) && canTreasurerActOn(group.submitter_email)"
            class="mt-2 rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-forest-800"
          >
            Votre propre demande — validation autorisée (admin / mode test).
          </p>
          <p
            v-else-if="isOwnSubmission(group.submitter_email)"
            class="mt-2 rounded-lg border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-terracotta-700"
          >
            Votre propre demande — un autre trésorier doit valider.
          </p>

          <div class="admin-action-row mt-4">
            <button
              type="button"
              class="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canTreasurerActOn(group.submitter_email) || validationPending(groupKey(group))"
              @click="validateGroup(group)"
            >
              {{
                validationPending(groupKey(group))
                  ? 'Validation…'
                  : group.demand_reference
                    ? `Valider les ${group.factures.length} factures → Journal`
                    : 'Valider → Journal'
              }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  TRESORERIE_PROJECTS,
  TRESORERIE_CATEGORIES,
  PAYMENT_METHODS,
  DEVIS_PEN_THRESHOLD,
  labelFor,
  formatPen,
  formatEur,
  requiresDevisAttachments,
  canApproveDemande,
  canValidateDevisPhotos,
  awaitingVolunteerDevisResubmit
} from '@/data/tresorerie-config.js'
import { ADMIN_EMAIL, isSuperAdmin } from '@/data/member-roles.js'
import { formatAmountWithConversion } from '@/data/currency.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import { useAuthStore } from '@/store/auth.js'
import { TASK_ESTIMATE_MS, useUploadQueue } from '@/store/uploadQueue.js'
import { markDataStale, onPendingRefresh } from '@/composables/usePendingRefresh.js'
import AdminStatusBadge from './AdminStatusBadge.vue'
import AdminPaymentBadge from './AdminPaymentBadge.vue'
import AdminReimbursementBadge from './AdminReimbursementBadge.vue'
import AdminReimbursementPanel from './AdminReimbursementPanel.vue'
import AdminDevisStatusBadge from './AdminDevisStatusBadge.vue'

const store = useTresorerieStore()
const auth = useAuthStore()
const uploads = useUploadQueue()
const route = useRoute()
const highlightRef = ref(null)

function scrollToValidationRef(refCode) {
  if (!refCode) return
  nextTick(() => {
    const el = document.getElementById('validation-' + refCode)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightRef.value = refCode
    window.setTimeout(() => {
      if (highlightRef.value === refCode) highlightRef.value = null
    }, 4500)
  })
}

watch(
  () => route.query.ref,
  (refCode) => scrollToValidationRef(refCode),
  { immediate: true }
)

watch(
  () => store.pendingDemandes.length + store.pendingFactures.length,
  () => scrollToValidationRef(route.query.ref)
)

const liveNotice = ref('')
const refreshing = ref(false)

onMounted(() => scrollToValidationRef(route.query.ref))

// Rechargement manuel depuis la barre de tâches (voir usePendingRefresh).
onPendingRefresh(async () => {
  await store.refreshPending(true)
  await store.refreshReimbursements()
})

function isOwnSubmission(email) {
  return String(email || '').toLowerCase() === String(auth.user?.email || '').toLowerCase()
}

const allowSelfTest = import.meta.env.VITE_TRESORERIE_ALLOW_SELF_VALIDATION === 'true'

/** Trésorier : pas d'auto-validation · admin / e-mail admin / mode test autorisés. */
function canTreasurerActOn(submitterEmail) {
  if (!isOwnSubmission(submitterEmail)) return true
  if (allowSelfTest) return true
  if (auth.isAdmin) return true
  if (isSuperAdmin(auth.user?.email, auth.user?.role)) return true
  return String(auth.user?.email || '').toLowerCase() === ADMIN_EMAIL
}

watch(
  () => store.validationVersion,
  (next, prev) => {
    if (prev && next && next !== prev && !refreshing.value) {
      liveNotice.value = 'File d\'attente mise à jour.'
      window.setTimeout(() => { liveNotice.value = '' }, 4000)
    }
  }
)

const demandesActionable = computed(() =>
  store.pendingDemandes.filter((d) => !awaitingVolunteerDevisResubmit(d))
)
const demandesAwaitingVolunteer = computed(() =>
  store.pendingDemandes.filter((d) => awaitingVolunteerDevisResubmit(d))
)

const pendingFactureGroups = computed(() => {
  const groups = new Map()
  for (const f of store.pendingFactures) {
    const key = f.demand_reference || f.reference
    if (!groups.has(key)) {
      groups.set(key, {
        demand_reference: f.demand_reference || '',
        submitter_email: f.submitter_email,
        factures: []
      })
    }
    groups.get(key).factures.push(f)
  }
  return Array.from(groups.values()).map((g) => ({
    ...g,
    total_pen: g.factures.reduce((sum, f) => sum + (Number(f.amount_pen) || 0), 0),
    total_eur: g.factures.reduce((sum, f) => sum + (Number(f.amount_eur) || 0), 0)
  }))
})

function validationPending(ref) {
  return uploads.activeMeta('validation', 'ref').has(ref)
}

function enqueueValidation({ label, ref, run, describe }) {
  uploads.enqueue({
    kind: 'validation',
    label,
    meta: { ref },
    hasFile: false,
    abortable: false,
    estimateMs: TASK_ESTIMATE_MS.validation,
    run: () => run({ background: true }),
    describe,
    onSuccess: () => markDataStale()
  })
}

async function reload() {
  refreshing.value = true
  try {
    await store.refreshPending(true)
  } finally {
    refreshing.value = false
  }
}

const rejectingDemande = ref(null)
const rejectingFacture = ref(null)
const rejectingDevis = ref(null)
const rejectReason = ref('')
const rejectError = ref('')
function requireRejectReason() {
  rejectError.value = ''
  const text = String(rejectReason.value || '').trim()
  if (text.length < 5) {
    rejectError.value = 'Écrivez un message d\'au moins 5 caractères pour le bénévole.'
    return null
  }
  return text
}

function needsDevisReview(d) {
  return requiresDevisAttachments(d.amount_pen_estimated)
}

function canValidateDevis(d) {
  return canValidateDevisPhotos(d)
}

function canApprove(d) {
  return canApproveDemande(d)
}

function startRejectDemande(ref) {
  rejectingDemande.value = ref
  rejectingFacture.value = null
  rejectingDevis.value = null
  rejectReason.value = ''
  rejectError.value = ''
}

function startRejectDevis(ref) {
  rejectingDevis.value = ref
  rejectingDemande.value = null
  rejectingFacture.value = null
  rejectReason.value = ''
  rejectError.value = ''
}

function startRejectFacture(ref) {
  rejectingFacture.value = ref
  rejectingDemande.value = null
  rejectingDevis.value = null
  rejectReason.value = ''
  rejectError.value = ''
}

function cancelReject() {
  rejectingDemande.value = null
  rejectingFacture.value = null
  rejectingDevis.value = null
  rejectReason.value = ''
  rejectError.value = ''
}

function validateDevis(reference) {
  enqueueValidation({
    label: `Devis · ${reference}`,
    ref: reference,
    run: (opts) => store.validateDemandeDevis(reference, opts),
    describe: () => ({ text: `Devis validés pour ${reference}.`, copyText: reference })
  })
}

function approve(reference) {
  enqueueValidation({
    label: `Approbation · ${reference}`,
    ref: reference,
    run: (opts) => store.approveDemande(reference, opts),
    describe: () => ({ text: `${reference} approuvée.`, copyText: reference })
  })
}

function confirmRejectDevis(reference) {
  const reason = requireRejectReason()
  if (!reason) return
  enqueueValidation({
    label: `Refus devis · ${reference}`,
    ref: reference,
    run: (opts) => store.rejectDemandeDevis(reference, reason, opts),
    describe: () => ({ text: `Devis refusés pour ${reference}.`, copyText: reference })
  })
  cancelReject()
}

function confirmRejectDemande(reference) {
  const reason = requireRejectReason()
  if (!reason) return
  enqueueValidation({
    label: `Refus demande · ${reference}`,
    ref: reference,
    run: (opts) => store.rejectDemande(reference, reason, opts),
    describe: () => ({ text: `${reference} refusée.`, copyText: reference })
  })
  cancelReject()
}

function groupKey(group) {
  return group.demand_reference || group.factures[0]?.reference || ''
}

function groupHighlighted(group) {
  const ref = highlightRef.value
  if (!ref) return false
  if (group.demand_reference === ref) return true
  return group.factures.some((f) => f.reference === ref)
}

function validateGroup(group) {
  const key = groupKey(group)
  const ref = group.demand_reference || group.factures[0]?.reference
  enqueueValidation({
    label: group.demand_reference
      ? `Factures · ${group.demand_reference} (${group.factures.length})`
      : `Facture · ${ref}`,
    ref: key,
    run: (opts) =>
      group.demand_reference
        ? store.validateDemandeFactures(group.demand_reference, opts)
        : store.validateFacture(group.factures[0].reference, opts),
    describe: (result) => ({
      text: group.demand_reference
        ? `${result?.count ?? group.factures.length} facture(s) validée(s) pour ${group.demand_reference}.`
        : `${ref} validée · journal à jour.`,
      copyText: ref
    })
  })
}

function confirmRejectFacture(reference) {
  const reason = requireRejectReason()
  if (!reason) return
  enqueueValidation({
    label: `Refus facture · ${reference}`,
    ref: reference,
    run: (opts) => store.rejectFacture(reference, reason, opts),
    describe: () => ({ text: `${reference} refusée.`, copyText: reference })
  })
  cancelReject()
}

</script>
