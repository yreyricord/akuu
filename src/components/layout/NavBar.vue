<template>
  <nav class="fixed top-0 w-full z-50 pointer-events-none bg-transparent safe-area-top">
    <div
      v-show="navSolid || menuOpen"
      class="pointer-events-none absolute inset-x-0 top-0 h-16 md:h-20 z-[1] w-full bg-white/95 backdrop-blur-md shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07),0_2px_4px_-2px_rgba(0,0,0,0.05)] transition-opacity duration-500"
      aria-hidden="true"
    />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible pointer-events-auto relative z-[2]">
      <div class="relative flex justify-between h-16 md:h-20 overflow-visible">
        <router-link
          to="/"
          class="flex items-start shrink-0 z-10 -ml-0.5 sm:ml-0 group"
          @click="closeMenu"
        >
          <img
            src="/images/LOGOAKUU.png"
            alt="AKUU"
            class="h-[4.8rem] w-auto md:h-24 drop-shadow-lg group-hover:opacity-95 transition-opacity"
          />
        </router-link>

        <div class="hidden lg:flex items-center gap-1 self-center">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              navSolid
                ? 'text-night/70 hover:text-forest hover:bg-forest-50'
                : 'text-white/80 hover:text-white hover:bg-white/10',
              $route.path === item.path
                ? (navSolid ? '!text-forest !bg-forest-50' : '!text-white !bg-white/15')
                : ''
            ]"
          >
            {{ $t(item.labelKey) }}
          </router-link>
        </div>

        <div class="hidden lg:flex items-center gap-3 self-center">
          <LanguageSwitch :transparent="!navSolid" />
          <DonButton :label="$t('footer.don_cta')" />
        </div>

        <button
          type="button"
          class="lg:hidden touch-target rounded-xl transition-colors self-center focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          :class="navSolid || menuOpen ? 'text-night hover:bg-gray-100' : 'text-white hover:bg-white/10'"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu-drawer"
          :aria-label="$t('a11y.menu')"
          @click="toggleMenu"
        >
          <PhList v-if="!menuOpen" :size="24" weight="bold" />
          <PhX v-else :size="24" weight="bold" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="menuOpen"
          class="lg:hidden fixed inset-0 z-[60] bg-night/40 backdrop-blur-sm pointer-events-auto"
          aria-hidden="true"
          @click="closeMenu"
        />
      </Transition>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="menuOpen"
          id="mobile-menu-drawer"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('a11y.menu')"
          class="lg:hidden fixed inset-x-0 top-0 z-[70] max-h-[100dvh] overflow-y-auto bg-white shadow-2xl pointer-events-auto safe-area-top safe-area-bottom"
        >
          <div class="flex items-center justify-between px-4 h-16 border-b border-gray-100">
            <span class="font-serif font-bold text-lg text-night">Menu</span>
            <button type="button" class="touch-target rounded-xl text-night hover:bg-gray-100" :aria-label="$t('a11y.close')" @click="closeMenu">
              <PhX :size="24" weight="bold" />
            </button>
          </div>
          <nav class="px-4 py-4 space-y-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flex min-h-[48px] items-center px-4 rounded-xl text-base font-medium text-night/80 hover:text-forest hover:bg-forest-50 transition-colors"
              :class="{ '!text-forest !bg-forest-50 font-semibold': $route.path === item.path }"
              @click="closeMenu"
            >
              {{ $t(item.labelKey) }}
            </router-link>
          </nav>
          <div class="px-4 pb-6 pt-2 border-t border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <LanguageSwitch />
            <DonButton :label="$t('footer.don_cta')" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import LanguageSwitch from './LanguageSwitch.vue'
import DonButton from '@/components/shared/DonButton.vue'
import { PhList, PhX } from '@phosphor-icons/vue'

const props = defineProps({
  solid: { type: Boolean, default: false }
})

const scrolled = ref(false)
const menuOpen = ref(false)
const navSolid = computed(() => props.solid || scrolled.value || menuOpen.value)

function handleScroll() {
  scrolled.value = window.scrollY > 50
}

function lockBodyScroll(lock) {
  document.body.style.overflow = lock ? 'hidden' : ''
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onKeydown(e) {
  if (e.key === 'Escape' && menuOpen.value) closeMenu()
}

watch(menuOpen, (open) => lockBodyScroll(open))

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', onKeydown)
  lockBodyScroll(false)
})

const navItems = [
  { path: '/association', labelKey: 'nav.association' },
  { path: '/projets', labelKey: 'nav.projets' },
  { path: '/musee-shapishiko', labelKey: 'nav.musee' },
  { path: '/volontaires', labelKey: 'nav.volontaires' },
  { path: '/soutenir', labelKey: 'nav.soutenir' },
  { path: '/contact', labelKey: 'nav.contact' }
]
</script>
