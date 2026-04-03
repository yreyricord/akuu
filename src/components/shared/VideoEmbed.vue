<template>
  <div class="video-embed rounded-2xl overflow-hidden shadow-xl bg-night/5 border border-night/[0.06]">
    <div class="relative w-full" style="padding-bottom: 56.25%;">
      <iframe
        :src="`https://www.youtube.com/embed/${videoId}`"
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
  title: { type: String, default: '' },
  caption: { type: String, default: '' }
})

const { t } = useI18n()
const iframeTitle = computed(() => props.title || t('common.youtube_video'))
</script>
