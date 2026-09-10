<template>
  <div class="flex flex-col items-center">
    <div class="w-full max-w-xl mx-auto">
      <svg
        :viewBox="`0 0 ${size} ${size}`"
        class="w-full h-auto drop-shadow-md"
        role="img"
        :aria-label="`Répartition des dépenses : ${slices.length} postes`"
      >
        <circle
          :cx="center"
          :cy="center"
          :r="outerRadius + 8"
          class="fill-white"
        />
        <g :transform="`translate(${center}, ${center})`">
          <path
            v-for="slice in slicePaths"
            :key="slice.id"
            :d="slice.d"
            :fill="slice.color"
            :class="[
              'cursor-pointer transition-all duration-200 origin-center',
              activeId === slice.id ? 'opacity-100' : hoveredId && hoveredId !== slice.id ? 'opacity-45' : 'opacity-100'
            ]"
            :transform="activeId === slice.id || hoveredId === slice.id ? 'scale(1.04)' : 'scale(1)'"
            stroke="#fff"
            stroke-width="2.5"
            @mouseenter="hoveredId = slice.id"
            @mouseleave="hoveredId = null"
            @click="toggleSlice(slice.id)"
            @keydown.enter.prevent="toggleSlice(slice.id)"
            @keydown.space.prevent="toggleSlice(slice.id)"
            tabindex="0"
            :aria-label="`${slice.label} : ${formatEuro(slice.amount)} (${formatShare(slice.share)})`"
          />
        </g>
        <circle
          :cx="center"
          :cy="center"
          :r="innerRadius - 2"
          class="fill-cream-200"
        />
        <foreignObject
          :x="center - innerRadius + 12"
          :y="center - innerRadius + 12"
          :width="(innerRadius - 12) * 2"
          :height="(innerRadius - 12) * 2"
          class="pointer-events-none"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full flex flex-col items-center justify-center text-center px-2 transition-opacity duration-200"
          >
            <p
              class="text-[10px] font-semibold uppercase tracking-wider text-night-400 leading-snug line-clamp-3"
              :class="focusedSlice ? 'text-night-500' : ''"
            >
              {{ centerLabel }}
            </p>
            <p class="mt-1 font-serif font-bold text-night tabular-nums leading-tight text-[15px] md:text-[17px]">
              {{ formatEuro(centerAmount) }}
            </p>
            <p
              v-if="focusedSlice"
              class="mt-0.5 text-[10px] text-night-400 tabular-nums"
            >
              {{ formatShare(focusedSlice.share) }}
            </p>
          </div>
        </foreignObject>
      </svg>
    </div>

    <ul class="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <li
        v-for="slice in slices"
        :key="slice.id"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
          :class="activeId === slice.id ? 'bg-cream-300 ring-1 ring-night-100' : 'hover:bg-cream-200'"
          @mouseenter="hoveredId = slice.id"
          @mouseleave="hoveredId = null"
          @click="toggleSlice(slice.id)"
        >
          <span
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: slice.color }"
            aria-hidden="true"
          />
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-night leading-snug">{{ slice.label }}</span>
            <span class="block text-xs text-night-400 tabular-nums">
              {{ formatEuro(slice.amount) }} · {{ formatShare(slice.share) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <article
      v-if="activeSlice"
      class="mt-6 w-full rounded-2xl border border-night-100 bg-white p-5 shadow-sm"
    >
      <p class="text-[10px] font-semibold tracking-[0.09em] uppercase text-night-400">
        Détail
      </p>
      <h3 class="mt-1 font-serif font-bold text-xl text-night">{{ activeSlice.label }}</h3>
      <p class="mt-1 font-serif font-bold text-2xl text-night tabular-nums">
        {{ formatEuro(activeSlice.amount) }}
        <span class="text-base font-sans font-normal text-night-400">
          · {{ formatShare(activeSlice.share) }} des dépenses
        </span>
      </p>
      <p
        v-if="activeSlice.byYear?.length"
        class="mt-3 text-sm text-night-500 leading-relaxed"
      >
        {{ activeSlice.byYear.map(item => `${item.year} : ${formatEuro(item.amount)}`).join(' · ') }}
      </p>
      <ul
        v-if="activeSlice.lineItems?.length"
        class="mt-4 space-y-2 border-t border-night-100 pt-4"
      >
        <li
          v-for="item in activeSlice.lineItems"
          :key="item.label"
          class="flex items-baseline justify-between gap-3 text-sm"
        >
          <span class="text-night-500">{{ item.label }}</span>
          <span class="font-semibold text-night tabular-nums whitespace-nowrap">
            {{ formatEuro(item.amount) }}
          </span>
        </li>
      </ul>
      <p
        v-if="activeSlice.note"
        class="mt-4 text-sm text-ochre-700 bg-ochre-50 rounded-xl p-3 leading-relaxed"
      >
        {{ activeSlice.note }}
      </p>
    </article>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  slices: {
    type: Array,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
})

const size = 420
const center = size / 2
const outerRadius = 156
const innerRadius = 96

const hoveredId = ref(null)
const activeId = ref(null)

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2
})

function formatEuro (value) {
  return euroFormatter.format(value ?? 0)
}

function formatShare (value) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} %`
}

function polar (radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad)
  }
}

function ringPath (startAngle, endAngle) {
  if (endAngle - startAngle >= 359.999) {
    endAngle = startAngle + 359.999
  }
  const outerStart = polar(outerRadius, startAngle)
  const outerEnd = polar(outerRadius, endAngle)
  const innerEnd = polar(innerRadius, endAngle)
  const innerStart = polar(innerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ')
}

const slicePaths = computed(() => {
  let cursor = 0
  return props.slices.map((slice) => {
    const share = props.total ? (slice.amount / props.total) * 100 : 0
    const sweep = props.total ? (slice.amount / props.total) * 360 : 0
    const start = cursor
    const end = cursor + sweep
    cursor = end
    return {
      ...slice,
      share,
      d: ringPath(start, end)
    }
  })
})

const focusedSlice = computed(() => {
  if (!hoveredId.value) return null
  return slicePaths.value.find((slice) => slice.id === hoveredId.value) ?? null
})

const centerLabel = computed(() => focusedSlice.value?.label ?? 'Total')
const centerAmount = computed(() => focusedSlice.value?.amount ?? props.total)

const activeSlice = computed(
  () => props.slices.find((slice) => slice.id === activeId.value) ?? null
)

function toggleSlice (id) {
  activeId.value = activeId.value === id ? null : id
}
</script>
