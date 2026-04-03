<template>
  <div class="rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]">
    <div v-if="videoId" class="relative w-full max-w-[420px] mx-auto bg-night">
      <div class="relative w-full" style="padding-bottom: 177.78%;">
        <iframe
          :src="`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`"
          :title="title"
          class="absolute inset-0 w-full h-full border-0"
          allowfullscreen
          loading="lazy"
        />
      </div>
    </div>
    <a
      v-else
      :href="profileUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex flex-col items-center justify-center gap-4 min-h-[280px] px-8 py-12 bg-gradient-to-br from-night/[0.06] to-forest/5 hover:to-forest/10 transition-colors text-center group"
    >
      <span class="w-16 h-16 rounded-2xl bg-night flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      </span>
      <span class="font-serif font-bold text-night text-lg">{{ ctaText }}</span>
      <span class="text-sm text-night/50">{{ hintText }}</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  videoUrl: { type: String, default: '' },
  profileUrl: { type: String, required: true },
  title: { type: String, default: 'TikTok' },
  ctaText: { type: String, required: true },
  hintText: { type: String, default: '' }
})

const videoId = computed(() => {
  const s = String(props.videoUrl || '').trim()
  if (!s) return ''
  if (/^\d+$/.test(s)) return s
  const m = s.match(/video\/(\d+)/)
  return m ? m[1] : ''
})
</script>
