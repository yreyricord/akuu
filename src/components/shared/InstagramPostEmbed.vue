<template>
  <div class="rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]">
    <div v-if="embed" class="relative w-full bg-white">
      <iframe
        :src="embed.src"
        :title="title"
        class="w-full border-0 block"
        style="min-height: 540px;"
        loading="lazy"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
    <a
      v-else
      :href="profileUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex flex-col items-center justify-center gap-4 min-h-[280px] px-8 py-12 bg-gradient-to-br from-forest/5 to-night/[0.04] hover:from-forest/10 transition-colors text-center group"
    >
      <span class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <PhInstagramLogo :size="36" weight="fill" class="text-white" aria-hidden="true" />
      </span>
      <span class="font-serif font-bold text-night text-lg">{{ ctaText }}</span>
      <span class="text-sm text-night/50">{{ hintText }}</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PhInstagramLogo } from '@phosphor-icons/vue'

const props = defineProps({
  source: { type: String, default: '' },
  profileUrl: { type: String, required: true },
  title: { type: String, default: 'Instagram' },
  ctaText: { type: String, required: true },
  hintText: { type: String, default: '' }
})

function parseInstagramSource(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const reel = s.match(/instagram\.com\/(?:reel|reels)\/([^/?#]+)/i)
  if (reel) return { type: 'reel', code: reel[1] }
  const post = s.match(/instagram\.com\/p\/([^/?#]+)/i)
  if (post) return { type: 'post', code: post[1] }
  if (/^[A-Za-z0-9_-]+$/.test(s)) return { type: 'post', code: s }
  return null
}

const embed = computed(() => {
  const parsed = parseInstagramSource(props.source)
  if (!parsed) return null
  const path = parsed.type === 'reel' ? 'reel' : 'p'
  return {
    src: `https://www.instagram.com/${path}/${parsed.code}/embed/`
  }
})
</script>
