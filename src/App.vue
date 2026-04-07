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
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/layout/NavBar.vue'
import ScrollProgressBar from '@/components/layout/ScrollProgressBar.vue'
import Footer from '@/components/layout/Footer.vue'

const { locale, t } = useI18n()

function syncDocumentSeo () {
  const loc = locale.value
  document.documentElement.lang = loc === 'en' ? 'en' : loc === 'es' ? 'es' : 'fr'
  document.title = t('seo.title')
  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', t('seo.description'))
}

onMounted(syncDocumentSeo)
watch(locale, syncDocumentSeo)
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
