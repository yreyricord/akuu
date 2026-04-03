<template>
  <div>
    <PageHero
      :title="$t('cours_anglais.hero_title')"
      :subtitle="$t('cours_anglais.hero_subtitle')"
      image="/images/anglais/Miason_AKUU.jpeg"
    />

    <section class="section-padding bg-white border-b border-night/[0.07]">
      <div class="container-narrow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-start gap-3.5 px-5 py-4 md:py-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-sm">
          <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p class="text-sm md:text-base text-amber-950/90 leading-[1.65]">
            {{ $t('cours_anglais.suspended_notice') }}
          </p>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article class="space-y-16 md:space-y-20 text-night/75 text-base md:text-lg leading-[1.65]">
          <section
            v-for="(block, i) in narrative.sections"
            :key="i"
            class="fade-in-up"
          >
            <template v-if="sectionVisuals[i]">
              <div class="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div :class="i % 2 === 1 ? 'md:order-2' : ''" class="min-w-0 space-y-5">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-1 text-balance leading-snug tracking-tight">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
                <figure
                  class="m-0 shrink-0 min-w-0"
                  :class="i % 2 === 1 ? 'md:order-1' : ''"
                >
                  <div class="overflow-hidden rounded-2xl border border-night/[0.1] shadow-lg shadow-night/5 bg-night/[0.02]">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption class="mt-3 text-sm text-night/55 leading-relaxed">
                    {{ $t(sectionVisuals[i].captionKey) }}
                  </figcaption>
                </figure>
              </div>
            </template>
            <template v-else>
              <div class="max-w-3xl space-y-5">
                <h2 class="text-2xl md:text-3xl font-serif font-bold text-night text-balance leading-snug tracking-tight">
                  {{ block.title }}
                </h2>
                <div class="space-y-4">
                  <p v-for="(para, j) in block.paragraphs" :key="j">
                    {{ para }}
                  </p>
                </div>
              </div>
            </template>
          </section>
        </article>
      </div>
    </section>

    <section class="section-padding bg-white border-t border-night/[0.06]">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-10 md:mb-12">
          <p class="text-night/45 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            {{ $t('cours_anglais.impact_kicker') }}
          </p>
          <h2 class="text-2xl md:text-3xl font-serif font-bold text-night tracking-tight">
            {{ $t('cours_anglais.impact_title') }}
          </h2>
        </header>
        <div class="grid sm:grid-cols-3 gap-6 lg:gap-8">
          <div class="p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] text-center hover:border-forest/15 hover:shadow-md transition-all duration-300">
            <p class="text-3xl md:text-4xl font-serif font-bold text-forest tabular-nums mb-2">60+</p>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">{{ $t('cours_anglais.impact_1') }}</p>
          </div>
          <div class="p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] text-center hover:border-bleu/20 hover:shadow-md transition-all duration-300">
            <p class="text-3xl md:text-4xl font-serif font-bold text-bleu tabular-nums mb-2">30+</p>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">{{ $t('cours_anglais.impact_2') }}</p>
          </div>
          <div class="p-6 md:p-7 rounded-2xl bg-cream/70 border border-night/[0.07] text-center hover:border-forest/15 hover:shadow-md transition-all duration-300">
            <p class="text-2xl md:text-3xl font-serif font-bold text-forest tabular-nums mb-2 tracking-tight">2018-2020</p>
            <p class="text-sm md:text-[0.9375rem] text-night/65 leading-relaxed">{{ $t('cours_anglais.impact_3') }}</p>
          </div>
        </div>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHero from '@/components/shared/PageHero.vue'
import DonSection from '@/components/home/DonSection.vue'
import coursAnglaisNarrative from '@/data/cours-anglais-narrative.json'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'

const { locale } = useI18n()

useScrollAnimation()

const narrative = computed(() => {
  const loc = locale.value
  return coursAnglaisNarrative[loc] || coursAnglaisNarrative.fr
})

/** Une entrée par chapitre (index = ordre dans cours-anglais-narrative.json) ; null = texte seul */
const sectionVisuals = [
  { src: '/images/anglais/20180612-P1000124.jpg', captionKey: 'cours_anglais.caption_contexte' },
  { src: '/images/anglais/20180612-P1000129.jpg', captionKey: 'cours_anglais.caption_programme' },
  { src: '/images/anglais/20180612-P1000136.jpg', captionKey: 'cours_anglais.caption_groupes' },
  { src: '/images/anglais/20180612-P1000156.jpg', captionKey: 'cours_anglais.caption_continuite' },
  { src: '/images/anglais/20180612-P1000175.jpg', captionKey: 'cours_anglais.caption_resultats' },
  null,
  null
]
</script>
