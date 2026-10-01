<template>
  <span
    v-if="status && status !== 'not_required'"
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { DEVIS_STATUSES, initialDevisStatus, requiresDevisAttachments } from '@/data/tresorerie-config.js'

const props = defineProps({
  demande: { type: Object, required: true }
})

const status = computed(() => {
  if (!requiresDevisAttachments(props.demande.amount_pen_estimated)) return 'not_required'
  return props.demande.devis_status || initialDevisStatus(props.demande.amount_pen_estimated)
})

const meta = computed(() => DEVIS_STATUSES[status.value] ?? { label: status.value, color: 'night' })
const label = computed(() => meta.value.label)

const colorClass = computed(() => {
  const map = {
    leaf: 'bg-leaf/20 text-forest',
    ochre: 'bg-ochre/20 text-ochre-800',
    terracotta: 'bg-terracotta/15 text-terracotta-700',
    night: 'bg-night-100 text-night-500'
  }
  return map[meta.value.color] ?? map.night
})
</script>
