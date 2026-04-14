<template>
  <router-link
    to="/soutenir"
    class="inline-flex items-center gap-2 px-6 py-2.5 bg-leaf text-white font-semibold rounded-full hover:bg-forest transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
    :class="large ? '!px-8 !py-4 !text-base' : ''"
  >
    <PhHeart v-if="showIcon" :size="16" weight="fill" />
    <span>{{ label || $t('donation.cta') }}</span>
  </router-link>
</template>

<script setup>
import { PhHeart } from '@phosphor-icons/vue'

defineProps({
  label: { type: String, default: '' },
  large: { type: Boolean, default: false },
  showIcon: { type: Boolean, default: true }
})
</script>
