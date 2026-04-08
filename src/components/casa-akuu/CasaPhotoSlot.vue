<template>
  <div class="overflow-hidden rounded-2xl border border-night/[0.08] shadow-lg shadow-night/5 bg-night/[0.02]">
    <img
      :src="src"
      :alt="alt"
      class="w-full aspect-[4/3] object-cover"
      loading="lazy"
      decoding="async"
    />
  </div>
</template>

<script setup>
defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true }
})
</script>
