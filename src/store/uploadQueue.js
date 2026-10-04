import { defineStore } from 'pinia'
import { computed, markRaw, ref } from 'vue'

/**
 * File d'envoi non bloquante (spec : docs/SPEC-UPLOAD-BACKGROUND-2026-10.md).
 *
 * Chaque envoi est un « job » indépendant : l'interface reste utilisable,
 * on peut changer d'onglet admin, et la barre AdminUploadTray affiche la
 * progression. Remplace `store.loading` (global) pour les flux d'upload.
 *
 * Progression globale d'un job :
 *   prepare 0 → 5 % · encode 5 → 25 % (réel, FileReader) ·
 *   upload 25 → 95 % (estimée : taille ÷ débit supposé + traitement serveur) ·
 *   done 100 %
 */

export const UPLOAD_PHASES = {
  queued: 'En attente',
  prepare: 'Préparation',
  encode: 'Encodage',
  upload: 'Envoi au serveur',
  processing: 'Traitement serveur',
  done: 'Terminé',
  error: 'Échec',
  cancelled: 'Annulé'
}

/** Durée estimée pour les tâches sans fichier (Apps Script). */
export const TASK_ESTIMATE_MS = {
  journal: 8000,
  validation: 6000,
  sync: 28_000,
  releve: 45_000,
  attach: null,
  facture: null,
  demande: null,
  expense: null
}

const ACTIVE = new Set(['queued', 'prepare', 'encode', 'upload', 'processing'])
const UPLOAD_KINDS = new Set(['attach', 'facture', 'demande', 'expense', 'releve'])
const SUCCESS_TTL_MS = 8000
/** Traitement Apps Script (Drive + Sheets) mesuré à ~4–12 s par fichier. */
const SERVER_OVERHEAD_MS = 6000
const SERVER_PER_FILE_MS = 2500

/** Débit montant supposé en octets/s (navigator.connection ne donne que le débit descendant). */
function assumedUplinkBytesPerSec() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  const down = Number(c?.downlink) // Mbit/s
  const mbps = Number.isFinite(down) && down > 0 ? Math.min(Math.max(down / 3, 0.4), 20) : 1.5
  return (mbps * 1_000_000) / 8
}

export const useUploadQueue = defineStore('uploadQueue', () => {
  const jobs = ref([])
  let seq = 0
  const timers = new Map()

  const activeJobs = computed(() => jobs.value.filter((j) => ACTIVE.has(j.phase)))
  const hasActive = computed(() => activeJobs.value.length > 0)
  const visibleJobs = computed(() => jobs.value.filter((j) => !j.dismissed))

  function find(id) {
    return jobs.value.find((j) => j.id === id)
  }

  function stopTimer(id) {
    const t = timers.get(id)
    if (t) clearInterval(t)
    timers.delete(id)
  }

  function setProgress(job, pct) {
    job.progress = Math.max(job.progress, Math.min(100, Math.round(pct)))
  }

  /** Callback transmis à l'API : onProgress(phase, ratio, extra). */
  function makeProgressHandler(job) {
    return (phase, ratio = 0, extra = {}) => {
      if (!ACTIVE.has(job.phase)) return
      if (phase === 'encode') {
        job.phase = 'encode'
        setProgress(job, 5 + ratio * 20)
      } else if (phase === 'upload') {
        job.phase = 'upload'
        job.bytes = extra.bytes || job.bytes
        startUploadEstimate(job)
      }
    }
  }

  function startTimedEstimate(job, phase, fromPct) {
    stopTimer(job.id)
    job.phase = phase
    job.uploadStartedAt = Date.now()
    const from = Math.max(job.progress, fromPct)
    const tick = () => {
      const t = (Date.now() - job.uploadStartedAt) / job.estimateMs
      const eased = 1 - Math.exp(-2.2 * t)
      setProgress(job, from + (95 - from) * eased)
    }
    tick()
    timers.set(job.id, setInterval(tick, 250))
  }

  function startUploadEstimate(job) {
    const sendMs = (job.bytes || 0) / assumedUplinkBytesPerSec() * 1000
    job.estimateMs = sendMs + SERVER_OVERHEAD_MS + SERVER_PER_FILE_MS * Math.max(1, job.fileCount)
    startTimedEstimate(job, 'upload', 25)
  }

  function startProcessingEstimate(job) {
    job.estimateMs = job.estimateMs || TASK_ESTIMATE_MS[job.kind] || 8000
    startTimedEstimate(job, 'processing', 5)
  }

  function jobUsesUploadPipeline(job) {
    if (job.hasFile === true) return true
    if (job.hasFile === false) return false
    return UPLOAD_KINDS.has(job.kind) || (job.kind === 'journal' && job.fileCount > 0)
  }

  async function execute(job) {
    // markRaw : un AbortController proxifié lève « Illegal invocation » sur abort()
    const controller = markRaw(new AbortController())
    job.controller = controller
    job.phase = 'prepare'
    job.progress = 0
    job.error = null
    job.errorCode = null
    job.startedAt = Date.now()
    job.endedAt = null
    setProgress(job, 2)
    const usesUpload = jobUsesUploadPipeline(job)
    const abortable = job.abortable !== false && usesUpload
    if (!usesUpload) startProcessingEstimate(job)
    try {
      const result = await job.run({
        onProgress: makeProgressHandler(job),
        signal: abortable ? controller.signal : undefined
      })
      stopTimer(job.id)
      job.result = result
      const summary = job.describe ? job.describe(result) : null
      job.successText = summary?.text || job.successText || 'Envoi terminé.'
      job.link = summary?.link || null
      job.copyText = summary?.copyText || null
      job.files = summary?.files || job.files
      job.phase = 'done'
      job.progress = 100
      job.endedAt = Date.now()
      try {
        await job.onSuccess?.(result)
      } catch {
        /* rafraîchissement secondaire : ne transforme pas un succès en échec */
      }
      setTimeout(() => dismiss(job.id), SUCCESS_TTL_MS)
    } catch (e) {
      stopTimer(job.id)
      job.endedAt = Date.now()
      if (e?.code === 'ABORTED' || controller.signal.aborted) {
        job.phase = 'cancelled'
        job.error = job.progress >= 25
          ? 'Envoi interrompu. Si le serveur avait déjà reçu le fichier, il peut apparaître quand même : vérifiez avant de renvoyer.'
          : 'Envoi annulé.'
      } else {
        job.phase = 'error'
        job.error = e?.message || 'Erreur inconnue'
        job.errorCode = e?.code || null
        if (e?.partial) job.files = e.partial
      }
      job.onError?.(e)
    } finally {
      job.controller = null
    }
  }

  /**
   * @param {object} spec
   * @param {string} spec.kind       ex. 'facture', 'attach'
   * @param {string} spec.label      titre affiché
   * @param {object} [spec.meta]     données métier (référence…) pour isBusy()
   * @param {number} [spec.fileCount]
   * @param {boolean} [spec.hasFile]     true/false pour forcer pipeline upload ou processing
   * @param {boolean} [spec.abortable]   false pour journal/validation (pas d'annulation)
   * @param {number} [spec.estimateMs]   durée estimée processing (ms)
   * @param {(ctx: {onProgress: Function, signal: AbortSignal}) => Promise<any>} spec.run
   * @param {(result: any) => {text?: string, link?: string, copyText?: string, files?: Array}} [spec.describe]
   * @param {(result: any) => any} [spec.onSuccess]
   * @param {(error: Error) => any} [spec.onError]
   */
  function enqueue(spec) {
    seq += 1
    const hasFile = spec.hasFile
    const fileCount = spec.fileCount ?? (hasFile === false ? 0 : 1)
    const usesUpload = hasFile === true || (hasFile !== false && (
      UPLOAD_KINDS.has(spec.kind) || (spec.kind === 'journal' && fileCount > 0)
    ))
    const job = {
      id: `up-${Date.now()}-${seq}`,
      kind: spec.kind,
      label: spec.label,
      meta: spec.meta || {},
      fileCount,
      hasFile,
      abortable: spec.abortable !== undefined ? spec.abortable : usesUpload,
      estimateMs: spec.estimateMs,
      run: spec.run,
      describe: spec.describe,
      onSuccess: spec.onSuccess,
      onError: spec.onError,
      phase: 'queued',
      progress: 0,
      bytes: 0,
      estimateMs: 0,
      uploadStartedAt: 0,
      startedAt: Date.now(),
      endedAt: null,
      error: null,
      errorCode: null,
      result: null,
      successText: '',
      link: null,
      copyText: null,
      files: null,
      dismissed: false,
      controller: null
    }
    jobs.value.push(job)
    // l'objet réactif (proxy) pour que les mutations mettent l'UI à jour
    const reactiveJob = jobs.value[jobs.value.length - 1]
    execute(reactiveJob)
    return reactiveJob.id
  }

  function cancel(id) {
    find(id)?.controller?.abort()
  }

  function retry(id) {
    const job = find(id)
    if (!job || ACTIVE.has(job.phase)) return
    job.dismissed = false
    execute(job)
  }

  function dismiss(id) {
    const job = find(id)
    if (!job || ACTIVE.has(job.phase)) return
    stopTimer(id)
    jobs.value = jobs.value.filter((j) => j.id !== id)
  }

  /** Un envoi du type donné est-il en cours (optionnellement filtré) ? */
  function isBusy(kind, predicate) {
    return activeJobs.value.some((j) => j.kind === kind && (!predicate || predicate(j.meta)))
  }

  /** Valeurs `meta[key]` des envois actifs d'un type (ex. références en cours). */
  function activeMeta(kind, key) {
    return new Set(activeJobs.value.filter((j) => j.kind === kind).map((j) => j.meta?.[key]))
  }

  /** Secondes restantes estimées (phase upload uniquement). */
  function etaSeconds(job) {
    if ((job.phase !== 'upload' && job.phase !== 'processing') || !job.estimateMs) return null
    const left = job.estimateMs - (Date.now() - job.uploadStartedAt)
    return left > 0 ? Math.ceil(left / 1000) : null
  }

  /** Helper : modification journal (sans fichier). */
  function enqueueJournalTask(spec) {
    return enqueue({
      kind: 'journal',
      abortable: false,
      hasFile: false,
      estimateMs: TASK_ESTIMATE_MS.journal,
      fileCount: 0,
      ...spec
    })
  }

  return {
    jobs,
    visibleJobs,
    activeJobs,
    hasActive,
    enqueue,
    enqueueJournalTask,
    cancel,
    retry,
    dismiss,
    isBusy,
    activeMeta,
    etaSeconds
  }
})
