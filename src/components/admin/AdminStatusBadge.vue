<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { DEMANDE_STATUSES, FACTURE_STATUSES } from '@/data/tresorerie-config.js'

const props = defineProps({
  status: { type: String, required: true },
  type: { type: String, default: 'demande' }
})

const meta = computed(() => {
  const map = props.type === 'facture' ? FACTURE_STATUSES : DEMANDE_STATUSES
  return map[props.status] ?? { label: props.status, color: 'night' }
})

const label = computed(() => meta.value.label)

const colorClass = computed(() => {
  const c = meta.value.color
  const map = {
    leaf: 'bg-leaf/20 text-forest',
    ochre: 'bg-ochre/20 text-ochre-700',
    terracotta: 'bg-terracotta/15 text-terracotta-700',
    night: 'bg-night-100 text-night-500'
  }
  return map[c] ?? map.night
})
</script>
