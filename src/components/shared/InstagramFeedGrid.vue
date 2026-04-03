<template>
  <div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <a
        v-for="post in posts"
        :key="post.id"
        :href="post.permalink"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative aspect-square rounded-2xl overflow-hidden shadow-md border border-night/[0.06] bg-night/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
      >
        <img
          :src="post.imageUrl"
          :alt="post.captionAlt"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <span
          class="absolute inset-0 bg-gradient-to-t from-night/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </a>
    </div>
    <p class="mt-6 text-center">
      <a
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm font-semibold text-forest hover:text-forest/80 underline underline-offset-2"
      >
        {{ seeAllLabel }}
      </a>
    </p>
  </div>
</template>

<script setup>
defineProps({
  posts: { type: Array, required: true },
  profileUrl: { type: String, required: true },
  seeAllLabel: { type: String, required: true }
})
</script>
