<template>
  <div class="border border-forest/10 rounded-xl overflow-hidden">
    <button
      @click="open = !open"
      class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-forest-50/50 transition-colors"
    >
      <span class="font-semibold text-night">{{ title }}</span>
      <svg
        class="w-5 h-5 text-forest transition-transform duration-300 shrink-0 ml-4"
        :class="{ 'rotate-180': open }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-96 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-96 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="open" class="overflow-hidden">
        <div class="px-6 pb-4 text-night/60 leading-relaxed">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, required: true }
})

const open = ref(false)
</script>
