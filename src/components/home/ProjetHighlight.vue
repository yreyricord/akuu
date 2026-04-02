<template>
  <section class="section-padding bg-white">
    <div class="container-narrow">
      <SectionTitle :subtitle="$t('featured_project.title')">
        {{ $t('featured_project.subtitle') }}
      </SectionTitle>

      <router-link to="/musee-shapishiko" class="group block fade-in-up">
        <div class="relative overflow-hidden rounded-2xl shadow-xl">
          <img
            src="/images/projet-highlight.jpg"
            alt="Musée Shapishiko, projet culturel à Puerto Miguel"
            class="w-full h-[300px] md:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-night/80 via-night/20 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <span class="inline-block px-3 py-1 bg-leaf text-white text-xs font-semibold rounded-full mb-4">
              {{ $t('projets.status.en_cours') }}
            </span>
            <h3 class="text-2xl md:text-4xl font-serif font-bold text-white mb-3">
              {{ $t('featured_project.subtitle') }}
            </h3>
            <p class="text-white/80 text-lg max-w-xl mb-4">
              {{ $t('featured_project.description') }}
            </p>
            <span class="inline-flex items-center gap-2 text-leaf font-semibold group-hover:gap-3 transition-all">
              {{ $t('featured_project.cta') }}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from '@/components/shared/SectionTitle.vue'
</script>
