<template>
  <div class="rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]">
    <div v-if="videoId" class="relative w-full bg-night">
      <div class="relative w-full" style="padding-bottom: 177.78%;">
        <iframe
          :src="`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1&muted=1`"
          :title="title"
          class="absolute inset-0 w-full h-full border-0"
          allowfullscreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
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
        <PhTiktokLogo :size="32" weight="fill" class="text-white" aria-hidden="true" />
      </span>
      <span class="font-serif font-bold text-night text-lg">{{ ctaText }}</span>
      <span class="text-sm text-night/50">{{ hintText }}</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PhTiktokLogo } from '@phosphor-icons/vue'

const props = defineProps({
  videoUrl: { type: String, default: '' },
  profileUrl: { type: String, required: true },
  title: { type: String, default: 'TikTok' },
  ctaText: { type: String, required: true },
  hintText: { type: String, default: '' }
})

const videoId = computed(() => {
  const s = String(props.videoUrl || '').trim().split('?')[0]
  if (!s) return ''
  if (/^\d+$/.test(s)) return s
  const m = s.match(/(?:video|photo)\/(\d+)/)
  return m ? m[1] : ''
})
</script>
