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
              <PhCalendarBlank :size="28" weight="duotone" class="text-forest" />
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
              <PhGlobeHemisphereWest :size="28" weight="duotone" class="text-bleu" />
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
              <PhTrophy :size="28" weight="duotone" class="text-forest" />
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
import { PhCalendarBlank, PhGlobeHemisphereWest, PhTrophy } from '@phosphor-icons/vue'
import PageHero from '@/components/shared/PageHero.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import DonSection from '@/components/home/DonSection.vue'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'

useScrollAnimation()
</script>
