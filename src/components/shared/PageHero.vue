<template>
  <section class="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
    <img
      :src="image"
      :alt="title"
      class="absolute inset-0 w-full h-full object-cover"
      loading="eager"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-night/60 via-night/40 to-night/70" />
    <div class="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 text-balance">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-lg md:text-xl text-white/80">
        {{ subtitle }}
      </p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, default: '/images/hero-amazon.jpg' }
})
</script>
