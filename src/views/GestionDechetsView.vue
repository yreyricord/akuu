<template>
  <div>
    <section class="relative">
      <PageHero
        :title="$t('gestion_dechets.hero_title')"
        :subtitle="$t('gestion_dechets.hero_subtitle')"
        :image="media.photo01_hero"
      />
    </section>

    <section class="section-padding bg-cream border-b border-forest/10">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <figure class="fade-in-up m-0 shrink-0 min-w-0 md:order-1">
            <PhotoSlot :src="media.photo02" :alt="$t('gestion_dechets.photo_02_alt')" />
          </figure>
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0 md:order-2">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('gestion_dechets.probleme_title') }}
            </h2>
            <p>{{ $t('gestion_dechets.probleme_p1') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('gestion_dechets.projet_title') }}
            </h2>
            <p>{{ $t('gestion_dechets.projet_p1') }}</p>
            <p>{{ $t('gestion_dechets.projet_p2') }}</p>
          </div>
          <figure class="fade-in-up m-0 shrink-0 min-w-0">
            <PhotoSlot :src="media.photo03" :alt="$t('gestion_dechets.photo_03_alt')" />
          </figure>
        </div>
      </div>
    </section>

    <section class="section-padding bg-white">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <figure class="fade-in-up m-0 shrink-0 min-w-0 md:order-1">
            <PhotoSlot :src="media.photo04" :alt="$t('gestion_dechets.photo_04_alt')" />
          </figure>
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0 md:order-2">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('gestion_dechets.machines_title') }}
            </h2>
            <p>{{ $t('gestion_dechets.machines_p1') }}</p>
            <p>{{ $t('gestion_dechets.machines_p2') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream border-t border-forest/10">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('gestion_dechets.cycle_title') }}
            </h2>
            <p>{{ $t('gestion_dechets.cycle_p1') }}</p>
            <p>{{ $t('gestion_dechets.cycle_p2') }}</p>
          </div>
          <figure class="fade-in-up m-0 shrink-0 min-w-0">
            <PhotoSlot :src="media.photo05" :alt="$t('gestion_dechets.photo_05_alt')" />
          </figure>
        </div>
      </div>
    </section>

    <section class="section-padding bg-white">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <figure class="fade-in-up m-0 shrink-0 min-w-0 md:order-1">
            <PhotoSlot :src="media.photo06" :alt="$t('gestion_dechets.photo_06_alt')" />
          </figure>
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0 md:order-2">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('gestion_dechets.sensi_title') }}
            </h2>
            <p>{{ $t('gestion_dechets.sensi_p1') }}</p>
            <p>{{ $t('gestion_dechets.sensi_p2') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream border-t border-forest/10">
      <div class="container-narrow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 fade-in-up space-y-5 text-night/70 text-lg leading-relaxed text-center md:text-left">
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-night text-center md:text-left">
          {{ $t('gestion_dechets.reste_title') }}
        </h2>
        <p>{{ $t('gestion_dechets.reste_p1') }}</p>
        <p>{{ $t('gestion_dechets.reste_p2') }}</p>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import PageHero from '@/components/shared/PageHero.vue'
import DonSection from '@/components/home/DonSection.vue'
import PhotoSlot from '@/components/casa-akuu/CasaPhotoSlot.vue'
import { gestionDechetsMedia as media } from '@/data/gestion-dechets-media.js'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'

useScrollAnimation()
</script>
