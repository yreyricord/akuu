<template>
  <div v-if="deckUrl" class="min-h-screen bg-cream px-4 md:px-6 pt-24 pb-16 md:pt-28">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-4 px-1">
        <router-link
          to="/formation"
          class="inline-flex items-center gap-2 text-night/70 font-semibold hover:text-forest transition-colors"
        >
          <PhArrowLeft :size="16" /> {{ $t('formation.coming_soon.back') }}
        </router-link>
        <p class="text-sm font-semibold uppercase tracking-wide" :class="iconTextClass">
          {{ moduleTitle }}
        </p>
      </div>

      <div
        class="deck-frame relative rounded-[2rem] p-2 md:p-3 bg-gradient-to-br from-night-900 to-night-700"
        :class="ACCENT_CLASSES[accent].glow"
      >
        <span class="corner-bracket top-2 left-2 border-t-2 border-l-2 rounded-tl-lg" :class="ACCENT_CLASSES[accent].corner" />
        <span class="corner-bracket top-2 right-2 border-t-2 border-r-2 rounded-tr-lg" :class="ACCENT_CLASSES[accent].corner" />
        <span class="corner-bracket bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg" :class="ACCENT_CLASSES[accent].corner" />
        <span class="corner-bracket bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg" :class="ACCENT_CLASSES[accent].corner" />

        <div ref="frameRef" class="relative rounded-3xl overflow-hidden bg-night" style="aspect-ratio: 16 / 9;">
          <iframe
            ref="iframeRef"
            :src="deckUrl"
            :title="moduleTitle"
            class="w-full h-full"
            allow="fullscreen"
            allowfullscreen
          />
          <button
            type="button"
            @click="toggleFullscreen"
            class="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-night/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-night/90 transition-colors shrink-0"
            :aria-label="$t('formation.deck.fullscreen')"
          >
            <PhCornersIn v-if="isFullscreen" :size="18" weight="bold" />
            <PhCornersOut v-else :size="18" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-24 text-center">
    <div class="w-16 h-16 rounded-full flex items-center justify-center mb-6" :class="badgeBgClass">
      <PhClock :size="32" weight="duotone" :class="iconTextClass" />
    </div>
    <p v-if="moduleTitle" class="text-sm font-semibold uppercase tracking-wide mb-2" :class="iconTextClass">
      {{ moduleTitle }}
    </p>
    <h1 class="text-4xl font-serif font-bold text-night mb-4">{{ $t('formation.coming_soon.title') }}</h1>
    <p class="text-night/60 max-w-md text-lg leading-relaxed mb-8">{{ $t('formation.coming_soon.text') }}</p>
    <router-link
      to="/formation"
      class="inline-flex items-center gap-2 bg-forest text-white font-semibold px-6 py-3 rounded-2xl hover:bg-forest/90 transition-colors"
    >
      <PhArrowLeft :size="16" /> {{ $t('formation.coming_soon.back') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PhClock, PhArrowLeft, PhCornersOut, PhCornersIn } from '@phosphor-icons/vue'
import { findModule, findGroup, ACCENT_CLASSES, MODULE_DECKS } from '@/data/formation-modules.js'

const route = useRoute()
const { t, te } = useI18n()

const currentModule = computed(() => findModule(route.params.id))
const currentGroup = computed(() =>
  currentModule.value ? findGroup(currentModule.value.groupId) : undefined
)
const accent = computed(() => currentGroup.value?.accent ?? 'forest')
const deckUrl = computed(() =>
  currentModule.value ? MODULE_DECKS[currentModule.value.id] : undefined
)

const moduleTitle = computed(() => {
  if (!currentModule.value) return ''
  const key = `formation.modules.module_${currentModule.value.id}.title`
  return te(key) ? t(key) : ''
})

const badgeBgClass = computed(() => {
  const bg = {
    forest: 'bg-leaf/20',
    bleu: 'bg-bleu-pur/40',
    terracotta: 'bg-terracotta-100',
    night: 'bg-night-100'
  }
  return bg[accent.value]
})

const iconTextClass = computed(() => ACCENT_CLASSES[accent.value].text)

const frameRef = ref(null)
const iframeRef = ref(null)
const isFullscreen = ref(false)

function toggleFullscreen () {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else if (frameRef.value) {
    frameRef.value.requestFullscreen()
  }
}

function handleFullscreenChange () {
  isFullscreen.value = document.fullscreenElement === frameRef.value
  // The deck has a built-in thumbnail rail (left sidebar) with a public
  // `no-rail` attribute meant exactly for this - toggle it instead of
  // reaching into the deck's shadow DOM to hide internals directly.
  try {
    const deckStage = iframeRef.value?.contentDocument?.querySelector('deck-stage')
    if (deckStage) {
      if (isFullscreen.value) deckStage.setAttribute('no-rail', '')
      else deckStage.removeAttribute('no-rail')
    }
  } catch {
    // cross-origin or not-yet-loaded iframe - nothing to do
  }
}

onMounted(() => document.addEventListener('fullscreenchange', handleFullscreenChange))
onUnmounted(() => document.removeEventListener('fullscreenchange', handleFullscreenChange))
</script>

<style scoped>
.corner-bracket {
  position: absolute;
  width: 1.75rem;
  height: 1.75rem;
  pointer-events: none;
  opacity: 0.8;
}

.deck-frame {
  animation: deck-glow 4s ease-in-out infinite;
}

@keyframes deck-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.06); }
}
</style>
