<template>
  <div class="group card overflow-hidden">
    <div class="relative aspect-square overflow-hidden">
      <img
        v-if="photo"
        :src="photo"
        :alt="`${prenom} ${nom}`"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div v-else class="w-full h-full bg-forest/10 flex items-center justify-center">
        <svg class="w-20 h-20 text-forest/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <p class="text-white/90 text-sm leading-relaxed">{{ bio }}</p>
        </div>
      </div>
    </div>
    <div class="p-4 text-center">
      <h3 class="font-serif font-bold text-night text-lg">{{ prenom }} {{ nom }}</h3>
      <p class="text-forest text-sm font-medium">{{ role }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  role: { type: String, required: true },
  photo: { type: String, required: true },
  bio: { type: String, default: '' }
})
</script>
