<template>
  <span
    class="inline-flex max-w-[12rem] items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight"
    :class="colorClass"
    :title="label"
  >
    {{ shortLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { PAYMENT_TYPES, labelFor } from '@/data/tresorerie-config.js'

const props = defineProps({
  paymentType: { type: String, default: '' }
})

const label = computed(() => labelFor(props.paymentType, PAYMENT_TYPES) || props.paymentType)

const shortLabel = computed(() => {
  const map = {
    avance_benevole: 'Avance bénévole',
    avance_asso: 'Avance asso',
    carte_asso: 'Carte AKUU'
  }
  return map[props.paymentType] ?? label.value
})

const colorClass = computed(() => {
  const map = {
    avance_benevole: 'bg-ochre/20 text-ochre-800',
    avance_asso: 'bg-bleu/15 text-bleu',
    carte_asso: 'bg-forest/10 text-forest'
  }
  return map[props.paymentType] ?? 'bg-night-100 text-night-500'
})
</script>
