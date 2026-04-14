<template>
  <div>
    <PageHero
      :title="$t('cours_anglais.hero_title')"
      :subtitle="$t('cours_anglais.hero_subtitle')"
      image="/images/anglais/6.jpg"
    />

    <section class="section-padding bg-white border-b border-night/[0.07]">
      <div class="container-narrow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-start gap-3.5 px-5 py-4 md:py-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-sm">
          <PhInfo :size="20" weight="fill" class="text-amber-600 shrink-0 mt-0.5" />
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
              <!-- 4 mises en page alternées pour éviter la répétition visuelle -->
              <div
                v-if="sectionLayout(i) === 'image-top'"
                class="space-y-6 md:space-y-8"
              >
                <figure class="m-0">
                  <div class="relative overflow-hidden rounded-2xl border border-night/[0.08] shadow-xl shadow-night/[0.06]">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[16/10] md:aspect-[2.1/1] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption
                      class="absolute bottom-0 left-0 right-0 px-4 py-3 md:px-5 md:py-4 text-sm md:text-[0.9375rem] text-white/95 leading-snug bg-gradient-to-t from-night/85 via-night/50 to-transparent pt-14"
                    >
                      {{ $t(sectionVisuals[i].captionKey) }}
                    </figcaption>
                  </div>
                </figure>
                <div class="min-w-0 space-y-5 max-w-3xl">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-1 text-balance leading-snug tracking-tight">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
              </div>

              <div
                v-else-if="sectionLayout(i) === 'split-portrait-end'"
                class="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-start"
              >
                <div class="lg:col-span-7 min-w-0 space-y-5 order-2 lg:order-1">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-1 text-balance leading-snug tracking-tight">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
                <figure class="m-0 lg:col-span-5 min-w-0 order-1 lg:order-2 lg:sticky lg:top-28">
                  <div class="overflow-hidden rounded-2xl border border-night/[0.08] shadow-lg shadow-night/[0.05] max-w-sm mx-auto lg:max-w-none">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[3/4] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p class="mt-2.5 text-xs text-night/45 text-center lg:text-left leading-relaxed px-1">
                    {{ $t(sectionVisuals[i].captionKey) }}
                  </p>
                </figure>
              </div>

              <div
                v-else-if="sectionLayout(i) === 'image-bottom'"
                class="space-y-6 md:space-y-8"
              >
                <div class="min-w-0 space-y-5 max-w-3xl">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-1 text-balance leading-snug tracking-tight">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
                <figure class="m-0 max-w-4xl mx-auto">
                  <div class="relative overflow-hidden rounded-2xl border border-night/[0.08] shadow-xl shadow-night/[0.06]">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[5/3] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption
                      class="absolute bottom-0 left-0 right-0 px-4 py-3 md:px-5 md:py-3.5 text-xs md:text-sm text-white/90 bg-gradient-to-t from-night/80 via-night/40 to-transparent pt-12"
                    >
                      {{ $t(sectionVisuals[i].captionKey) }}
                    </figcaption>
                  </div>
                </figure>
              </div>

              <div
                v-else
                class="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-start"
              >
                <figure class="m-0 lg:col-span-5 min-w-0 lg:sticky lg:top-28">
                  <div class="overflow-hidden rounded-2xl border border-night/[0.08] shadow-lg shadow-night/[0.05] max-w-sm mx-auto lg:max-w-none">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[3/4] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p class="mt-2.5 text-xs text-night/45 text-center lg:text-left leading-relaxed px-1">
                    {{ $t(sectionVisuals[i].captionKey) }}
                  </p>
                </figure>
                <div class="lg:col-span-7 min-w-0 space-y-5">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-1 text-balance leading-snug tracking-tight">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
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
import { PhInfo } from '@phosphor-icons/vue'

const { locale } = useI18n()

useScrollAnimation()

const narrative = computed(() => {
  const loc = locale.value
  return coursAnglaisNarrative[loc] || coursAnglaisNarrative.fr
})

/** Une entrée par chapitre (index = ordre dans cours-anglais-narrative.json) ; null = texte seul */
const sectionVisuals = [
  { src: '/images/anglais/1.jpg', captionKey: 'cours_anglais.caption_contexte' },
  { src: '/images/anglais/2.jpg', captionKey: 'cours_anglais.caption_programme' },
  { src: '/images/anglais/3.jpg', captionKey: 'cours_anglais.caption_groupes' },
  { src: '/images/anglais/4.jpg', captionKey: 'cours_anglais.caption_continuite' },
  { src: '/images/anglais/5.jpg', captionKey: 'cours_anglais.caption_resultats' },
  null,
  null
]

/** Alterne panoramique / portrait+texte / image en dessous / miroir, pour un rythme éditorial */
function sectionLayout (index) {
  return ['image-top', 'split-portrait-end', 'image-bottom', 'split-portrait-start'][index % 4]
}
</script>
