<template>
  <section class="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
    <!-- Breadcrumb -->
    <nav
      aria-label="Fil d'Ariane"
      class="absolute bottom-4 left-0 right-0 z-20 px-4 md:px-8"
    >
      <ol class="flex items-center gap-1.5 text-xs text-white/60 max-w-6xl mx-auto">
        <li>
          <router-link to="/" class="hover:text-white transition-colors">
            {{ $t('nav.home') }}
          </router-link>
        </li>
        <li v-for="(crumb, i) in breadcrumbs" :key="crumb.path" class="flex items-center gap-1.5">
          <svg class="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
          <router-link
            v-if="i < breadcrumbs.length - 1"
            :to="crumb.path"
            class="hover:text-white transition-colors"
          >{{ crumb.label }}</router-link>
          <span v-else class="text-white/90 font-medium" aria-current="page">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>
    <img
      v-if="image"
      :src="image"
      :alt="title"
      class="absolute inset-0 w-full h-full object-cover"
      loading="eager"
    />
    <div
      v-else
      class="absolute inset-0 bg-gradient-to-br from-night/85 via-forest/75 to-night/90 flex items-center justify-center border-b border-white/10"
    >
      <p v-if="imagePlaceholder" class="text-white/50 text-sm font-medium px-6 text-center max-w-md z-[1]">
        {{ imagePlaceholder }}
      </p>
    </div>
    <div
      v-if="image"
      class="absolute inset-0 bg-gradient-to-b from-night/60 via-night/40 to-night/70"
    />
    <div class="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 text-balance">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-lg md:text-xl text-white/80">
        {{ subtitle }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, default: '/images/hero-amazon.jpg' },
  imagePlaceholder: { type: String, default: '' }
})

const route = useRoute()
const { t } = useI18n()

const projetsParent = { path: '/projets', label: () => t('nav.projets') }

const crumbMap = {
  '/association':       { label: () => t('nav.association') },
  '/projets':           { label: () => t('nav.projets') },
  '/musee-shapishiko':  { label: () => t('nav.musee') },
  '/volontaires':       { label: () => t('nav.volontaires') },
  '/soutenir':          { label: () => t('nav.soutenir') },
  '/contact':           { label: () => t('nav.contact') },
  '/casa-akuu':         { label: () => 'La Casa AKUU',          parent: projetsParent },
  '/hydrama':           { label: () => "HYDR'AMA",              parent: projetsParent },
  '/akuuvision':        { label: () => 'AKUUVision',            parent: projetsParent },
  '/gestion-dechets':   { label: () => 'Gestion des déchets',   parent: projetsParent },
  '/cours-anglais':     { label: () => "Cours d'anglais",       parent: projetsParent },
}

const breadcrumbs = computed(() => {
  const entry = crumbMap[route.path]
  if (!entry) return []
  const crumbs = []
  if (entry.parent) crumbs.push({ path: entry.parent.path, label: entry.parent.label() })
  crumbs.push({ path: route.path, label: entry.label() })
  return crumbs
})
</script>
