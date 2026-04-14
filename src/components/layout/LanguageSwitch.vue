<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      :class="transparent ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-night hover:bg-forest-50'"
    >
      <span>{{ currentFlag }}</span>
      <span class="uppercase">{{ locale }}</span>
      <PhCaretDown :size="14" class="transition-transform" :class="{ 'rotate-180': open }" />
    </button>
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="open" class="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="switchLang(lang.code)"
          class="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-forest-50 transition-colors"
          :class="{ 'text-forest font-semibold': locale === lang.code }"
        >
          <span>{{ lang.flag }}</span>
          <span>{{ lang.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'
import { UI_LANGUAGES } from '@/config/locales.js'
import { PhCaretDown } from '@phosphor-icons/vue'

defineProps({
  transparent: { type: Boolean, default: false }
})

const { locale } = useI18n()
const open = ref(false)
const dropdownRef = ref(null)

onClickOutside(dropdownRef, () => { open.value = false })

const languages = UI_LANGUAGES

const currentFlag = computed(() =>
  languages.find((l) => l.code === locale.value)?.flag ?? '🇫🇷'
)

function switchLang(code) {
  locale.value = code
  localStorage.setItem('akuu-locale', code)
  open.value = false
}
</script>
