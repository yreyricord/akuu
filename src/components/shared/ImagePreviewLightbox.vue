<template>
  <Teleport to="body">
    <Transition name="img-lb">
      <div
        v-if="modelValue && imageSrc"
        class="img-lb-root fixed inset-0 z-[200]"
        role="dialog"
        :aria-label="dialogAriaLabel"
        aria-modal="true"
      >
        <div
          class="img-lb-backdrop absolute inset-0 bg-night/85 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />
        <button
          ref="closeBtnRef"
          type="button"
          class="img-lb-close fixed right-5 top-5 z-[210] flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          :aria-label="$t('common.team_lightbox_close')"
          @click="close"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div
          class="relative z-10 flex min-h-full items-center justify-center px-5 py-16 md:px-10 md:py-20"
          @click.self="close"
        >
          <figure
            class="img-lb-panel w-max max-w-[min(100vw-2.5rem,1120px)]"
            @click.stop
          >
            <img
              :src="imageSrc"
              :alt="imageAlt || fallbackAlt"
              class="block max-h-[min(78vh,900px)] w-auto max-w-full rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]"
            />
            <div
              class="mx-auto mt-3 h-0.5 w-24 max-w-[40%] rounded-full bg-gradient-to-r from-forest via-bleu to-leaf opacity-90"
              aria-hidden="true"
            />
          </figure>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke } from '@vueuse/core'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  imageSrc: { type: String, default: '' },
  imageAlt: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const closeBtnRef = ref(null)

const fallbackAlt = computed(() => t('common.team_lightbox_expand'))

const dialogAriaLabel = computed(() =>
  props.imageAlt?.trim() ? props.imageAlt.trim() : fallbackAlt.value
)

function close () {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === 'undefined') return
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (open) {
      nextTick(() => closeBtnRef.value?.focus())
    }
  }
)

onKeyStroke('Escape', () => {
  if (props.modelValue) close()
})

onUnmounted(() => {
  if (typeof document !== 'undefined') document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.img-lb-enter-active,
.img-lb-leave-active {
  transition: opacity 0.28s ease;
}

.img-lb-enter-active .img-lb-backdrop,
.img-lb-leave-active .img-lb-backdrop {
  transition: opacity 0.32s ease;
}

.img-lb-enter-active .img-lb-panel,
.img-lb-leave-active .img-lb-panel {
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.32s ease;
}

.img-lb-enter-active .img-lb-close,
.img-lb-leave-active .img-lb-close {
  transition: opacity 0.22s ease;
}

.img-lb-enter-from,
.img-lb-leave-to {
  opacity: 0;
}

.img-lb-enter-from .img-lb-backdrop,
.img-lb-leave-to .img-lb-backdrop {
  opacity: 0;
}

.img-lb-enter-from .img-lb-panel,
.img-lb-leave-to .img-lb-panel {
  opacity: 0;
  transform: scale(0.97) translateY(0.5rem);
}

.img-lb-enter-from .img-lb-close,
.img-lb-leave-to .img-lb-close {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .img-lb-enter-active,
  .img-lb-leave-active,
  .img-lb-enter-active .img-lb-backdrop,
  .img-lb-leave-active .img-lb-backdrop,
  .img-lb-enter-active .img-lb-panel,
  .img-lb-leave-active .img-lb-panel,
  .img-lb-enter-active .img-lb-close,
  .img-lb-leave-active .img-lb-close {
    transition-duration: 0.01ms;
  }

  .img-lb-enter-from .img-lb-panel,
  .img-lb-leave-to .img-lb-panel {
    transform: none;
  }
}
</style>
