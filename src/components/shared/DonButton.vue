<template>
  <router-link
    to="/soutenir"
    class="inline-flex items-center gap-2 px-6 py-2.5 bg-leaf text-white font-semibold rounded-full hover:bg-forest transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
    :class="large ? '!px-8 !py-4 !text-base' : ''"
  >
    <svg v-if="showIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
    <span>{{ label || $t('donation.cta') }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  large: { type: Boolean, default: false },
  showIcon: { type: Boolean, default: true }
})
</script>
