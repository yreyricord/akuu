<template>
  <div class="min-h-screen min-h-dvh flex flex-col">
    <NavBar />
    <ScrollProgressBar />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <Footer class="shrink-0" />

    <!-- Bouton retour en haut -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <button
        v-if="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-4 md:right-6 z-40 w-10 h-10 rounded-full bg-forest text-white shadow-lg hover:bg-leaf hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
        :aria-label="$t('common.back_to_top')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/layout/NavBar.vue'
import ScrollProgressBar from '@/components/layout/ScrollProgressBar.vue'
import Footer from '@/components/layout/Footer.vue'
import { applyRouteDocumentSeo, injectOrganizationJsonLd } from '@/utils/documentSeo.js'

const route = useRoute()
const { locale, t, te } = useI18n()

function syncHtmlLang () {
  const loc = locale.value
  document.documentElement.lang = loc === 'en' ? 'en' : loc === 'es' ? 'es' : 'fr'
}

function syncRouteSeo () {
  syncHtmlLang()
  const seoKey = route.meta.seoRoute || 'home'
  const titleKey = `seo.routes.${seoKey}.title`
  const descKey = `seo.routes.${seoKey}.description`
  const title = te(titleKey) ? t(titleKey) : t('seo.title')
  const description = te(descKey) ? t(descKey) : t('seo.description')
  applyRouteDocumentSeo({
    title,
    description,
    path: route.path,
    locale: locale.value
  })
}

const showScrollTop = ref(false)
function handleScroll() { showScrollTop.value = window.scrollY > 500 }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  injectOrganizationJsonLd()
  window.addEventListener('scroll', handleScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

watch(
  () => [route.path, route.meta.seoRoute, locale.value],
  () => syncRouteSeo(),
  { immediate: true }
)
</script>

<style>
.page-enter-active {
  transition: opacity 0.35s ease-out, transform 0.35s ease-out;
}
.page-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
