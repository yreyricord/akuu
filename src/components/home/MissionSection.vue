<template>
  <section class="section-padding bg-cream">
    <div class="container-narrow">
      <div class="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div class="fade-in-up">
          <span class="text-forest text-sm font-semibold uppercase tracking-widest mb-3 block">AKUU</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-night mb-6 leading-tight">
            {{ $t('mission.title') }}
          </h2>
          <p class="text-night/60 text-lg leading-relaxed mb-8">
            {{ $t('mission.text') }}
          </p>
          <router-link to="/association" class="btn-primary inline-flex">
            {{ $t('mission.cta') }}
            <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
        <router-link
          to="/association"
          class="group block w-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
          :aria-label="$t('mission.cta')"
        >
          <ForestScrollVisual
            aria-hidden
            wrapper-class="fade-in-up transition-transform duration-300 ease-out group-hover:scale-[1.015] group-active:scale-[0.99]"
          />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import ForestScrollVisual from '@/components/shared/ForestScrollVisual.vue'
</script>
