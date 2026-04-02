<template>
  <nav
    :class="[
      'fixed top-0 w-full z-50 transition-all duration-500',
      scrolled || menuOpen
        ? 'bg-white/95 backdrop-blur-md shadow-md'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16 md:h-20">
        <router-link to="/" class="flex items-center gap-3 group" @click="menuOpen = false">
          <img
            src="/images/LOGOAKUU.png"
            alt="AKUU"
            class="h-10 w-auto drop-shadow-md"
          />
        </router-link>

        <div class="hidden lg:flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              scrolled
                ? 'text-night/70 hover:text-forest hover:bg-forest-50'
                : 'text-white/80 hover:text-white hover:bg-white/10',
              $route.path === item.path
                ? (scrolled ? '!text-forest !bg-forest-50' : '!text-white !bg-white/15')
                : ''
            ]"
          >
            {{ $t(item.labelKey) }}
          </router-link>
        </div>

        <div class="hidden lg:flex items-center gap-3">
          <LanguageSwitch :transparent="!scrolled" />
          <DonButton :label="$t('footer.don_cta')" />
        </div>

        <button
          @click="menuOpen = !menuOpen"
          class="lg:hidden p-2 rounded-lg transition-colors"
          :class="scrolled || menuOpen ? 'text-night hover:bg-gray-100' : 'text-white hover:bg-white/10'"
          aria-label="Menu"
        >
          <svg v-if="!menuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div v-if="menuOpen" class="lg:hidden bg-white border-t border-gray-100 shadow-xl">
        <div class="max-w-7xl mx-auto px-4 py-4 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="menuOpen = false"
            class="block px-4 py-3 rounded-xl text-sm font-medium text-night/70 hover:text-forest hover:bg-forest-50 transition-colors"
            :class="{ '!text-forest !bg-forest-50': $route.path === item.path }"
          >
            {{ $t(item.labelKey) }}
          </router-link>
          <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
            <LanguageSwitch />
            <DonButton :label="$t('footer.don_cta')" />
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LanguageSwitch from './LanguageSwitch.vue'
import DonButton from '@/components/shared/DonButton.vue'

const scrolled = ref(false)
const menuOpen = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const navItems = [
  { path: '/association', labelKey: 'nav.association' },
  { path: '/projets', labelKey: 'nav.projets' },
  { path: '/musee-shapishiko', labelKey: 'nav.musee' },
  { path: '/volontaires', labelKey: 'nav.volontaires' },
  { path: '/soutenir', labelKey: 'nav.soutenir' },
  { path: '/contact', labelKey: 'nav.contact' }
]
</script>
