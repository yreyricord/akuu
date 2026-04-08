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
        <div class="fade-in-up relative">
          <img
            src="/images/mission-akuu.jpg"
            :alt="$t('mission.image_alt')"
            class="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
            loading="lazy"
          />
          <div class="absolute -bottom-4 -left-4 w-24 h-24 bg-leaf/20 rounded-2xl -z-10" />
          <div class="absolute -top-4 -right-4 w-32 h-32 bg-ochre/10 rounded-full -z-10" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>
