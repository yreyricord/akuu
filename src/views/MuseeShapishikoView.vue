<template>
  <div>
    <PageHero
      :title="$t('musee.hero_title')"
      :subtitle="$t('musee.hero_subtitle')"
      image="/images/hero-musee.jpg"
    />

    <!-- Description -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div class="fade-in-up">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6">
              {{ $t('musee.description_title') }}
            </h2>
            <p class="text-night/60 text-lg leading-relaxed">
              {{ $t('musee.description_text') }}
            </p>
          </div>
          <div class="fade-in-up">
            <img
              src="/images/musee/musee-description.jpg"
              :alt="$t('musee.description_image_alt')"
              class="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Vidéo de présentation -->
    <section class="section-padding bg-white">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.video_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.video_title') }}</h2>
        </div>
        <VideoEmbed
          video-id="gOe9OiX-6WI"
          :title="$t('musee.video_title')"
        />
      </div>
    </section>

    <!-- Progress tracker -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="text-center mb-14">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.progress_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.progress_title') }}</h2>
        </div>
        <div class="relative max-w-4xl mx-auto">
          <TheMuseeMilestones :steps="milestones" />
        </div>
      </div>
    </section>

    <!-- Coupe animée interactive -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <MuseeCoupeAnimee />
      </div>
    </section>

    <!-- Plans architecturaux complets -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-10">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('musee.plans_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('musee.plans_title') }}</h2>
          <p class="text-night/50 mt-3 max-w-xl mx-auto">
            {{ $t('musee.plans_intro') }}
          </p>
        </div>
        <MuseePlanViewer />
      </div>
    </section>

    <!-- Galerie : en-tête dans PhotoGallery (CSS scoped, tailles en rem, indépendant de Tailwind) -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <PhotoGallery
          :photos="galleryPhotos"
          :headline-kicker="$t('musee.gallery_kicker')"
          :headline-title="$t('musee.gallery_title')"
          :headline-subtitle="$t('musee.gallery_subtitle')"
        />
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHero from '@/components/shared/PageHero.vue'
import PhotoGallery from '@/components/shared/PhotoGallery.vue'
import DonSection from '@/components/home/DonSection.vue'
import TheMuseeMilestones from '@/components/shared/TheMuseeMilestones.vue'
import MuseePlanViewer from '@/components/shared/MuseePlanViewer.vue'
import MuseeCoupeAnimee from '@/components/shared/MuseeCoupeAnimee.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'

const { t, tm } = useI18n()

const milestoneDefs = [
  { key: 'impact_terrain', year: '2023', status: 'done' },
  { key: 'financement', year: '2024', status: 'done' },
  { key: 'subvention_casa', year: '2025', status: 'done' },
  { key: 'production', year: '2026', status: 'in_progress' },
  { key: 'ouverture', year: 'Sept. 2026', status: 'pending' }
]

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

const gallerySrcs = [
  '/images/musee/galerie-musee-1.jpg',
  '/images/musee/galerie-musee-2.jpg',
  '/images/musee/galerie-musee-3.jpg',
  '/images/musee/galerie-musee-4.jpg',
  '/images/musee/galerie-musee-5.jpg',
  '/images/musee/galerie-musee-6.jpg',
  '/images/musee/galerie-musee-7.jpg',
  '/images/musee/galerie-musee-8.jpg',
  '/images/musee/galerie-musee-9.JPG'
]

const galleryPhotos = computed(() => {
  const alt = t('musee.gallery_image_alt')
  return gallerySrcs.map((src) => ({ src, alt }))
})

let observer = null
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )
  document.querySelectorAll('.fade-in-up').forEach((el) => observer.observe(el))
})
onUnmounted(() => { if (observer) observer.disconnect() })
</script>
