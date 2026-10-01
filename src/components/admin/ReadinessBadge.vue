<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wide"
    :class="[badgeClass, compact ? 'text-[9px]' : 'text-[10px]']"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'a_completer' },
  compact: { type: Boolean, default: false }
})

const label = computed(() => {
  const map = {
    pret: 'Clôturable',
    attention: 'Pièces à compléter',
    a_completer: 'Actions requises'
  }
  return map[props.status] || props.status
})

const badgeClass = computed(() => {
  const map = {
    pret: 'bg-leaf/15 text-forest',
    attention: 'bg-bleu/15 text-bleu',
    a_completer: 'bg-ochre-100 text-ochre-800'
  }
  return map[props.status] || 'bg-night-100 text-night-500'
})
</script>
