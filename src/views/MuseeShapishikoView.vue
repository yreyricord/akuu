<template>
  <div>
    <PageHero
      :title="$t('musee.hero_title')"
      :subtitle="$t('musee.hero_subtitle')"
      image="/images/hero-musee.jpg"
    />

    <!-- Description / proportions : src/data/musee-section-layouts.js → description -->
    <section class="section-padding-musee-mobile bg-cream">
      <div class="container-narrow">
        <MuseeSectionWithSideVisual
          v-bind="museeSectionLayout.description"
          visual-src="/images/musee/galerie-musee-3.jpg"
          :visual-alt="$t('musee.description_image_alt')"
        >
          <div>
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-4 md:mb-6">
              {{ $t('musee.description_title') }}
            </h2>
            <p class="text-night/60 text-lg leading-relaxed mb-4">
              {{ $t('musee.description_intro') }}
            </p>
            <p class="text-night/60 text-lg leading-relaxed mb-2 font-medium">
              {{ $t('musee.description_objectives_lead') }}
            </p>
            <ul class="list-disc pl-5 text-night/60 text-lg leading-relaxed space-y-2 mb-6">
              <li v-for="(item, i) in descriptionObjectives" :key="i">
                {{ item }}
              </li>
            </ul>
            <p class="text-night/60 text-lg leading-relaxed">
              {{ $t('musee.description_committee') }}
            </p>
          </div>
        </MuseeSectionWithSideVisual>
      </div>
    </section>

    <!-- Contexte -->
    <section class="section-padding-musee-mobile bg-white">
      <div class="container-narrow">
        <MuseeSectionWithSideVisual
          v-bind="museeSectionLayout.context"
          :visual-src="museeSideVisualImages.context"
          :visual-alt="$t('musee.side_visuals.context.alt')"
        >
          <div class="text-center md:text-left mb-5 md:mb-0">
            <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.context_kicker') }}</p>
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-5 md:mb-8 text-balance">
              {{ $t('musee.context_title') }}
            </h2>
          </div>
          <div class="space-y-5 text-night/60 text-lg leading-relaxed">
            <p>{{ $t('musee.context_p1') }}</p>
            <p>{{ $t('musee.context_p2') }}</p>
            <p>{{ $t('musee.context_p3') }}</p>
          </div>
        </MuseeSectionWithSideVisual>
      </div>
    </section>

    <!-- Acteurs -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="text-center mb-8 fade-in-up">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.actors_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.actors_title') }}</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <article
            v-for="actor in museeActeurs"
            :key="actor.id"
            class="fade-in-up group flex flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm transition-all duration-300 hover:border-forest/30 hover:shadow-lg hover:-translate-y-1"
          >
            <div class="relative aspect-[5/3] overflow-hidden bg-night/10 shrink-0">
              <img
                :src="actor.image"
                :alt="$t(`musee.actors.${actor.id}.photo_alt`)"
                class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/30 via-transparent to-transparent opacity-80"
                aria-hidden="true"
              />
            </div>
            <div class="flex flex-1 flex-col p-5 pt-4">
              <h3 class="text-lg font-serif font-bold text-night mb-2 leading-snug">
                {{ $t(`musee.actors.${actor.id}.title`) }}
              </h3>
              <p class="text-night/60 text-sm leading-relaxed flex-1">
                {{ $t(`musee.actors.${actor.id}.text`) }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Gouvernance -->
    <section class="section-padding-musee-mobile bg-white">
      <div class="container-narrow">
        <MuseeSectionWithSideVisual
          v-bind="museeSectionLayout.governance"
          :visual-src="museeSideVisualImages.governance"
          :visual-alt="$t('musee.side_visuals.governance.alt')"
        >
          <div class="text-center md:text-left mb-5 md:mb-0">
            <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.governance_kicker') }}</p>
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-5 md:mb-8 text-balance">
              {{ $t('musee.governance_title') }}
            </h2>
          </div>
          <p class="text-night/60 text-lg leading-relaxed whitespace-pre-line">
            {{ $t('musee.governance_body') }}
          </p>
        </MuseeSectionWithSideVisual>
      </div>
    </section>

    <!-- Équipes terrain -->
    <section class="section-padding-musee-mobile bg-cream">
      <div class="container-narrow">
        <MuseeSectionWithSideVisual
          v-bind="museeSectionLayout.teams"
          :visual-src="museeSideVisualImages.teams"
          :visual-alt="$t('musee.side_visuals.teams.alt')"
        >
          <div class="text-center md:text-left mb-5 md:mb-0">
            <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.teams_kicker') }}</p>
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-5 md:mb-8 text-balance">
              {{ $t('musee.teams_title') }}
            </h2>
          </div>
          <p class="text-night/60 text-lg leading-relaxed">
            {{ $t('musee.teams_body') }}
          </p>
        </MuseeSectionWithSideVisual>
      </div>
    </section>

    <!-- Progress tracker -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-10 fade-in-up">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.progress_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.progress_title') }}</h2>
        </div>
        <div class="relative max-w-4xl mx-auto fade-in-up">
          <!-- Visuels en regard : :visual-srcs="['/images/...', ...]" (même ordre que les étapes) ; sinon placeholders 1–5 -->
          <TheMuseeMilestones
            :steps="milestones"
            :visual-srcs="milestoneVisualSrcs"
            :visual-alts="milestoneVisualAlts"
            trail-bird-src="/images/collibri-akuu.png"
            :trail-bird-alt="$t('common.colibri_trail_alt')"
          />
        </div>
      </div>
    </section>

    <!-- Parcours + espaces (texte unifié + coupe interactive) -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="max-w-3xl mx-auto text-center mb-8 md:mb-10 fade-in-up">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">
            {{ $t('musee.coupe_path_kicker') }}
          </p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6 text-balance">
            {{ $t('musee.coupe_path_title') }}
          </h2>
          <p class="text-night/60 text-lg leading-relaxed text-left md:text-center">
            {{ $t('musee.coupe_path_lead') }}
          </p>
          <p class="text-night/35 mt-6 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5">
            <span class="inline-block animate-bounce motion-reduce:animate-none" aria-hidden="true">↓</span>
            {{ $t('musee.coupe.scroll_hint') }}
          </p>
        </div>
        <MuseeCoupeAnimee omit-section-header />
      </div>
    </section>

    <!-- Durée et tarifs, puis plans du musée -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="mb-8 md:mb-10 pb-8 md:pb-10 border-b border-night/10">
          <MuseeSectionWithSideVisual
            v-bind="museeSectionLayout.visit"
            visual-src="/images/puerto_miguel.jpg"
            :visual-alt="$t('musee.visit_photo_alt')"
          >
            <div class="fade-in-up">
              <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.visit_kicker') }}</p>
              <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-6">
                {{ $t('musee.visit_title') }}
              </h2>
              <div class="space-y-4 text-night/60 text-lg leading-relaxed">
                <p>{{ $t('musee.visit_intro') }}</p>
                <p>{{ $t('musee.visit_duration') }}</p>
                <p>{{ $t('musee.visit_rates') }}</p>
                <p class="text-sm text-night/45">{{ $t('musee.visit_disclaimer') }}</p>
              </div>
            </div>
          </MuseeSectionWithSideVisual>
        </div>

        <div class="text-center md:text-left mb-8 fade-in-up max-w-3xl md:max-w-none">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.plans_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-4">
            {{ $t('musee.plans_title') }}
          </h2>
          <p class="text-night/50 text-base leading-relaxed max-w-2xl">
            {{ $t('musee.plans_intro') }}
          </p>
        </div>
        <div class="fade-in-up">
          <MuseePlanViewer />
        </div>
      </div>
    </section>

    <!-- Vidéo -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8 fade-in-up">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.video_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.video_title') }}</h2>
        </div>
        <div class="fade-in-up min-w-0">
          <VideoEmbed
            video-id="gOe9OiX-6WI"
            :title="$t('musee.video_title')"
          />
        </div>
      </div>
    </section>

    <!-- Galerie (fin de page) -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <PhotoGallery
          :photos="galleryPhotos"
          :headline-kicker="$t('musee.gallery_kicker')"
          :headline-title="$t('musee.gallery_title')"
          :headline-subtitle="$t('musee.gallery_subtitle')"
        />
      </div>
    </section>

    <section class="section-padding bg-cream border-t border-forest/10">
      <div class="container-narrow text-center max-w-2xl mx-auto px-6">
        <p class="text-forest text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.pursue_kicker') }}</p>
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-night mb-4">{{ $t('musee.pursue_title') }}</h2>
        <p class="text-night/65 text-lg leading-relaxed mb-8">{{ $t('musee.pursue_intro') }}</p>
        <nav aria-label="Liens utiles" class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          <router-link
            to="/association"
            class="inline-flex items-center justify-center px-5 py-3 rounded-full bg-forest text-white font-semibold hover:bg-forest/90 transition-colors"
          >
            {{ $t('musee.pursue_link_association') }}
          </router-link>
          <router-link
            to="/soutenir"
            class="inline-flex items-center justify-center px-5 py-3 rounded-full border-2 border-forest text-forest font-semibold hover:bg-forest/5 transition-colors"
          >
            {{ $t('musee.pursue_link_soutenir') }}
          </router-link>
          <router-link
            to="/contact"
            class="inline-flex items-center justify-center px-5 py-3 rounded-full border-2 border-night/20 text-night font-semibold hover:border-night/40 transition-colors"
          >
            {{ $t('musee.pursue_link_contact') }}
          </router-link>
        </nav>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHero from '@/components/shared/PageHero.vue'
import PhotoGallery from '@/components/shared/PhotoGallery.vue'
import DonSection from '@/components/home/DonSection.vue'
import TheMuseeMilestones from '@/components/shared/TheMuseeMilestones.vue'
import MuseePlanViewer from '@/components/shared/MuseePlanViewer.vue'
import MuseeCoupeAnimee from '@/components/shared/MuseeCoupeAnimee.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import MuseeSectionWithSideVisual from '@/components/shared/MuseeSectionWithSideVisual.vue'
import museeActeurs from '@/data/musee-acteurs.json'
import museeGallerySrcs from '@/data/musee-gallery.json'
import museeSideVisualImages from '@/data/musee-side-visuals.json'
import { museeSectionLayout } from '@/data/musee-section-layouts.js'

const { t, tm } = useI18n()

const milestoneDefs = [
  { key: 'impact_terrain', year: '2019-2023', status: 'done' },
  { key: 'financement', year: '2024', status: 'done' },
  { key: 'subvention_casa', year: '2025', status: 'done' },
  { key: 'production', year: '2026', status: 'in_progress' },
  { key: 'ouverture', year: '2026-2027', status: 'pending' }
]

/** Une image par étape d’avancement (ordre = milestoneDefs), public/images/projets/shapishiko/ */
const milestoneVisualSrcs = [
  '/images/projets/shapishiko/1.jpg',
  '/images/projets/shapishiko/2.jpeg',
  '/images/projets/shapishiko/3.jpg',
  '/images/musee/acteurs/karen.jpg',
  '/images/musee/acteurs/gouvernance.jpg'
]

const milestoneVisualAlts = computed(() =>
  milestoneVisualSrcs.map((_, i) => t('musee.milestone_photo_alt', { step: i + 1 }))
)

const milestones = computed(() =>
  milestoneDefs.map((d) => {
    const rawItems = tm(`musee.milestones_steps.${d.key}.items`)
    const items = Array.isArray(rawItems) ? rawItems : []
    return {
      label: t(`musee.milestones_steps.${d.key}.label`),
      year: d.year,
      status: d.status,
      items
    }
  })
)

const descriptionObjectives = computed(() => {
  const raw = tm('musee.description_objectives')
  return Array.isArray(raw) ? raw : []
})

const galleryPhotos = computed(() => {
  const alt = t('musee.gallery_image_alt')
  return museeGallerySrcs.map((src) => ({ src, alt }))
})

let observer = null
function observeFadeUps () {
  if (!observer) return
  document.querySelectorAll('.fade-in-up:not(.observed)').forEach((el) => {
    el.classList.add('observed')
    observer.observe(el)
  })
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  )
  observeFadeUps()
  nextTick(() => observeFadeUps())
})
onUnmounted(() => { if (observer) observer.disconnect() })
</script>
