<template>
  <div>
    <div class="flex flex-wrap items-center gap-4 mb-4 text-xs text-night-400">
      <span class="inline-flex items-center gap-2">
        <i class="w-3 h-0.5 rounded bg-forest block" aria-hidden="true" /> Ressources retenues
      </span>
      <span class="inline-flex items-center gap-2">
        <i class="w-3 h-0.5 rounded bg-terracotta block" aria-hidden="true" /> Dépenses
      </span>
      <span
        v-if="hasProjectedResources"
        class="inline-flex items-center gap-2"
      >
        <i
          class="w-3 h-0.5 rounded block border-t border-dashed border-bleu bg-transparent"
          aria-hidden="true"
        />
        Subvention Musée attendue (2025→2026)
      </span>
      <span
        v-if="covidBand"
        class="inline-flex items-center gap-2"
      >
        <i
          class="w-3 h-3 rounded-sm shrink-0 bg-night-400/15 border border-night-200"
          aria-hidden="true"
        />
        Covid-19 · activités en pause (2020–2023)
      </span>
    </div>

    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full h-auto"
      role="img"
      aria-label="Évolution des ressources et des dépenses par exercice"
    >
      <rect
        v-if="covidBand"
        :x="covidBand.x"
        :y="covidBand.y"
        :width="covidBand.width"
        :height="covidBand.height"
        fill="#64748B"
        fill-opacity="0.1"
        stroke="#94A3B8"
        stroke-width="1"
        stroke-dasharray="4 3"
        rx="4"
      />
      <text
        v-if="covidBand"
        :x="covidBand.x + covidBand.width / 2"
        :y="covidBand.y + 14"
        text-anchor="middle"
        class="fill-night-400 text-[9px] font-semibold uppercase tracking-[0.08em]"
      >
        Covid-19
      </text>

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
          {{ compactEuro(tick) }}
        </text>
      </g>

      <polyline
        :points="polyline(resourcesValues)"
        fill="none"
        stroke="#2D6A4F"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <polyline
        :points="polyline(debitsValues)"
        fill="none"
        stroke="#C8553D"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <g v-for="(point, index) in points" :key="point.year">
        <circle
          :cx="xScale(index)"
          :cy="yScale(point.resources)"
          r="4"
          fill="#2D6A4F"
        />
        <circle
          :cx="xScale(index)"
          :cy="yScale(point.debits)"
          r="4"
          fill="#C8553D"
        />
        <text
          :x="xScale(index)"
          :y="height - 8"
          text-anchor="middle"
          class="fill-night-400 text-[10px] font-medium"
        >
          {{ point.label }}
        </text>
      </g>

      <g v-if="projectionBridge">
        <line
          :x1="projectionBridge.x1"
          :y1="projectionBridge.y1"
          :x2="projectionBridge.x2"
          :y2="projectionBridge.y2"
          stroke="#2563EB"
          stroke-width="2.5"
          stroke-dasharray="5 4"
          stroke-linecap="round"
        />
        <circle
          :cx="projectionBridge.x2"
          :cy="projectionBridge.y2"
          r="5"
          fill="#EFF6FF"
          stroke="#2563EB"
          stroke-width="2"
          stroke-dasharray="3 2"
        />
      </g>
    </svg>

    <p
      v-if="projectionCaption"
      class="mt-3 text-xs text-night-400 leading-relaxed"
    >
      {{ projectionCaption }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    required: true
  }
})

const width = 760
const height = 280
const padding = { top: 16, right: 16, bottom: 36, left: 52 }

const COVID_START_YEAR = 2020
const COVID_END_YEAR = 2023

const yearStep = computed(() => {
  if (props.points.length <= 1) return 0
  return xScale(1) - xScale(0)
})

const covidBand = computed(() => {
  const startIndex = props.points.findIndex(
    (point) => point.year === COVID_START_YEAR
  )
  const endIndex = props.points.findIndex(
    (point) => point.year === COVID_END_YEAR
  )
  if (startIndex === -1 || endIndex === -1) return null

  const halfStep = yearStep.value / 2
  const innerTop = padding.top
  const innerHeight = height - padding.top - padding.bottom

  return {
    x: xScale(startIndex) - halfStep,
    y: innerTop,
    width: xScale(endIndex) - xScale(startIndex) + yearStep.value,
    height: innerHeight
  }
})

const projectedMarkers = computed(() =>
  props.points.flatMap((point, index) =>
    point.projectedResources != null ? [{ point, index }] : []
  )
)

const projectionBridge = computed(() => {
  const marker = projectedMarkers.value.at(-1)
  if (!marker || marker.index < 1) return null
  const origin = props.points[marker.index - 1]
  return {
    x1: xScale(marker.index - 1),
    y1: yScale(origin.resources),
    x2: xScale(marker.index),
    y2: yScale(marker.point.projectedResources)
  }
})

const hasProjectedResources = computed(() => Boolean(projectionBridge.value))

const projectionCaption = computed(() => {
  const marker = projectedMarkers.value.at(-1)
  if (!marker?.point.projectedResources) return ''
  const extra = marker.point.projectedResources - marker.point.resources
  return (
    `* Trait bleu pointillé de 2025 à 2026 : ${formatEuro(extra)} de subvention Musée attendue ` +
    `avant fin d'année (total projeté ${formatEuro(marker.point.projectedResources)}), ` +
    'non encore encaissée.'
  )
})

const maxValue = computed(() =>
  Math.max(
    ...props.points.flatMap((point) => [
      point.resources,
      point.debits,
      point.projectedResources ?? 0
    ]),
    1
  )
)

const yMax = computed(() => Math.ceil(maxValue.value / 5000) * 5000)

const yTicks = computed(() =>
  Array.from({ length: (yMax.value / 5000) + 1 }, (_, index) => index * 5000)
)

const resourcesValues = computed(() => props.points.map((point) => point.resources))
const debitsValues = computed(() => props.points.map((point) => point.debits))

function xScale (index) {
  const innerWidth = width - padding.left - padding.right
  if (props.points.length <= 1) return padding.left + innerWidth / 2
  return padding.left + (innerWidth * index) / (props.points.length - 1)
}

function yScale (value) {
  const innerHeight = height - padding.top - padding.bottom
  return padding.top + innerHeight - (value / yMax.value) * innerHeight
}

function polyline (values) {
  return values
    .map((value, index) => `${xScale(index)},${yScale(value)}`)
    .join(' ')
}

function compactEuro (value) {
  if (value === 0) return '0 €'
  return `${value / 1000} k€`
}

function formatEuro (value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value ?? 0)
}
</script>
