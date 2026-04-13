import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Scroll-driven "expanding card" effect (à la Anthropic).
 * The element starts as an inset rounded card and expands to full-bleed
 * once you've scrolled through it.
 *
 * ── TIMING ───────────────────────────────────────────────────────────
 *  progress = 0  →  bottom of banner is at the bottom of the viewport
 *                    (you've just finished seeing the whole section)
 *  progress = 1  →  you've scrolled `triggerPx` further past that point
 *
 * ── TUNABLE PARAMETERS ──────────────────────────────────────────────
 * @param {import('vue').Ref<HTMLElement|null>} elRef  template ref
 * @param {object}  [opts]
 * @param {number}  [opts.maxRadius=24]     border-radius at progress 0 (px)
 * @param {number}  [opts.maxMarginVw=3]   horizontal margin at progress 0,
 *                                          expressed as a % of viewport width
 * @param {number}  [opts.offsetVh=0]      decale le debut de l'animation
 *                                          (en % de la hauteur du viewport) :
 *                                           > 0 → commence plus tot
 *                                           < 0 → commence plus tard
 * @param {number}  [opts.triggerVh=30]    distance de scroll sur laquelle
 *                                          l'expansion se fait (en % de la
 *                                          hauteur du viewport)
 */
export function useScrollExpand(elRef, opts = {}) {
  const {
    maxRadius = 15,
    maxMarginVw = 4,
    offsetVh = 20,
    triggerVh = 70
  } = opts

  const progress = ref(0)
  let raf = null

  function update() {
    if (!elRef.value) return
    const rect = elRef.value.getBoundingClientRect()
    const vh = window.innerHeight
    const offset = vh * (offsetVh / 100)
    const trigger = vh * (triggerVh / 100)
    const raw = (vh - rect.bottom + offset) / trigger
    progress.value = Math.max(0, Math.min(1, raw))
  }

  function onScroll() {
    if (raf != null) return
    raf = requestAnimationFrame(() => {
      raf = null
      update()
    })
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    requestAnimationFrame(update)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (raf != null) cancelAnimationFrame(raf)
  })

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  const expandStyle = computed(() => {
    const p = easeOut(progress.value)
    const radius = maxRadius * (1 - p)
    const marginVw = maxMarginVw * (1 - p)
    return {
      borderRadius: `${radius}px`,
      marginLeft: `${marginVw}vw`,
      marginRight: `${marginVw}vw`
    }
  })

  return { progress, expandStyle }
}
