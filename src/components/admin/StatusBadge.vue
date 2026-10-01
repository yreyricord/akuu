<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
    :class="[badgeClass, compact ? 'text-[9px] px-1.5' : '']"
  >
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'unknown' },
  label: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})

const badgeClass = computed(() => {
  const s = props.status
  if (s === 'ok') return 'bg-leaf/15 text-forest'
  if (s === 'warning') return 'bg-ochre-100 text-ochre-800'
  if (s === 'error') return 'bg-terracotta/15 text-terracotta-700'
  return 'bg-night-100 text-night-400'
})

const displayLabel = computed(() => {
  if (props.label) return props.label
  const map = { ok: 'OK', warning: 'Attention', error: 'Erreur', unknown: '—' }
  return map[props.status] ?? props.status
})
</script>
