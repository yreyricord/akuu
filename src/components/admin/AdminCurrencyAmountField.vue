<template>
  <label class="block space-y-1.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-sm font-medium text-night">{{ label }}</span>
      <div
        class="inline-flex rounded-full border border-night-200 bg-cream p-0.5 text-xs font-semibold"
        role="group"
        aria-label="Devise"
      >
        <button
          v-for="opt in CURRENCY_OPTIONS"
          :key="opt.code"
          type="button"
          class="rounded-full px-3 py-1 transition"
          :class="currency === opt.code ? 'bg-forest text-white shadow-sm' : 'text-night-500 hover:text-forest'"
          :disabled="disabled || currencyLocked"
          @click="setCurrency(opt.code)"
        >
          {{ opt.short }}
        </button>
      </div>
    </div>
    <input
      :value="modelValue"
      type="number"
      min="0.01"
      :max="max"
      step="0.01"
      required
      inputmode="decimal"
      class="admin-input"
      :class="inputClass"
      :disabled="disabled"
      :placeholder="currency === CURRENCY_EUR ? 'Ex. 45.00' : 'Ex. 200.00'"
      @input="onInput"
    />
    <p v-if="conversionPreview != null" class="text-xs text-night-400">
      ≈ {{ conversionPreview }} (taux {{ rateLabel }})
    </p>
    <slot />
  </label>
</template>

<script setup>
import { computed } from 'vue'
import { CURRENCY_EUR, CURRENCY_OPTIONS, CURRENCY_PEN, normalizeCurrency } from '@/data/currency.js'
import { formatEur, formatPen } from '@/data/tresorerie-config.js'
import { eurToPen, penToEur } from '@/api/tresorerie/exchangeRate.js'

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  currency: { type: String, default: CURRENCY_PEN },
  label: { type: String, default: 'Montant estimé *' },
  rate: { type: Number, default: null },
  rateSource: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  currencyLocked: { type: Boolean, default: false },
  max: { type: Number, default: undefined },
  inputClass: { type: [String, Object, Array], default: '' }
})

const emit = defineEmits(['update:modelValue', 'update:currency'])

const conversionPreview = computed(() => {
  const amount = Number(props.modelValue)
  const rate = props.rate
  if (!Number.isFinite(amount) || amount <= 0 || !rate) return null
  if (normalizeCurrency(props.currency) === CURRENCY_EUR) {
    return formatPen(eurToPen(amount, rate))
  }
  return formatEur(penToEur(amount, rate))
})

const rateLabel = computed(() => {
  if (!props.rate) return '—'
  const src = props.rateSource ? ` · ${props.rateSource}` : ''
  return `${props.rate.toFixed(4)}${src}`
})

function setCurrency(code) {
  if (props.disabled || props.currencyLocked) return
  emit('update:currency', code)
}

function onInput(e) {
  const v = e.target.value
  emit('update:modelValue', v === '' ? null : Number(v))
}
</script>
