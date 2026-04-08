<template>
  <section class="section-padding bg-white">
    <div class="container-narrow">
      <SectionTitle :subtitle="$t('featured_project.title')">
        {{ $t('featured_project.subtitle') }}
      </SectionTitle>

      <router-link to="/musee-shapishiko" class="group block fade-in-up mt-2 md:mt-0">
        <div class="relative overflow-hidden rounded-2xl shadow-xl">
          <img
            src="/images/projet-highlight.jpg"
            :alt="$t('featured_project.image_alt')"
            class="w-full aspect-[16/9] md:aspect-[21/9] object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-night/95 via-night/40 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col gap-4">
            <h3 class="text-2xl md:text-4xl font-serif font-bold text-white">
              {{ $t('featured_project.subtitle') }}
            </h3>
            <p class="text-white/80 text-lg max-w-xl">
              {{ $t('featured_project.description') }}
            </p>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from '@/components/shared/SectionTitle.vue'
</script>
