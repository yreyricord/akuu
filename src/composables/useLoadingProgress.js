import { reactive, watch, onUnmounted } from 'vue'

/**
 * Progression estimée (0–100) pour les appels Google Apps Script sans vrai % serveur.
 * - start() : courbe temps jusqu'à ~90 %
 * - setStep(n, total) : étapes explicites
 * - complete() : montée finale puis 100 %
 */
export function useLoadingProgress(options = {}) {
  const estimateMs = options.estimateMs ?? 22_000
  const state = reactive({
    progress: 0,
    stepLabel: options.label ?? ''
  })

  let timer = null
  let startedAt = 0
  let rampFrame = null

  function tick() {
    const elapsed = Date.now() - startedAt
    const t = Math.min(elapsed / estimateMs, 1)
    const eased = 1 - Math.pow(1 - t, 2.2)
    const next = Math.round(eased * 90)
    if (next > state.progress) state.progress = next
  }

  function start(label) {
    stop()
    cancelRamp()
    startedAt = Date.now()
    state.progress = 5
    if (label != null) state.stepLabel = label
    tick()
    timer = setInterval(tick, 120)
  }

  function setStep(current, total, label) {
    if (total > 0) {
      const pct = Math.round((current / total) * 92)
      state.progress = Math.max(state.progress, Math.min(pct, 92))
    }
    if (label != null) state.stepLabel = label
  }

  function cancelRamp() {
    if (rampFrame) {
      cancelAnimationFrame(rampFrame)
      rampFrame = null
    }
  }

  /** Montée visuelle même si la réponse réseau arrive très vite. */
  function complete() {
    stop()
    cancelRamp()
    const from = state.progress
    const elapsed = Date.now() - startedAt
    const needsRamp = elapsed < 1500 && from < 88

    if (!needsRamp) {
      state.progress = 100
      return
    }

    const rampStart = Date.now()
    const rampMs = Math.max(600, 1500 - elapsed)
    const target = 92

    function ramp() {
      const t = Math.min((Date.now() - rampStart) / rampMs, 1)
      state.progress = Math.round(from + (target - from) * t)
      if (t < 1) {
        rampFrame = requestAnimationFrame(ramp)
      } else {
        rampFrame = null
        state.progress = 100
      }
    }
    rampFrame = requestAnimationFrame(ramp)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function reset() {
    stop()
    cancelRamp()
    state.progress = 0
    state.stepLabel = options.label ?? ''
  }

  onUnmounted(() => {
    stop()
    cancelRamp()
  })

  return {
    get progress() { return state.progress },
    get stepLabel() { return state.stepLabel },
    start,
    setStep,
    complete,
    reset,
    stop,
    /** Objet réactif — à utiliser dans les templates (:progress="lp.progress"). */
    state
  }
}

/** Lie une ref `loading` au composable (démarrage / fin automatiques). */
export function bindLoadingProgress(loadingRef, options = {}) {
  const lp = useLoadingProgress(options)
  watch(
    loadingRef,
    (active) => {
      if (active) lp.start(options.label)
      else {
        lp.complete()
        setTimeout(() => lp.reset(), 700)
      }
    },
    { immediate: true }
  )
  return lp.state
}
