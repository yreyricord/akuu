<template>
  <div
    class="grid md:grid-cols-12 gap-10 md:gap-14 lg:gap-16"
    :class="gridItemsAlignClass"
  >
    <div
      class="fade-in-up min-w-0"
      :class="[splitClasses.content, contentOrderClass]"
    >
      <slot />
    </div>
    <div
      class="fade-in-up min-w-0 musee-side-visual-wrap motion-safe:delay-150"
      :class="[
        splitClasses.visual,
        visualOrderClass,
        fillColumnHeight ? 'md:flex md:h-full md:min-h-0 md:flex-col' : ''
      ]"
    >
      <!-- intrinsic + align stretch : photo = toute la hauteur de la ligne (comme le bloc texte) -->
      <div
        v-if="intrinsicFrame && fillColumnHeight"
        class="relative w-full min-h-[12rem] max-h-[72vh] overflow-hidden rounded-2xl shadow-xl ring-1 ring-night/10 bg-night/5 md:max-h-none md:min-h-0 md:flex-1"
      >
        <img
          :src="visualSrc"
          :alt="visualAlt"
          class="musee-side-visual-img block h-52 w-full object-cover sm:h-60 md:absolute md:inset-0 md:h-full md:w-full md:max-h-none md:object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-forest/20 via-transparent to-leaf/10 opacity-80"
          aria-hidden="true"
        />
      </div>
      <!-- intrinsic classique : largeur colonne, hauteur = ratio du fichier -->
      <div
        v-else-if="intrinsicFrame"
        class="relative w-full rounded-2xl overflow-hidden shadow-xl ring-1 ring-night/10 bg-night/5"
      >
        <img
          :src="visualSrc"
          :alt="visualAlt"
          class="musee-side-visual-img block h-auto w-full max-w-none"
          :class="intrinsicImgMaxClass"
          loading="lazy"
          decoding="async"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-forest/20 via-transparent to-leaf/10 opacity-80"
          aria-hidden="true"
        />
      </div>
      <!-- Cadre à ratio fixe (paysage / portrait imposé) -->
      <div
        v-else
        class="relative w-full rounded-2xl overflow-hidden shadow-xl ring-1 ring-night/10 bg-night/5"
        :class="[aspectClass, maxHeightClass]"
      >
        <img
          :src="visualSrc"
          :alt="visualAlt"
          class="musee-side-visual-img absolute inset-0 m-auto h-full w-full max-h-full max-w-full"
          :class="visualFit === 'cover' ? 'object-cover' : 'object-contain'"
          loading="lazy"
          decoding="async"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-forest/20 via-transparent to-leaf/10 opacity-80"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visualSrc: { type: String, required: true },
  visualAlt: { type: String, required: true },
  visualLeft: { type: Boolean, default: false },
  /** Sur mobile, afficher la photo au-dessus du texte (ex. bloc Durée & tarifs). */
  leadVisualOnMobile: { type: Boolean, default: false },
  split: {
    type: String,
    default: '6-6',
    validator: (v) =>
      ['6-6', '5-7', '4-8', '7-5', '8-4', '9-3'].includes(v)
  },
  /**
   * aspect = rectangle imposé (visualAspect) ; contain/cover à l’intérieur.
   * intrinsic = le cadre suit les proportions du fichier (recommandé portrait sans bandes).
   */
  visualFrame: {
    type: String,
    default: 'aspect',
    validator: (v) => v === 'aspect' || v === 'intrinsic'
  },
  /** En mode aspect : cover remplit le cadre (défaut), contain évite le crop. */
  visualFit: {
    type: String,
    default: 'cover',
    validator: (v) => v === 'cover' || v === 'contain'
  },
  visualAspect: {
    type: String,
    default: 'responsive',
    validator: (v) =>
      [
        'responsive',
        'portrait',
        'portrait-tall',
        'portrait-hero',
        'landscape',
        'landscape-wide',
        'square',
        '4/3',
        '3/2',
        '16/9',
        '1/1',
        '3/4',
        '2/3',
        '9/16'
      ].includes(v)
  },
  visualMaxHeight: {
    type: String,
    default: 'none',
    validator: (v) =>
      ['none', 'xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  /** top | center | stretch — stretch = même hauteur que le texte (md+), photo en object-cover */
  align: {
    type: String,
    default: 'top',
    validator: (v) => v === 'top' || v === 'center' || v === 'stretch'
  }
})

const SPLIT_MAP = {
  '6-6': {
    content: 'col-span-12 md:col-span-6',
    visual: 'col-span-12 md:col-span-6'
  },
  '5-7': {
    content: 'col-span-12 md:col-span-5',
    visual: 'col-span-12 md:col-span-7'
  },
  '4-8': {
    content: 'col-span-12 md:col-span-4',
    visual: 'col-span-12 md:col-span-8'
  },
  '7-5': {
    content: 'col-span-12 md:col-span-7',
    visual: 'col-span-12 md:col-span-5'
  },
  '8-4': {
    content: 'col-span-12 md:col-span-8',
    visual: 'col-span-12 md:col-span-4'
  },
  '9-3': {
    content: 'col-span-12 md:col-span-9',
    visual: 'col-span-12 md:col-span-3'
  }
}

const ASPECT_MAP = {
  responsive: 'aspect-[4/3] lg:aspect-[3/2]',
  portrait: 'aspect-[3/4]',
  'portrait-tall': 'aspect-[2/3]',
  'portrait-hero': 'aspect-[9/16]',
  landscape: 'aspect-[4/3]',
  'landscape-wide': 'aspect-[16/9]',
  square: 'aspect-[1/1]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '1/1': 'aspect-[1/1]',
  '3/4': 'aspect-[3/4]',
  '2/3': 'aspect-[2/3]',
  '9/16': 'aspect-[9/16]'
}

const VISUAL_MAX_HEIGHT_MAP = {
  none: '',
  xs: 'max-h-[min(26svh,10.5rem)]',
  sm: 'max-h-[min(32svh,13rem)]',
  md: 'max-h-[min(40svh,17rem)]',
  lg: 'max-h-[min(48svh,21rem)]',
  xl: 'max-h-[min(56svh,26rem)]'
}

const splitClasses = computed(() => SPLIT_MAP[props.split] ?? SPLIT_MAP['6-6'])

const aspectClass = computed(() => ASPECT_MAP[props.visualAspect] ?? ASPECT_MAP.responsive)

const maxHeightClass = computed(
  () => VISUAL_MAX_HEIGHT_MAP[props.visualMaxHeight] ?? ''
)

const intrinsicFrame = computed(() => props.visualFrame === 'intrinsic')

const fillColumnHeight = computed(
  () => intrinsicFrame.value && props.align === 'stretch'
)

const contentOrderClass = computed(() => {
  if (props.leadVisualOnMobile) {
    return props.visualLeft ? 'order-2 md:order-2' : 'order-2 md:order-1'
  }
  return props.visualLeft ? 'md:order-2' : 'md:order-1'
})

const visualOrderClass = computed(() => {
  if (props.leadVisualOnMobile) {
    return props.visualLeft ? 'order-1 md:order-1' : 'order-1 md:order-2'
  }
  return props.visualLeft ? 'md:order-1' : 'md:order-2'
})

const gridItemsAlignClass = computed(() => {
  if (props.align === 'center') return 'items-center md:items-center'
  if (props.align === 'stretch') return 'items-stretch'
  return 'items-center md:items-start'
})

/** Plafond hauteur pour mode intrinsic (sans stretch). */
const intrinsicImgMaxClass = computed(() => {
  const fromProp = VISUAL_MAX_HEIGHT_MAP[props.visualMaxHeight]
  if (fromProp) return fromProp
  return 'max-h-[min(88svh,52rem)]'
})
</script>
