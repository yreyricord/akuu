<template>
  <div class="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-24 text-center">
    <template v-if="isError">
      <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6"><PhWarning :size="32" weight="duotone" class="text-red-500" /></div>
      <h1 class="text-4xl font-serif font-bold text-night mb-4">{{ $t('merci.error_title') }}</h1>
      <p class="text-night/60 max-w-md text-lg leading-relaxed mb-8">{{ $t('merci.error_text') }}</p>
    </template>
    <template v-else>
      <div class="w-16 h-16 rounded-full bg-leaf/20 flex items-center justify-center mb-6"><PhLeaf :size="32" weight="duotone" class="text-forest" /></div>
      <h1 class="text-4xl font-serif font-bold text-night mb-4">{{ $t('merci.title') }}</h1>
      <p class="text-night/60 max-w-md text-lg leading-relaxed mb-8">{{ $t('merci.text') }}</p>
    </template>
    <router-link
      to="/soutenir?from=merci"
      class="inline-flex items-center gap-2 bg-forest text-white font-semibold px-6 py-3 rounded-2xl hover:bg-forest/90 transition-colors"
    >
      <PhArrowLeft :size="16" /> {{ $t('merci.back') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PhWarning, PhLeaf, PhArrowLeft } from '@phosphor-icons/vue'

const route = useRoute()
const isError = computed(() => {
  const code = route.query.code
  return code && code !== 'succeeded'
})
</script>
