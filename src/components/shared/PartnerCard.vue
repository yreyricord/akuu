<template>
  <a
    :href="url"
    :target="url.startsWith('http') ? '_blank' : undefined"
    :rel="url.startsWith('http') ? 'noopener noreferrer' : undefined"
    class="flex items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 opacity-70 hover:opacity-100"
  >
    <img :src="logo" :alt="nom" class="max-h-14 max-w-[160px] object-contain" loading="lazy" />
  </a>
</template>

<script setup>
defineProps({
  nom: { type: String, required: true },
  logo: { type: String, required: true },
  url: { type: String, default: '#' }
})
</script>
