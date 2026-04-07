<template>
  <a
    :href="url"
    :target="url.startsWith('http') ? '_blank' : undefined"
    :rel="url.startsWith('http') ? 'noopener noreferrer' : undefined"
    class="flex min-h-[5.5rem] items-center justify-center p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 md:hover:scale-[1.03] opacity-70 hover:opacity-100 min-w-0"
  >
    <img :src="logo" :alt="nom" class="max-h-12 max-w-[min(100%,9.5rem)] sm:max-h-14 sm:max-w-[160px] object-contain" loading="lazy" />
  </a>
</template>

<script setup>
defineProps({
  nom: { type: String, required: true },
  logo: { type: String, required: true },
  url: { type: String, default: '#' }
})
</script>
