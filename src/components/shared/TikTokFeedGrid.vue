<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="v in videos"
        :key="v.id"
        class="rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]"
      >
        <div class="relative w-full max-w-[400px] mx-auto bg-night">
          <div class="relative w-full" style="padding-bottom: 177.78%;">
            <iframe
              :src="`https://www.tiktok.com/player/v1/${v.id}?music_info=1&description=1`"
              :title="v.title || 'TikTok'"
              class="absolute inset-0 w-full h-full border-0"
              allowfullscreen
              loading="lazy"
            />
          </div>
        </div>
        <div v-if="v.share_url" class="px-4 py-3 bg-white border-t border-night/[0.06] text-center">
          <a
            :href="v.share_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs font-semibold text-forest hover:text-forest/80"
          >
            {{ openOnTikTokLabel }}
          </a>
        </div>
      </div>
    </div>
    <p v-if="profileUrl" class="mt-8 text-center">
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
  videos: { type: Array, required: true },
  profileUrl: { type: String, default: '' },
  seeAllLabel: { type: String, required: true },
  openOnTikTokLabel: { type: String, required: true }
})
</script>
