<template>
  <div>
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
          class="fixed inset-0 z-[100] bg-night/95 flex items-center justify-center p-4"
          @click.self="closeLightbox"
        >
          <button @click="closeLightbox" class="absolute top-4 right-4 text-white/80 hover:text-white p-2" aria-label="Fermer">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button v-if="photos.length > 1" @click="prev" class="absolute left-4 text-white/80 hover:text-white p-2" aria-label="Précédent">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            :src="photos[currentIndex]?.src"
            :alt="photos[currentIndex]?.alt || ''"
            class="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
          <button v-if="photos.length > 1" @click="next" class="absolute right-4 text-white/80 hover:text-white p-2" aria-label="Suivant">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  photos: { type: Array, required: true }
})

const lightboxOpen = ref(false)
const currentIndex = ref(0)

function openLightbox(index) {
  currentIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + props.photos.length) % props.photos.length
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.photos.length
}
</script>
