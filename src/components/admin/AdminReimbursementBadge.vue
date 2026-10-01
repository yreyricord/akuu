<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { REIMBURSEMENT_STATUSES, normalizeFactureReimbursement } from '@/data/tresorerie-config.js'

const props = defineProps({
  facture: { type: Object, required: true }
})

const status = computed(() => normalizeFactureReimbursement(props.facture).reimbursement_status)

const meta = computed(() => REIMBURSEMENT_STATUSES[status.value] ?? { label: status.value, color: 'night' })

const label = computed(() => meta.value.label)

const colorClass = computed(() => {
  const map = {
    leaf: 'bg-leaf/20 text-forest',
    ochre: 'bg-ochre/20 text-ochre-800',
    bleu: 'bg-bleu/15 text-bleu',
    night: 'bg-night-100 text-night-400'
  }
  return map[meta.value.color] ?? map.night
})
</script>
