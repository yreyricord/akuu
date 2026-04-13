<template>
  <div class="photo-gallery-root">
    <!-- En-tête optionnel : styles scoped en dur (ne dépend pas de Tailwind pour le titre) -->
    <header v-if="headlineTitle" class="pg-head">
      <p v-if="headlineKicker" class="pg-head__kicker">{{ headlineKicker }}</p>
      <h2 class="pg-head__title">{{ headlineTitle }}</h2>
      <p v-if="headlineSubtitle" class="pg-head__sub">{{ headlineSubtitle }}</p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        v-for="(photo, index) in photos"
        :key="index"
        @click="openLightbox(index)"
        class="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
      >
        <img
          :src="photo.src"
          :alt="photo.alt || ''"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-night/0 group-hover:bg-night/30 transition-colors duration-300 flex items-center justify-center">
          <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="lightboxOpen"
          id="lightbox-panel"
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-[100] bg-night/95 flex items-center justify-center p-4"
          @click.self="closeLightbox"
        >
          <button ref="closeBtn" @click="closeLightbox" class="absolute top-4 right-4 text-white/80 hover:text-white p-2" :aria-label="t('lightbox.close')">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button v-if="photos.length > 1" @click="prev" class="absolute left-4 text-white/80 hover:text-white p-2" :aria-label="t('lightbox.previous')">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            :src="photos[currentIndex]?.src"
            :alt="photos[currentIndex]?.alt || ''"
            class="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
          <button v-if="photos.length > 1" @click="next" class="absolute right-4 text-white/80 hover:text-white p-2" :aria-label="t('lightbox.next')">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Compteur + barre de progression -->
          <div v-if="photos.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span class="text-white/60 text-xs font-medium tabular-nums">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </span>
            <div class="flex gap-1">
              <button
                v-for="(_, i) in photos"
                :key="i"
                @click="currentIndex = i"
                class="h-0.5 rounded-full transition-all duration-300"
                :class="i === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'"
                :aria-label="t('lightbox.photo_n', { n: i + 1 })"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  photos: { type: Array, required: true },
  headlineKicker: { type: String, default: '' },
  headlineTitle: { type: String, default: '' },
  headlineSubtitle: { type: String, default: '' }
})

const lightboxOpen = ref(false)
const currentIndex = ref(0)
const closeBtn = ref(null)

function handleKey(e) {
  if (e.key === 'Escape') { closeLightbox(); return }
  if (e.key === 'ArrowLeft')  { prev(); return }
  if (e.key === 'ArrowRight') { next(); return }
  // Focus trap: keep Tab within the lightbox
  if (e.key === 'Tab') {
    const lightbox = document.getElementById('lightbox-panel')
    if (!lightbox) return
    const focusable = Array.from(lightbox.querySelectorAll('button'))
    if (!focusable.length) return
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus() }
    }
  }
}

async function openLightbox(index) {
  currentIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKey)
  await nextTick()
  closeBtn.value?.focus()
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKey)
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + props.photos.length) % props.photos.length
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.photos.length
}
</script>

<style scoped>
/* Forcer la typo du titre : indépendant de l’ordre / purge Tailwind */
.pg-head {
  text-align: center;
  margin-bottom: 2.5rem;
}

@media (min-width: 768px) {
  .pg-head {
    margin-bottom: 3.5rem;
  }
}

.pg-head__kicker {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #2d6915;
  margin: 0 0 1rem;
}

.pg-head__title {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.875rem, 5.5vw, 3rem);
  font-weight: 700;
  color: #171a1a;
  line-height: 1.12;
  margin: 0 0 1.25rem;
}

.pg-head__sub {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: #5c6060;
  max-width: 42rem;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .pg-head__sub {
    font-size: 1.125rem;
  }
}
</style>
