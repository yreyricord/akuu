<template>
  <div>
    <PageHero
      :title="$t('hydrama.hero_title')"
      :subtitle="$t('hydrama.hero_subtitle')"
      image="/images/hydrama/hydrama-vista-alegre.jpg"
    />

    <!-- Contexte projet (tout en haut) -->
    <section class="section-padding bg-cream border-b border-night/[0.06]">
      <div class="container-narrow max-w-4xl mx-auto">
        <div class="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200">
          <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p class="text-sm md:text-base text-amber-900 font-medium leading-relaxed">
            {{ $t('hydrama.suspended_notice') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Récit de présentation -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-4xl mx-auto">
        <article class="space-y-14 md:space-y-16 text-night/80 text-lg leading-relaxed">
          <section
            v-for="(block, i) in narrative.sections"
            :key="i"
          >
            <template v-if="sectionVisuals[i]">
              <div class="grid md:grid-cols-2 gap-8 lg:gap-10 items-start">
                <div :class="i % 2 === 1 ? 'md:order-2' : ''">
                  <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-5 text-balance">
                    {{ block.title }}
                  </h2>
                  <div class="space-y-4">
                    <p v-for="(para, j) in block.paragraphs" :key="j">
                      {{ para }}
                    </p>
                  </div>
                </div>
                <figure
                  class="m-0 shrink-0"
                  :class="i % 2 === 1 ? 'md:order-1' : ''"
                >
                  <div class="overflow-hidden rounded-2xl border border-night/[0.08] shadow-sm bg-night/[0.02]">
                    <img
                      :src="sectionVisuals[i].src"
                      :alt="$t(sectionVisuals[i].captionKey)"
                      class="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption class="mt-2 text-sm text-night/55 leading-snug">
                    {{ $t(sectionVisuals[i].captionKey) }}
                  </figcaption>
                </figure>
              </div>
            </template>
            <template v-else>
              <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-5 text-balance">
                {{ block.title }}
              </h2>
              <div class="space-y-4">
                <p v-for="(para, j) in block.paragraphs" :key="j">
                  {{ para }}
                </p>
              </div>
            </template>
          </section>
        </article>
      </div>
    </section>

    <!-- Frise chronologique (après le texte) -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-14">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">
            {{ $t('hydrama.timeline_kicker') }}
          </p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
            {{ $t('hydrama.timeline_title') }}
          </h2>
        </div>
        <div class="relative max-w-4xl mx-auto">
          <!-- Visuels latéraux désactivés pour l’instant (:show-opposite-visuals="false") -->
          <TheMuseeMilestones
            :steps="hydramaTimelineSteps"
            :show-opposite-visuals="false"
            trail-bird-src="/images/collibri-akuu.png"
            :trail-bird-alt="$t('common.colibri_trail_alt')"
            gradient-id="hydramaMilestoneGradient"
          />
        </div>
      </div>
    </section>

    <!-- Vidéo -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-4xl font-serif font-bold text-night tracking-tight">
            {{ $t('hydrama.video_title') }}
          </h2>
        </div>
        <p class="text-night/70 text-center text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
          {{ narrative.video_intro }}
        </p>
        <VideoEmbed
          video-id="PUpAEcFQg4w"
          :title="$t('hydrama.hero_title')"
        />
        <div class="mt-8 flex justify-center">
          <a
            href="https://www.facebook.com/Windaid/"
            class="group inline-flex items-center gap-2.5 rounded-full border border-night/12 bg-white/80 px-5 py-2.5 text-sm font-medium text-night shadow-sm transition-colors hover:border-forest/25 hover:bg-forest/[0.06] hover:text-forest"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="$t('hydrama.video_windaid_facebook_aria')"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition-colors group-hover:bg-[#1877F2]/15"
              aria-hidden="true"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            <span class="text-left leading-snug">
              {{ $t('hydrama.video_windaid_facebook_line1') }}
              <span class="block text-xs font-normal text-night/50 group-hover:text-forest/70">
                {{ $t('hydrama.video_windaid_facebook_line2') }}
              </span>
            </span>
            <svg
              class="h-4 w-4 shrink-0 text-night/35 transition-colors group-hover:text-forest/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Rejoindre -->
    <section class="section-padding bg-white">
      <div class="container-narrow max-w-3xl mx-auto text-center">
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-6">
          {{ narrative.join_title }}
        </h2>
        <div class="space-y-4 text-night/75 text-lg leading-relaxed text-left sm:text-center max-w-2xl mx-auto mb-8">
          <p>{{ narrative.join_p1 }}</p>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          <router-link
            to="/volontaires"
            class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-forest text-white font-semibold hover:bg-forest/90 transition-colors"
          >
            {{ $t('hydrama.join_cta_volunteers') }}
          </router-link>
          <router-link
            to="/contact"
            class="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-forest text-forest font-semibold hover:bg-forest/5 transition-colors"
          >
            {{ $t('hydrama.join_cta_contact') }}
          </router-link>
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
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import DonSection from '@/components/home/DonSection.vue'
import TheMuseeMilestones from '@/components/shared/TheMuseeMilestones.vue'
import hydramaNarrative from '@/data/hydrama-narrative.json'

const { locale, t, tm } = useI18n()

const narrative = computed(() => {
  const loc = locale.value
  return hydramaNarrative[loc] || hydramaNarrative.fr
})

const hydramaTimelineDefs = [
  { key: 'utc_2017', year: '2017', status: 'done' },
  { key: 'trujillo', year: '2018', status: 'done' },
  { key: 'turbine_ready', year: '2018', status: 'done' },
  { key: 'vista_install', year: '2018', status: 'done' },
  { key: 'loreto', year: '2018', status: 'done' },
  { key: 'field_2019', year: '2019', status: 'done' },
  { key: 'suspendu', year: '2020…', status: 'pending' }
]

const hydramaTimelineSteps = computed(() =>
  hydramaTimelineDefs.map((d) => {
    const rawItems = tm(`hydrama.timeline_steps.${d.key}.items`)
    const items = Array.isArray(rawItems) ? rawItems : []
    return {
      label: t(`hydrama.timeline_steps.${d.key}.label`),
      year: d.year,
      status: d.status,
      items
    }
  })
)

/** Une entrée par chapitre du récit (index = ordre dans hydrama-narrative.json) ; null = texte seul */
const sectionVisuals = [
  { src: '/images/hydrama/hydrama-groupe-electrogene.jpg', captionKey: 'hydrama.caption_groupe' },
  { src: '/images/hydrama/hydrama-windaid.jpg', captionKey: 'hydrama.caption_windaid' },
  { src: '/images/hydrama/hydrama-rotor.jpg', captionKey: 'hydrama.caption_rotor' },
  { src: '/images/hydrama/hydrama-plateforme-eau.jpg', captionKey: 'hydrama.caption_plateforme' },
  null,
  { src: '/images/hydrama/hydrama-chaine-transmission.jpg', captionKey: 'hydrama.caption_chaine' },
  null,
  { src: '/images/hydrama/hydrama-vista-alegre.jpg', captionKey: 'hydrama.caption_vista' }
]
</script>
