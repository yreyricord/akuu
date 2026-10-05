<template>
  <section
    v-if="showAlert"
    class="rounded-2xl border-2 border-ochre-300 bg-ochre-50/80 p-5 shadow-sm"
    role="alert"
  >
    <div class="flex flex-wrap items-start gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ochre-200 text-lg">
        🏦
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-wide text-ochre-800">Relevés bancaires</p>
        <h3 class="mt-0.5 font-serif text-lg font-bold text-night">{{ headline }}</h3>
        <p class="mt-1 text-sm text-night-600">
          {{ presentCount }} / {{ expectedCount }} mois couverts
          <span v-if="resolvedMissing.length"> · {{ resolvedMissing.length }} à déposer</span>
        </p>
      </div>
    </div>

    <ul v-if="allMissing.length" class="mt-4 space-y-2">
      <li
        v-for="item in allMissing"
        :key="item.month"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3"
        :class="isMonthPending(item.month) ? 'border-leaf/30 bg-leaf/5' : 'border-ochre-200 bg-white'"
      >
        <span class="text-sm font-medium" :class="isMonthPending(item.month) ? 'text-forest' : 'text-night'">
          <span v-if="isMonthPending(item.month)" class="mr-1">✓</span>
          {{ item.label }}
          <span v-if="isMonthPending(item.month)" class="ml-1 text-xs font-normal text-night-500">(déposé)</span>
          <a
            v-if="serverUrl(item.month)"
            :href="serverUrl(item.month)"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-2 text-xs font-semibold text-bleu hover:underline"
          >voir sur le Drive</a>
        </span>
        <span class="text-xs text-night-400">{{ item.suggested_filename }}</span>
      </li>
    </ul>

    <p v-if="pendingOnly" class="mt-3 text-sm text-forest">
      Tous les relevés manquants sont déposés sur le Drive. Le bilan {{ year }} sera recalculé à la prochaine
      mise à jour des archives (rien d'autre à faire de votre côté).
    </p>

    <form v-if="resolvedMissing.length && !uploadDone" class="mt-4 space-y-3" @submit.prevent="submit">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-night-400">Mois</span>
          <select v-model="selectedMonth" class="admin-input w-full py-2 text-sm" required>
            <option v-for="item in resolvedMissing" :key="item.month" :value="item.month">
              {{ item.label }}
            </option>
          </select>
        </label>
        <label class="block space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-night-400">PDF relevé</span>
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf,.pdf"
            class="block w-full text-sm text-night-600 file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            required
            @change="onFileChange"
          />
        </label>
      </div>
      <p v-if="uploadError" class="text-sm text-terracotta-700" role="alert">{{ uploadError }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-600 disabled:opacity-50"
          :disabled="uploading || !file"
        >
          {{ uploading ? 'Envoi…' : 'Déposer le relevé PDF' }}
        </button>
      </div>
    </form>

    <div
      v-if="uploadDone"
      class="mt-4 rounded-xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm text-forest"
      role="status"
    >
      <p class="font-semibold">Relevé enregistré : {{ lastUpload.filename }}</p>
      <p class="mt-1 text-night-600">{{ lastUpload.hint }}</p>
      <button
        v-if="resolvedMissing.length"
        type="button"
        class="mt-3 text-sm font-medium text-forest underline"
        @click="resetUpload"
      >
        Déposer un autre mois
      </button>
    </div>

    <p v-if="status?.historique_note" class="mt-3 text-xs text-night-500">
      {{ status.historique_note }}
    </p>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { markReleveUploaded, useRelevesPending } from '@/composables/useRelevesPending.js'
import { TASK_ESTIMATE_MS, useUploadQueue } from '@/store/uploadQueue.js'
import { markDataStale, onPendingRefresh } from '@/composables/usePendingRefresh.js'

const props = defineProps({
  year: { type: [String, Number], required: true },
  status: { type: Object, default: null }
})

const emit = defineEmits(['uploaded'])

const uploads = useUploadQueue()
const { isMonthPending: isLocalPending, refreshPending } = useRelevesPending(() => props.year)
const serverList = ref([])
async function loadServer() {
  try { serverList.value = await tresorerieApi.listRelevesArchives() } catch { serverList.value = [] }
}
loadServer()
// Rechargement manuel depuis la barre de tâches (voir usePendingRefresh).
onPendingRefresh(() => loadServer())
function serverRow(month) {
  return serverList.value.find((r) => Number(r.year) === Number(props.year) && Number(r.month) === Number(month))
}
function serverUrl(month) { return serverRow(month)?.url || lastUpload.value?.month === Number(month) && lastUpload.value?.url || '' }
function isMonthPending(month) { return isLocalPending(month) || Boolean(serverRow(month)) }

const selectedMonth = ref(null)
const file = ref(null)
const fileInput = ref(null)
const uploadError = ref(null)
const uploading = computed(() =>
  uploads.isBusy('releve', (m) => m.month === `${props.year}-${String(selectedMonth.value).padStart(2, '0')}`)
)
const uploadDone = ref(false)
const lastUpload = ref(null)

const expectedCount = computed(() => props.status?.expected ?? 12)
const allMissing = computed(() => props.status?.missing ?? [])
const resolvedMissing = computed(() => allMissing.value.filter((item) => !isMonthPending(item.month)))
const presentCount = computed(() => Math.max(0, expectedCount.value - resolvedMissing.value.length))

const pendingOnly = computed(
  () => allMissing.value.length > 0 && resolvedMissing.value.length === 0
)

const showAlert = computed(() => {
  const s = props.status?.status
  if (!s || s === 'complete') return false
  return allMissing.value.length > 0
})

const headline = computed(() => {
  const todo = resolvedMissing.value.length
  if (todo) return `Il manque ${todo} relevé(s) bancaire(s)`
  if (pendingOnly.value) return 'Relevés déposés — regénération du bilan requise'
  return props.status?.label ?? 'Relevés bancaires'
})

watch(
  resolvedMissing,
  (list) => {
    if (list.length && !list.some((x) => x.month === selectedMonth.value)) {
      selectedMonth.value = list[0].month
    }
  },
  { immediate: true }
)

function onFileChange(e) {
  file.value = e.target.files?.[0] ?? null
  uploadError.value = null
}

function submit() {
  if (!file.value || !selectedMonth.value) return
  uploadError.value = null
  const month = Number(selectedMonth.value)
  const year = Number(props.year)
  const pdf = file.value
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const item = resolvedMissing.value.find((x) => x.month === month)
  uploads.enqueue({
    kind: 'releve',
    label: `Relevé PDF · ${item?.label || monthKey}`,
    meta: { month: monthKey },
    fileCount: 1,
    estimateMs: TASK_ESTIMATE_MS.releve,
    run: ({ onProgress, signal }) =>
      tresorerieApi.uploadReleve({ year, month, file: pdf }, { onProgress, signal }),
    describe: (result) => ({
      text: `Relevé enregistré : ${result.filename}`,
      link: result.url || null
    }),
    onSuccess: (result) => {
      markReleveUploaded(year, month, result.filename)
      refreshPending()
      lastUpload.value = { ...result, month }
      uploadDone.value = true
      loadServer()
      markDataStale()
      file.value = null
      if (fileInput.value) fileInput.value.value = ''
      emit('uploaded', result)
    },
    onError: (e) => {
      uploadError.value = e.message ?? 'Le dépôt a échoué. Réessayez, ou envoyez le PDF au trésorier technique.'
    }
  })
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function resetUpload() {
  uploadDone.value = false
  lastUpload.value = null
}
</script>
