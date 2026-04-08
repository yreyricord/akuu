<template>
  <div
    class="frise-visual-root w-full"
    :class="[rootAlignClass, rootMaxWidthClass]"
  >
    <!-- Aucune image : placeholder numéroté -->
    <div
      v-if="displayImages.length === 0"
      class="frise-visual-frame rounded-2xl overflow-hidden border shadow-md transition-[opacity,transform] duration-[0.55s] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 border-night/10 ring-1 ring-black/[0.03]"
      :class="[
        revealed ? 'frise-visual--in opacity-100' : 'frise-visual--out opacity-0',
        entranceClass
      ]"
    >
      <div
        class="aspect-[4/3] relative bg-gradient-to-br from-night/[0.06] via-forest/[0.05] to-bleu/[0.06]"
        aria-hidden="true"
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center gap-1 border border-dashed border-night/10 bg-white/40"
        >
          <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-night/30">
            {{ $t('common.frise_visual_placeholder_kicker') }}
          </span>
          <span
            class="text-5xl sm:text-6xl font-black font-serif tabular-nums leading-none text-night/[0.14] select-none"
            aria-hidden="true"
          >
            {{ number }}
          </span>
        </div>
      </div>
    </div>

    <!-- Une ou plusieurs images -->
    <div
      v-else
      :class="imagesWrapperClass"
    >
      <div
        v-for="(img, i) in displayImages"
        :key="`${img.src}-${i}`"
        class="frise-visual-frame overflow-hidden border shadow-md border-night/10 ring-1 ring-black/[0.03] transition-[opacity,transform] duration-[0.5s] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200"
        :class="[
          isMulti ? 'rounded-xl frise-visual-multi' : 'rounded-2xl',
          revealed ? 'frise-visual--in opacity-100' : 'frise-visual--out opacity-0',
          isMulti ? '' : entranceClass
        ]"
        :style="staggerStyle(i)"
      >
        <div
          class="aspect-[4/3] relative bg-gradient-to-br from-night/[0.06] via-forest/[0.05] to-bleu/[0.06]"
        >
          <button
            type="button"
            class="group/frise absolute inset-0 block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            :aria-label="$t('common.team_lightbox_expand')"
            :aria-expanded="lightboxOpen"
            aria-haspopup="dialog"
            @click="openLightbox(img)"
          >
            <img
              :src="img.src"
              :alt="img.alt || fallbackAlt"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/frise:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
            <span
              class="pointer-events-none absolute inset-0 bg-night/0 transition-colors duration-300 ease-out group-hover/frise:bg-night/20 group-focus-visible/frise:bg-night/25"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>

    <ImagePreviewLightbox
      v-model="lightboxOpen"
      :image-src="lightboxSrc"
      :image-alt="lightboxAlt"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ImagePreviewLightbox from '@/components/shared/ImagePreviewLightbox.vue'

const props = defineProps({
  /** Afficher l’animation (ex. quand le colibri a atteint cette étape au scroll) */
  revealed: { type: Boolean, default: false },
  /** Numéro 1-based pour repérer la future photo */
  number: { type: Number, required: true },
  /** Image unique (rétrocompat) */
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  /** Plusieurs images : { src, alt? }[], prioritaire sur src */
  images: { type: Array, default: () => [] },
  /**
   * Côté de la colonne visuel par rapport au fil :
   * - right : colonne à droite du trait (carte texte à gauche) → entrée depuis la gauche
   * - left : colonne à gauche du trait → entrée depuis la droite
   * - below : sous la carte (mobile) → entrée depuis le haut
   */
  side: {
    type: String,
    default: 'right',
    validator: (v) => ['left', 'right', 'below'].includes(v)
  }
})

const { t } = useI18n()

const lightboxOpen = ref(false)
const lightboxSrc = ref('')
const lightboxAlt = ref('')

const fallbackAlt = computed(() =>
  t('common.frise_visual_placeholder_alt', { n: props.number })
)

function openLightbox (img) {
  lightboxSrc.value = img.src
  lightboxAlt.value = (img.alt && img.alt.trim()) || fallbackAlt.value
  lightboxOpen.value = true
}

const displayImages = computed(() => {
  const list = Array.isArray(props.images) ? props.images : []
  const fromProp = list
    .map((im) => ({
      src: typeof im?.src === 'string' ? im.src.trim() : '',
      alt: typeof im?.alt === 'string' ? im.alt.trim() : ''
    }))
    .filter((im) => im.src)
  if (fromProp.length) return fromProp
  if (props.src?.trim()) return [{ src: props.src.trim(), alt: props.alt?.trim() || '' }]
  return []
})

const isMulti = computed(() => displayImages.value.length > 1)

const rootAlignClass = computed(() => {
  if (props.side === 'below') return 'mx-auto'
  return props.side === 'right' ? 'md:mr-auto md:ml-0' : 'md:ml-auto md:mr-0'
})

const rootMaxWidthClass = computed(() => {
  const n = displayImages.value.length
  if (n <= 1) return 'max-w-[min(100%,280px)]'
  if (n === 2) return 'max-w-[min(100%,380px)]'
  if (n <= 4) return 'max-w-[min(100%,440px)]'
  return 'max-w-[min(100%,min(540px,calc(100vw-2rem)))]'
})

const imagesWrapperClass = computed(() => {
  if (!isMulti.value) return ''
  return 'grid grid-cols-2 gap-2.5 w-full'
})

const entranceClass = computed(() => {
  if (props.side === 'below') return 'frise-visual-side-below'
  return props.side === 'right' ? 'frise-visual-side-right' : 'frise-visual-side-left'
})

function staggerStyle(i) {
  if (!props.revealed) return { transitionDelay: '0ms' }
  const delay = Math.min(i, 14) * 72
  return { transitionDelay: `${delay}ms` }
}
</script>

<style scoped>
/* Image unique : léger décalage depuis le fil (desktop) ou depuis le haut (mobile) */
.frise-visual-side-right.frise-visual--out {
  transform: translate3d(-0.85rem, 0, 0) scale(0.94);
}
.frise-visual-side-right.frise-visual--in {
  transform: translate3d(0, 0, 0) scale(1);
}

.frise-visual-side-left.frise-visual--out {
  transform: translate3d(0.85rem, 0, 0) scale(0.94);
}
.frise-visual-side-left.frise-visual--in {
  transform: translate3d(0, 0, 0) scale(1);
}

.frise-visual-side-below.frise-visual--out {
  transform: translate3d(0, 0.65rem, 0) scale(0.96);
}
.frise-visual-side-below.frise-visual--in {
  transform: translate3d(0, 0, 0) scale(1);
}

/* Grille : apparition en cascade (léger slide + scale) */
.frise-visual-multi.frise-visual--out {
  transform: translate3d(0, 0.5rem, 0) scale(0.94);
}
.frise-visual-multi.frise-visual--in {
  transform: translate3d(0, 0, 0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .frise-visual-frame {
    transition-duration: 0.2s;
    transition-property: opacity;
    transition-delay: 0ms !important;
  }
  .frise-visual-side-right.frise-visual--out,
  .frise-visual-side-left.frise-visual--out,
  .frise-visual-side-below.frise-visual--out,
  .frise-visual-side-right.frise-visual--in,
  .frise-visual-side-left.frise-visual--in,
  .frise-visual-side-below.frise-visual--in,
  .frise-visual-multi.frise-visual--out,
  .frise-visual-multi.frise-visual--in {
    transform: none;
  }
}
</style>
