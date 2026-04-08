<template>
  <div class="video-embed rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]">
    <div class="relative w-full" style="padding-bottom: 56.25%;">
      <iframe
        :src="embedSrc"
        :title="iframeTitle"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
      />
    </div>
    <div v-if="caption" class="px-5 py-3 bg-white">
      <p class="text-sm text-night/50">{{ caption }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  videoId: { type: String, required: true },
  /** Démarrage en secondes (équivalent au paramètre &t= de l’URL YouTube). */
  startSeconds: { type: Number, default: undefined },
  title: { type: String, default: '' },
  caption: { type: String, default: '' }
})

const { t } = useI18n()
const iframeTitle = computed(() => props.title || t('common.youtube_video'))

const embedSrc = computed(() => {
  const id = encodeURIComponent(props.videoId)
  let url = `https://www.youtube.com/embed/${id}`
  const start = props.startSeconds
  if (start != null && Number(start) > 0) {
    url += `?start=${Math.floor(Number(start))}`
  }
  return url
})
</script>
