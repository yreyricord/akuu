<template>
  <div>
    <PageHero
      :title="$t('akuuvision.hero_title')"
      :subtitle="$t('akuuvision.hero_subtitle')"
      image="/images/sensibilisation.jpg"
    />

    <!-- Présentation + repères -->
    <section class="section-padding bg-white border-b border-night/[0.07]">
      <div class="container-narrow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-night/45 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
          {{ $t('akuuvision.intro_kicker') }}
        </p>
        <div class="fade-in-up max-w-3xl space-y-6">
          <h2 class="text-2xl md:text-3xl font-serif font-bold text-night text-balance leading-snug">
            {{ $t('akuuvision.what_title') }}
          </h2>
          <div class="space-y-5 text-night/75 text-base md:text-lg leading-[1.65]">
            <p>{{ $t('akuuvision.what_para1') }}</p>
            <p>{{ $t('akuuvision.what_para2') }}</p>
            <p>{{ $t('akuuvision.what_para3') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-10 md:mb-12">
          <p class="text-night/45 text-xs font-semibold uppercase tracking-widest mb-3">
            {{ $t('akuuvision.video_kicker') }}
          </p>
          <h2 class="text-2xl md:text-3xl font-serif font-bold text-night tracking-tight">
            {{ $t('akuuvision.video_title') }}
          </h2>
        </header>
        <div class="rounded-2xl overflow-hidden border border-night/[0.1] shadow-lg shadow-night/5 bg-night/[0.03]">
          <VideoEmbed
            video-id="gHu9EebMLZQ"
            :title="$t('akuuvision.hero_title')"
          />
        </div>
      </div>
    </section>

    <section class="section-padding bg-white border-t border-night/[0.06]">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-10 md:mb-12 text-center tracking-tight">
          {{ $t('akuuvision.diffusion_title') }}
        </h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div class="flex flex-col items-center text-center sm:items-start sm:text-left p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] hover:border-forest/20 hover:shadow-md transition-all duration-300">
            <div class="w-14 h-14 rounded-xl bg-forest/10 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night text-lg mt-5 mb-2 leading-snug">
              {{ $t('akuuvision.diffusion_1_title') }}
            </h3>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">
              {{ $t('akuuvision.diffusion_1_text') }}
            </p>
          </div>
          <div class="flex flex-col items-center text-center sm:items-start sm:text-left p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] hover:border-bleu/25 hover:shadow-md transition-all duration-300">
            <div class="w-14 h-14 rounded-xl bg-bleu/10 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-bleu" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-7.342m0 0a3.722 3.722 0 0 0-3.741 0" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night text-lg mt-5 mb-2 leading-snug">
              {{ $t('akuuvision.diffusion_2_title') }}
            </h3>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">
              {{ $t('akuuvision.diffusion_2_text') }}
            </p>
          </div>
          <div class="flex flex-col items-center text-center sm:items-start sm:text-left p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] hover:border-leaf/30 hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div class="w-14 h-14 rounded-xl bg-leaf/20 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night text-lg mt-5 mb-2 leading-snug">
              {{ $t('akuuvision.diffusion_3_title') }}
            </h3>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">
              {{ $t('akuuvision.diffusion_3_text') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import PageHero from '@/components/shared/PageHero.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import DonSection from '@/components/home/DonSection.vue'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'

useScrollAnimation()
</script>
