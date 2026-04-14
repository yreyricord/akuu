<template>
  <div class="border border-forest/10 rounded-xl overflow-hidden">
    <button
      @click="open = !open"
      :aria-expanded="open"
      :aria-controls="contentId"
      class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-forest-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 rounded-xl"
    >
      <span class="font-semibold text-night">{{ title }}</span>
      <PhCaretDown
        :size="20"
        class="text-forest transition-transform duration-300 shrink-0 ml-4"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
      />
    </button>
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-96 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-96 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="open" :id="contentId" role="region" class="overflow-hidden">
        <div class="px-6 pb-4 text-night/60 leading-relaxed">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhCaretDown } from '@phosphor-icons/vue'

defineProps({
  title: { type: String, required: true }
})

const open = ref(false)
const contentId = `accordion-${Math.random().toString(36).slice(2, 9)}`
</script>
