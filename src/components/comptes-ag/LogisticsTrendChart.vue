<template>
  <div>
    <div class="flex flex-wrap items-center gap-4 mb-4 text-xs text-night-400">
      <span class="inline-flex items-center gap-2">
        <i class="w-3 h-0.5 rounded bg-bleu block" aria-hidden="true" /> Site web et hébergement
      </span>
      <span class="inline-flex items-center gap-2">
        <i class="w-3 h-0.5 rounded bg-forest block" aria-hidden="true" /> Site + outils (hors banque)
      </span>
    </div>

    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full h-auto"
      role="img"
      aria-label="Baisse des frais de site web et d'outils numériques entre 2020 et 2026"
    >
      <g v-for="tick in yTicks" :key="tick">
        <line
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="yScale(tick)"
          :y2="yScale(tick)"
          stroke="#E8E4DC"
          stroke-width="1"
        />
        <text
          :x="padding.left - 8"
          :y="yScale(tick) + 4"
          text-anchor="end"
          class="fill-night-400 text-[10px] tabular-nums"
        >
          {{ tick }} €
        </text>
      </g>

      <polyline
        :points="polyline('web')"
        fill="none"
        stroke="#04488F"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        stroke-dasharray="6 4"
      />
      <polyline
        :points="polyline('webAndTools')"
        fill="none"
        stroke="#2D6A4F"
        stroke-width="3"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <g v-for="(point, index) in chartPoints" :key="point.year">
        <circle
          :cx="xScale(index)"
          :cy="yScale(point.webAndTools)"
          r="4.5"
          fill="#2D6A4F"
        />
        <text
          :x="xScale(index)"
          :y="height - 8"
          text-anchor="middle"
          class="fill-night-400 text-[10px] font-medium"
        >
          {{ point.year }}{{ point.projected ? '*' : '' }}
        </text>
      </g>
    </svg>

    <p class="mt-3 text-xs text-night-400 leading-relaxed">
      * 2026 : projection annuelle (banque prolongée), sur base constatée à fin septembre.
      La courbe verte regroupe site web et autres outils, hors frais bancaires.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
})

const width = 640
const height = 260
const padding = { top: 16, right: 16, bottom: 36, left: 48 }

const chartPoints = computed(() => props.history)

const maxValue = computed(() =>
  Math.max(...chartPoints.value.map((point) => point.webAndTools), 1)
)

const yMax = computed(() => Math.ceil(maxValue.value / 100) * 100)

const yTicks = computed(() => {
  const step = yMax.value <= 300 ? 50 : 100
  const ticks = []
  for (let value = 0; value <= yMax.value; value += step) {
    ticks.push(value)
  }
  return ticks
})

function xScale (index) {
  const innerWidth = width - padding.left - padding.right
  if (chartPoints.value.length <= 1) return padding.left + innerWidth / 2
  return padding.left + (innerWidth * index) / (chartPoints.value.length - 1)
}

function yScale (value) {
  const innerHeight = height - padding.top - padding.bottom
  return padding.top + innerHeight - (value / yMax.value) * innerHeight
}

function polyline (field) {
  return chartPoints.value
    .map((point, index) => `${xScale(index)},${yScale(point[field])}`)
    .join(' ')
}
</script>
