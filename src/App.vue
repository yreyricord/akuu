<template>
  <div class="min-h-screen flex flex-col">
    <NavBar />
    <ScrollProgressBar />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
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

onMounted(() => {
  injectOrganizationJsonLd()
})

watch(
  () => [route.path, route.meta.seoRoute, locale.value],
  () => syncRouteSeo(),
  { immediate: true }
)
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
