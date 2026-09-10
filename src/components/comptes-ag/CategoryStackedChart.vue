<template>
  <div>
    <ul class="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-xs text-night-500">
      <li
        v-for="category in flow.categories"
        :key="category.id"
        class="inline-flex items-center gap-2 max-w-full"
      >
        <i
          class="w-2.5 h-2.5 rounded-sm shrink-0"
          :style="{ backgroundColor: category.color }"
          aria-hidden="true"
        />
        <span class="leading-snug">{{ category.label }}</span>
      </li>
      <li
        v-if="projections.length"
        class="inline-flex items-center gap-2 max-w-full"
      >
        <i
          class="w-2.5 h-2.5 rounded-sm shrink-0 border border-dashed border-night-400 bg-white"
          aria-hidden="true"
        />
        <span class="leading-snug">Montant attendu (pointillés)</span>
      </li>
    </ul>

    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full h-auto"
      role="img"
      :aria-label="ariaLabel"
    >
      <defs>
        <pattern
          :id="patternId"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#94A3B8" stroke-width="2" />
        </pattern>
      </defs>

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

      <g v-for="(bar, index) in bars" :key="bar.year">
        <g v-for="segment in bar.segments" :key="segment.id">
          <rect
            :x="barX(index)"
            :y="segment.y"
            :width="barWidth"
            :height="segment.height"
            :fill="segment.color"
            rx="1"
          />
        </g>

        <g v-for="projection in bar.projections" :key="projection.id">
          <rect
            :x="barX(index)"
            :y="projection.y"
            :width="barWidth"
            :height="projection.height"
            :fill="projection.color"
            fill-opacity="0.2"
            rx="1"
          />
          <rect
            :x="barX(index) + 1"
            :y="projection.y + 1"
            :width="barWidth - 2"
            :height="Math.max(projection.height - 2, 0)"
            :fill="`url(#${patternId})`"
            fill-opacity="0.55"
            rx="1"
          />
          <rect
            :x="barX(index)"
            :y="projection.y"
            :width="barWidth"
            :height="projection.height"
            fill="none"
            :stroke="projection.color"
            stroke-width="1.5"
            stroke-dasharray="5 3"
            rx="1"
          />
        </g>

        <text
          :x="barX(index) + barWidth / 2"
          :y="height - 8"
          text-anchor="middle"
          class="fill-night-400 text-[10px] font-medium"
        >
          {{ bar.label }}
        </text>
      </g>
    </svg>

    <p
      v-if="projections.length && projectionNote"
      class="mt-3 text-xs text-night-500 leading-relaxed"
    >
      {{ projectionNote }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  flow: {
    type: Object,
    required: true
  },
  ariaLabel: {
    type: String,
    required: true
  }
})

const patternId = `projection-hatch-${Math.random().toString(36).slice(2, 9)}`

const width = 760
const height = 300
const padding = { top: 16, right: 16, bottom: 36, left: 52 }

const projections = computed(() => props.flow.projections ?? [])

const categoryById = computed(() =>
  Object.fromEntries(props.flow.categories.map((category) => [category.id, category]))
)

const projectionNote = computed(() => projections.value[0]?.note ?? '')

const yearTotals = computed(() => {
  const projectionByYear = projections.value.reduce((acc, item) => {
    acc[item.year] = (acc[item.year] ?? 0) + item.amount
    return acc
  }, {})

  return props.flow.years.map((year) =>
    year.total + (projectionByYear[year.year] ?? 0)
  )
})

const yMax = computed(() => {
  const peak = Math.max(...yearTotals.value, 1)
  return Math.ceil(peak / 5000) * 5000
})

const yTicks = computed(() =>
  Array.from({ length: (yMax.value / 5000) + 1 }, (_, index) => index * 5000)
)

const barWidth = computed(() => {
  const innerWidth = width - padding.left - padding.right
  const gap = 12
  const count = Math.max(props.flow.years.length, 1)
  return Math.max(18, (innerWidth - gap * (count - 1)) / count)
})

const bars = computed(() => {
  const innerHeight = height - padding.top - padding.bottom
  const projectionsForYear = projections.value.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = []
    acc[item.year].push(item)
    return acc
  }, {})

  return props.flow.years.map((year) => {
    let cursor = padding.top + innerHeight
    const segments = props.flow.categories
      .map((category) => {
        const amount = year.amounts[category.id] || 0
        if (!amount) return null
        const segmentHeight = (amount / yMax.value) * innerHeight
        cursor -= segmentHeight
        return {
          id: category.id,
          color: category.color,
          amount,
          y: cursor,
          height: segmentHeight
        }
      })
      .filter(Boolean)

    const barProjections = (projectionsForYear[year.year] ?? []).map((item) => {
      const category = categoryById.value[item.categoryId]
      const segmentHeight = (item.amount / yMax.value) * innerHeight
      cursor -= segmentHeight
      return {
        id: `${item.year}-${item.categoryId}-projection`,
        color: category?.color ?? '#2563EB',
        label: item.label,
        amount: item.amount,
        y: cursor,
        height: segmentHeight
      }
    })

    return {
      year: year.year,
      label: year.label,
      total: year.total,
      segments,
      projections: barProjections
    }
  })
})

function barX (index) {
  const innerWidth = width - padding.left - padding.right
  const gap = 12
  const count = props.flow.years.length
  if (count <= 1) return padding.left + (innerWidth - barWidth.value) / 2
  const step = (innerWidth - barWidth.value) / (count - 1)
  return padding.left + step * index
}

function yScale (value) {
  const innerHeight = height - padding.top - padding.bottom
  return padding.top + innerHeight - (value / yMax.value) * innerHeight
}

function compactEuro (value) {
  if (value === 0) return '0 €'
  if (value >= 1000) return `${value / 1000} k€`
  return `${value} €`
}
</script>
