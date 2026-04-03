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
        <svg class="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
