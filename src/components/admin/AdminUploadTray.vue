<template>
  <section
    v-if="queue.visibleJobs.length"
    class="upload-tray fixed inset-x-0 z-[45] px-3 sm:left-auto sm:right-4 sm:w-[24rem] sm:px-0"
    :style="{ bottom: aboveNav ? 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' : 'calc(1rem + env(safe-area-inset-bottom, 0px))' }"
    aria-label="Envois de fichiers"
  >
    <!-- Annonce lecteur d'écran : seulement les changements d'étape, pas chaque % -->
    <p class="sr-only" aria-live="polite">{{ liveText }}</p>

    <div class="overflow-hidden rounded-2xl border border-night-100 bg-white shadow-xl">
      <div class="flex items-center gap-2 border-b border-night-50 py-1 pl-4 pr-1">
        <PhUploadSimple :size="18" weight="bold" class="shrink-0 text-forest" aria-hidden="true" />
        <p class="min-w-0 flex-1 truncate text-sm font-semibold text-night">
          {{ headerText }}
        </p>
        <span v-if="minimized && queue.hasActive" class="shrink-0 text-sm font-semibold tabular-nums text-forest">
          {{ overallProgress }} %
        </span>
        <button
          type="button"
          class="touch-target shrink-0 rounded-full text-night-500 hover:bg-night-50"
          :aria-expanded="!minimized"
          :aria-label="minimized ? 'Afficher le détail des envois' : 'Réduire la barre des envois'"
          @click="minimized = !minimized"
        >
          <PhCaretUp v-if="minimized" :size="18" weight="bold" aria-hidden="true" />
          <PhCaretDown v-else :size="18" weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div v-if="minimized && queue.hasActive" class="h-1 bg-cream-200">
        <div class="h-full bg-forest transition-[width] duration-300" :style="{ width: overallProgress + '%' }" />
      </div>

      <ul v-show="!minimized" class="max-h-[45dvh] divide-y divide-night-50 overflow-y-auto">
        <li v-for="job in queue.visibleJobs" :key="job.id" class="px-4 py-3">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0" aria-hidden="true">
              <PhCheckCircle v-if="job.phase === 'done'" :size="20" weight="fill" class="text-forest" />
              <PhWarningCircle v-else-if="job.phase === 'error' || job.phase === 'cancelled'" :size="20" weight="fill" class="text-terracotta" />
              <span v-else class="block h-5 w-5 animate-spin rounded-full border-2 border-forest/20 border-t-forest motion-reduce:animate-none" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-night">{{ job.label }}</p>

              <template v-if="isActive(job)">
                <p class="mt-0.5 text-xs text-night-500">
                  {{ phaseLabel(job) }} · {{ elapsed(job) }}
                  <span v-if="eta(job)"> · ≈ {{ eta(job) }} restantes</span>
                </p>
                <div
                  class="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200"
                  role="progressbar"
                  :aria-valuenow="job.progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`${job.label} : ${job.progress} %`"
                >
                  <div class="h-full rounded-full bg-forest transition-[width] duration-300 ease-out" :style="{ width: job.progress + '%' }" />
                </div>
                <p v-if="job.phase === 'upload'" class="mt-1.5 text-xs text-night-400">
                  Vous pouvez continuer à utiliser l'espace adhérent pendant l'envoi.
                </p>
              </template>

              <p v-else-if="job.phase === 'done'" class="mt-0.5 text-xs text-forest-700">{{ job.successText }}</p>
              <p v-else class="mt-0.5 text-xs text-terracotta-700">{{ job.error }}</p>

              <ul v-if="job.files?.length && !isActive(job)" class="mt-1.5 space-y-0.5 text-xs">
                <li v-for="(f, i) in job.files" :key="i" :class="f.ok ? 'text-night-500' : 'text-terracotta-700'">
                  {{ f.ok ? '✓' : '✗' }} {{ f.name }}<span v-if="f.error"> — {{ f.error }}</span>
                </li>
              </ul>

              <div v-if="!isActive(job) || job.controller" class="mt-2 flex flex-wrap gap-2">
                <button
                  v-if="isActive(job)"
                  type="button"
                  class="tray-btn bg-white border-night-200 text-night-600"
                  @click="queue.cancel(job.id)"
                >
                  Annuler
                </button>
                <a
                  v-if="job.phase === 'done' && job.link && job.link !== '#'"
                  :href="job.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="tray-btn bg-white border-bleu/30 text-bleu"
                >
                  <PhArrowSquareOut :size="14" weight="bold" aria-hidden="true" /> Ouvrir sur le Drive
                </a>
                <button
                  v-if="job.phase === 'done' && job.copyText"
                  type="button"
                  class="tray-btn bg-white border-night-200 text-night-600"
                  @click="copy(job)"
                >
                  <PhCopy :size="14" weight="bold" aria-hidden="true" /> {{ copiedId === job.id ? 'Copié' : 'Copier la réf.' }}
                </button>
                <button
                  v-if="job.phase === 'error' || job.phase === 'cancelled'"
                  type="button"
                  class="tray-btn border-forest bg-forest text-white"
                  @click="queue.retry(job.id)"
                >
                  <PhArrowClockwise :size="14" weight="bold" aria-hidden="true" /> Réessayer
                </button>
                <button
                  v-if="!isActive(job)"
                  type="button"
                  class="tray-btn bg-white border-night-200 text-night-600"
                  :aria-label="`Fermer : ${job.label}`"
                  @click="queue.dismiss(job.id)"
                >
                  <PhX :size="14" weight="bold" aria-hidden="true" /> Fermer
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  PhArrowClockwise,
  PhArrowSquareOut,
  PhCaretDown,
  PhCaretUp,
  PhCheckCircle,
  PhCopy,
  PhUploadSimple,
  PhWarningCircle,
  PhX
} from '@phosphor-icons/vue'
import { UPLOAD_PHASES, useUploadQueue } from '@/store/uploadQueue.js'

defineProps({
  /** Placer la barre au-dessus de la navigation basse de l'admin. */
  aboveNav: { type: Boolean, default: true }
})

const queue = useUploadQueue()
const minimized = ref(false)
const now = ref(Date.now())
const copiedId = ref(null)
let clock = null

const ACTIVE = new Set(['queued', 'prepare', 'encode', 'upload'])
function isActive(job) {
  return ACTIVE.has(job.phase)
}

const headerText = computed(() => {
  const n = queue.activeJobs.length
  if (n) return n > 1 ? `${n} envois en cours` : 'Envoi en cours'
  const errors = queue.visibleJobs.filter((j) => j.phase === 'error').length
  if (errors) return errors > 1 ? `${errors} envois en échec` : 'Envoi en échec'
  return 'Envois terminés'
})

const overallProgress = computed(() => {
  const list = queue.activeJobs
  if (!list.length) return 100
  return Math.round(list.reduce((s, j) => s + j.progress, 0) / list.length)
})

function phaseLabel(job) {
  return UPLOAD_PHASES[job.phase] || job.phase
}

function fmtSeconds(s) {
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`
}

function elapsed(job) {
  void now.value
  return fmtSeconds(Math.max(0, Math.round((Date.now() - job.startedAt) / 1000)))
}

function eta(job) {
  void now.value
  const s = queue.etaSeconds(job)
  return s ? fmtSeconds(s) : null
}

async function copy(job) {
  try {
    await navigator.clipboard.writeText(job.copyText)
    copiedId.value = job.id
    setTimeout(() => { if (copiedId.value === job.id) copiedId.value = null }, 2000)
  } catch {
    /* presse-papiers refusé : sans gravité */
  }
}

// Annonces lecteur d'écran (début / fin), pas à chaque tick.
const liveText = ref('')
watch(
  () => queue.visibleJobs.map((j) => `${j.id}:${j.phase}`).join('|'),
  () => {
    const last = queue.visibleJobs[queue.visibleJobs.length - 1]
    if (!last) return
    if (last.phase === 'done') liveText.value = `${last.label} : ${last.successText}`
    else if (last.phase === 'error' || last.phase === 'cancelled') liveText.value = `${last.label} : ${last.error}`
    else liveText.value = `${last.label} : ${phaseLabel(last)}`
  }
)

// Un nouvel envoi rouvre la barre si elle était réduite.
watch(() => queue.activeJobs.length, (n, prev) => {
  if (n > (prev ?? 0)) minimized.value = false
})

/** Fermer l'onglet pendant un envoi le perdrait : on prévient. */
function onBeforeUnload(e) {
  if (!queue.hasActive) return
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  clock = setInterval(() => { now.value = Date.now() }, 1000)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  clearInterval(clock)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<style scoped>
.tray-btn {
  @apply inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition;
}
</style>
