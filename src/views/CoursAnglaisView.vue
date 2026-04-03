<template>
  <div>
    <PageHero
      :title="$t('cours_anglais.hero_title')"
      :subtitle="$t('cours_anglais.hero_subtitle')"
      image="/images/cours-anglais.jpg"
    />

    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="max-w-3xl mx-auto">
          <!-- Badge suspendu -->
          <div class="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-10">
            <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p class="text-sm text-amber-800 font-medium">{{ $t('cours_anglais.suspended_notice') }}</p>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-start">
            <div class="fade-in-up">
              <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6">
                {{ $t('cours_anglais.what_title') }}
              </h2>
              <p class="text-night/60 text-lg leading-relaxed mb-4">
                {{ $t('cours_anglais.what_text') }}
              </p>
              <div class="flex flex-wrap gap-2 mt-6">
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest">{{ $t('cours_anglais.tag_education') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-bleu/10 text-bleu">{{ $t('cours_anglais.tag_location') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{{ $t('cours_anglais.tag_suspended') }}</span>
              </div>
            </div>
            <div class="fade-in-up">
              <div class="p-6 rounded-2xl bg-white border border-night/[0.06] shadow-sm">
                <dl class="space-y-4 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('cours_anglais.info_start') }}</dt>
                    <dd class="text-night font-semibold">2017</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('cours_anglais.info_status') }}</dt>
                    <dd class="text-amber-600 font-semibold">{{ $t('cours_anglais.info_status_value') }}</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('cours_anglais.info_location') }}</dt>
                    <dd class="text-night font-semibold">{{ $t('cours_anglais.location_value') }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact -->
    <section class="section-padding bg-white">
      <div class="container-narrow max-w-3xl mx-auto">
        <h2 class="text-2xl font-serif font-bold text-night mb-8 text-center">{{ $t('cours_anglais.impact_title') }}</h2>
        <div class="grid sm:grid-cols-3 gap-6">
          <div class="p-5 rounded-2xl bg-cream border border-night/[0.06] text-center">
            <p class="text-3xl font-serif font-bold text-forest mb-1">60+</p>
            <p class="text-xs text-night/50">{{ $t('cours_anglais.impact_1') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-cream border border-night/[0.06] text-center">
            <p class="text-3xl font-serif font-bold text-bleu mb-1">3</p>
            <p class="text-xs text-night/50">{{ $t('cours_anglais.impact_2') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-cream border border-night/[0.06] text-center">
            <p class="text-3xl font-serif font-bold text-forest mb-1">2017-2020</p>
            <p class="text-xs text-night/50">{{ $t('cours_anglais.impact_3') }}</p>
          </div>
        </div>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import PageHero from '@/components/shared/PageHero.vue'
import DonSection from '@/components/home/DonSection.vue'
</script>
