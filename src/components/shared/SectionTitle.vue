<template>
  <div class="text-center mb-12 md:mb-16">
    <h2
      class="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4"
      :class="light ? 'text-white' : 'text-night'"
    >
      <slot />
    </h2>
    <div class="flex items-center justify-center gap-2 mb-4">
      <span class="block w-12 h-0.5 rounded-full" :class="light ? 'bg-leaf' : 'bg-forest'" />
      <svg class="w-5 h-5" :class="light ? 'text-leaf' : 'text-forest'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
      </svg>
      <span class="block w-12 h-0.5 rounded-full" :class="light ? 'bg-leaf' : 'bg-forest'" />
    </div>
    <p
      v-if="subtitle"
      class="text-lg max-w-2xl mx-auto"
      :class="light ? 'text-white/70' : 'text-night/60'"
    >
      {{ subtitle }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  subtitle: { type: String, default: '' },
  light: { type: Boolean, default: false }
})
</script>
