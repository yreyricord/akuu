<template>
  <div class="group card overflow-hidden flex flex-col h-full">
    <div class="relative aspect-square overflow-hidden shrink-0">
      <button
        v-if="photo"
        type="button"
        class="group/photo relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        :aria-label="`${$t('common.team_learn_more')} – ${prenom} ${nom}`"
        :aria-expanded="lightboxOpen"
        aria-haspopup="dialog"
        @click="openLightbox"
      >
        <img
          :src="photo"
          :alt="`${prenom} ${nom}`"
          class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/photo:scale-[1.04]"
          loading="lazy"
        />
        <span
          class="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-bleu/55 via-night/45 to-night/5 opacity-0 transition-opacity duration-500 ease-out group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100"
          aria-hidden="true"
        />
        <span
          class="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
          aria-hidden="true"
        >
          <span
            class="flex translate-y-4 flex-col items-center gap-3 text-center opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/photo:translate-y-0 group-hover/photo:opacity-100 group-focus-visible/photo:translate-y-0 group-focus-visible/photo:opacity-100"
          >
            <span
              class="font-serif text-lg font-medium tracking-wide text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] md:text-xl"
            >
              {{ $t('common.team_learn_more') }}
            </span>
            <span class="h-px w-11 bg-gradient-to-r from-transparent via-white/65 to-transparent" />
            <PhCaretDown :size="14" class="mt-0.5 text-white/45" aria-hidden="true" />
          </span>
        </span>
      </button>
      <div v-else class="w-full h-full bg-forest/10 flex items-center justify-center">
        <PhUser :size="80" weight="duotone" class="text-forest/30" />
      </div>
    </div>
    <div class="p-4 text-center flex flex-col flex-1 min-h-0">
      <h3 class="font-serif font-bold text-night text-lg">{{ prenom }} {{ nom }}</h3>
      <p class="text-forest text-sm font-medium">{{ role }}</p>
    </div>

    <Teleport to="body">
      <Transition name="team-lb">
        <div
          v-if="lightboxOpen && photo"
          class="team-lb-root fixed inset-0 z-[200] flex flex-col"
          role="dialog"
          :aria-labelledby="titleId"
          aria-modal="true"
        >
          <div
            class="absolute inset-0 bg-night/88 backdrop-blur-md team-lb-backdrop"
            aria-hidden="true"
            @click="closeLightbox"
          />
          <button
            ref="closeBtnRef"
            type="button"
            class="team-lb-close relative z-10 mx-auto mt-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
            :aria-label="$t('common.team_lightbox_close')"
            @click="closeLightbox"
          >
            <PhX :size="20" weight="bold" />
          </button>
          <div
            class="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-10 pt-4 md:px-8 md:pb-12"
            @click.self="closeLightbox"
          >
            <div
              class="team-lb-panel w-full max-w-4xl overflow-hidden rounded-2xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/15"
              @click.stop
            >
              <div class="bg-night/40">
                <img
                  :src="photo"
                  :alt="`${prenom} ${nom}`"
                  class="max-h-[min(62vh,720px)] w-full object-contain"
                />
              </div>
              <div class="bg-bleu px-5 py-5 text-center md:px-8 md:py-7">
                <h3 :id="titleId" class="font-serif text-2xl font-bold text-white md:text-3xl">
                  {{ prenom }} {{ nom }}
                </h3>
                <p class="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-bleu-pur md:text-sm">
                  {{ role }}
                </p>
                <p
                  v-if="bio"
                  class="mx-auto mt-4 max-w-2xl border-t border-white/15 pt-4 text-left text-sm leading-relaxed text-white/90 md:text-center"
                >
                  {{ bio }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { PhCaretDown, PhUser, PhX } from '@phosphor-icons/vue'

const props = defineProps({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  role: { type: String, required: true },
  photo: { type: String, default: '' },
  bio: { type: String, default: '' }
})

const lightboxOpen = ref(false)
const closeBtnRef = ref(null)
const titleId = `team-lb-title-${Math.random().toString(36).slice(2, 9)}`

function openLightbox () {
  if (!props.photo) return
  lightboxOpen.value = true
}

function closeLightbox () {
  lightboxOpen.value = false
}

watch(lightboxOpen, (open) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = open ? 'hidden' : ''
  if (open) {
    nextTick(() => closeBtnRef.value?.focus())
  }
})

onKeyStroke('Escape', () => {
  if (lightboxOpen.value) closeLightbox()
})

onUnmounted(() => {
  if (typeof document !== 'undefined') document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.team-lb-enter-active,
.team-lb-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.team-lb-enter-active .team-lb-backdrop,
.team-lb-leave-active .team-lb-backdrop {
  transition: opacity 0.35s ease;
}

.team-lb-enter-active .team-lb-panel,
.team-lb-leave-active .team-lb-panel {
  transition:
    transform 0.45s cubic-bezier(0.34, 1.18, 0.64, 1),
    opacity 0.35s ease;
}

.team-lb-enter-active .team-lb-close,
.team-lb-leave-active .team-lb-close {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.18, 0.64, 1);
}

.team-lb-enter-from,
.team-lb-leave-to {
  opacity: 0;
}

.team-lb-enter-from .team-lb-backdrop,
.team-lb-leave-to .team-lb-backdrop {
  opacity: 0;
}

.team-lb-enter-from .team-lb-panel,
.team-lb-leave-to .team-lb-panel {
  opacity: 0;
  transform: scale(0.9) translateY(1.25rem);
}

.team-lb-enter-from .team-lb-close,
.team-lb-leave-to .team-lb-close {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .team-lb-enter-active,
  .team-lb-leave-active,
  .team-lb-enter-active .team-lb-backdrop,
  .team-lb-leave-active .team-lb-backdrop,
  .team-lb-enter-active .team-lb-panel,
  .team-lb-leave-active .team-lb-panel,
  .team-lb-enter-active .team-lb-close,
  .team-lb-leave-active .team-lb-close {
    transition-duration: 0.01ms;
  }

  .team-lb-enter-from .team-lb-panel,
  .team-lb-leave-to .team-lb-panel {
    transform: none;
  }
}
</style>
