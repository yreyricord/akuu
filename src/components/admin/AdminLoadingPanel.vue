<template>
  <div
    v-if="variant === 'inline'"
    class="rounded-xl border border-night-100 bg-white px-4 py-3 shadow-sm"
    role="status"
    aria-live="polite"
    :aria-label="title"
    :aria-valuenow="displayProgress"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="flex items-center justify-between gap-3 text-sm">
      <span class="text-night-600">{{ title }}</span>
      <span class="shrink-0 tabular-nums font-semibold text-forest">{{ displayProgress }} %</span>
    </div>
    <p v-if="detail || stepLabel" class="mt-1 text-xs text-night-400">{{ stepLabel || detail }}</p>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200">
      <div
        class="h-full rounded-full bg-forest transition-[width] duration-300 ease-out"
        :style="{ width: displayProgress + '%' }"
      />
    </div>
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center rounded-2xl border border-night-100 bg-white px-6 py-12 shadow-sm"
    role="status"
    aria-live="polite"
    :aria-label="title"
    :aria-valuenow="displayProgress"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="relative h-10 w-10" aria-hidden="true">
      <div class="absolute inset-0 rounded-full border-[3px] border-forest/15" />
      <div
        class="absolute inset-0 rounded-full border-[3px] border-transparent border-t-forest transition-transform duration-300"
        :style="{ transform: `rotate(${displayProgress * 3.6}deg)` }"
      />
      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-forest">
        {{ displayProgress }}
      </span>
    </div>
    <p class="mt-4 text-center font-serif text-lg font-semibold text-forest-700">{{ title }}</p>
    <p v-if="detail" class="mt-2 max-w-md text-center text-sm leading-relaxed text-night-500">{{ detail }}</p>
    <p v-if="stepLabel" class="mt-1 max-w-md text-center text-xs text-night-400">{{ stepLabel }}</p>

    <div class="mt-5 w-full max-w-sm">
      <div class="mb-1.5 flex justify-between text-xs text-night-500">
        <span>Progression estimée</span>
        <span class="tabular-nums font-semibold text-forest">{{ displayProgress }} %</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-cream-200">
        <div
          class="h-full rounded-full bg-gradient-to-r from-forest to-leaf transition-[width] duration-300 ease-out"
          :style="{ width: displayProgress + '%' }"
        />
      </div>
    </div>

    <p v-if="hint" class="mt-3 text-center text-xs text-night-400">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed, toValue } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Chargement…' },
  detail: { type: String, default: '' },
  hint: { type: String, default: 'La première lecture peut prendre 10 à 30 secondes.' },
  /** 0–100 */
  progress: { type: Number, default: 0 },
  stepLabel: { type: String, default: '' },
  variant: { type: String, default: 'panel' }
})

const displayProgress = computed(() => {
  const n = Number(toValue(props.progress))
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
})
</script>
