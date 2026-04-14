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
        <PhCaretUp :size="16" weight="bold" aria-hidden="true" />
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import NavBar from '@/components/layout/NavBar.vue'
import ScrollProgressBar from '@/components/layout/ScrollProgressBar.vue'
import Footer from '@/components/layout/Footer.vue'
import {
  buildRouteSeoHead,
  buildOrganizationJsonLdHead,
  buildBreadcrumbJsonLdHead
} from '@/utils/documentSeo.js'
import { getSiteOrigin } from '@/config/site.js'
import { HTML_LANG, DEFAULT_LOCALE } from '@/config/locales.js'
import { PhCaretUp } from '@phosphor-icons/vue'

const route = useRoute()
const { locale, t, te } = useI18n()

const htmlLang = computed(
  () => HTML_LANG[locale.value] ?? HTML_LANG[DEFAULT_LOCALE] ?? DEFAULT_LOCALE
)

const routeSeo = computed(() => {
  const seoKey = route.meta.seoRoute || 'home'
  const titleKey = `seo.routes.${seoKey}.title`
  const descKey = `seo.routes.${seoKey}.description`
  const title = te(titleKey) ? t(titleKey) : t('seo.title')
  const description = te(descKey) ? t(descKey) : t('seo.description')
  return buildRouteSeoHead({
    title,
    description,
    path: route.path,
    locale: locale.value
  })
})

const orgJsonLd = computed(() => buildOrganizationJsonLdHead())

const breadcrumbJsonLd = computed(() => {
  const origin = getSiteOrigin()
  const seoKey = route.meta.seoRoute || 'home'
  const titleKey = `seo.routes.${seoKey}.title`
  const pageTitle = te(titleKey) ? t(titleKey) : t('seo.title')

  if (seoKey === 'home') return {}
  const crumbs = [
    { name: t('seo.routes.home.title'), url: `${origin}/` },
    { name: pageTitle, url: `${origin}${route.path}` }
  ]
  return buildBreadcrumbJsonLdHead(crumbs)
})

useHead(computed(() => ({
  htmlAttrs: { lang: htmlLang.value },
  ...routeSeo.value,
  script: [
    ...(orgJsonLd.value.script || []),
    ...(breadcrumbJsonLd.value.script || [])
  ]
})))

const showScrollTop = ref(false)
function handleScroll() { showScrollTop.value = window.scrollY > 500 }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
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
