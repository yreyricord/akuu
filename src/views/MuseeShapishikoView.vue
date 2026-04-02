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
              alt="Musée Shapishiko à Puerto Miguel"
              class="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Progress tracker -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-14">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">Depuis 2023</p>
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
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">Architecture</p>
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
import { onMounted, onUnmounted } from 'vue'
import PageHero from '@/components/shared/PageHero.vue'
import PhotoGallery from '@/components/shared/PhotoGallery.vue'
import DonSection from '@/components/home/DonSection.vue'
import TheMuseeMilestones from '@/components/shared/TheMuseeMilestones.vue'
import MuseePlanViewer from '@/components/shared/MuseePlanViewer.vue'
import MuseeCoupeAnimee from '@/components/shared/MuseeCoupeAnimee.vue'

const milestones = [
  { label: 'Étude d\'impact terrain', year: '2023', status: 'done' },
  {
    label: 'Financement et rénovation',
    year: '2024',
    status: 'done',
    items: [
      'Financement FONJEP/JSI obtenu',
      'Rénovation bâtiments'
    ]
  },
  {
    label: 'Subvention, Casa AKUU et conception artistique',
    year: '2025',
    status: 'done',
    items: [
      'Subvention Ministère Culture Pérou',
      'Casa AKUU améliorée',
      'Conception artistique'
    ]
  },
  { label: 'Production des œuvres (peintures, sculptures, fibres de chambira)', year: '2026', status: 'in_progress' },
  { label: 'Ouverture partielle du musée', year: 'Sept. 2026', status: 'pending' }
]

const galleryPhotos = [
  { src: '/images/musee/galerie-musee-1.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-2.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-3.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-4.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-5.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-6.jpg', alt: 'Musée Shapishiko' },
  { src: '/images/musee/galerie-musee-7.jpg', alt: 'Musée Shapishiko' },
]

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
