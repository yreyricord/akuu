<template>
  <div>
    <PageHero
      :title="$t('hydrama.hero_title')"
      :subtitle="$t('hydrama.hero_subtitle')"
      image="/images/hero-projets.jpg"
    />

    <!-- Badge suspendu -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-10">
            <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p class="text-sm text-amber-800 font-medium">{{ $t('hydrama.suspended_notice') }}</p>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-start">
            <div class="fade-in-up">
              <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6">
                {{ $t('hydrama.what_title') }}
              </h2>
              <p class="text-night/60 text-lg leading-relaxed mb-4">
                {{ $t('hydrama.what_text') }}
              </p>
              <div class="flex flex-wrap gap-2 mt-6">
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest">{{ $t('hydrama.tag_energy') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-bleu/10 text-bleu">{{ $t('hydrama.tag_amazon') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{{ $t('hydrama.tag_suspended') }}</span>
              </div>
            </div>
            <div class="fade-in-up">
              <div class="p-6 rounded-2xl bg-white border border-night/[0.06] shadow-sm">
                <dl class="space-y-4 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('hydrama.info_start') }}</dt>
                    <dd class="text-night font-semibold">2018</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('hydrama.info_status') }}</dt>
                    <dd class="text-amber-600 font-semibold">{{ $t('hydrama.info_status_value') }}</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('hydrama.info_location') }}</dt>
                    <dd class="text-night font-semibold">Vista Alegre, Amazonie</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vidéo -->
    <section class="section-padding bg-white">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('hydrama.video_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('hydrama.video_title') }}</h2>
        </div>
        <VideoEmbed
          video-id="PUpAEcFQg4w"
          :title="$t('hydrama.hero_title')"
        />
      </div>
    </section>

    <!-- Objectifs -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl mx-auto">
        <h2 class="text-2xl font-serif font-bold text-night mb-8 text-center">{{ $t('hydrama.goals_title') }}</h2>
        <div class="grid sm:grid-cols-3 gap-6">
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('hydrama.goal_1_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('hydrama.goal_1_text') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-bleu/10 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-bleu" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('hydrama.goal_2_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('hydrama.goal_2_text') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-leaf/20 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('hydrama.goal_3_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('hydrama.goal_3_text') }}</p>
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
</script>
