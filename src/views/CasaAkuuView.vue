<template>
  <div>
    <section class="relative">
      <PageHero
        :title="$t('casa_akuu.hero_title')"
        :subtitle="$t('casa_akuu.hero_subtitle')"
        :image="media.photo01_hero"
      />
    </section>

    <section class="section-padding bg-white border-b border-forest/10">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <figure class="fade-in-up m-0 shrink-0 min-w-0 md:order-1">
            <PhotoSlot :src="media.photo02_intro" :alt="$t('casa_akuu.photo_02_alt')" />
          </figure>
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0 md:order-2">
            <p>{{ $t('casa_akuu.intro') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('casa_akuu.construction_title') }}
            </h2>
            <p>{{ $t('casa_akuu.construction_p1') }}</p>
            <p>{{ $t('casa_akuu.construction_p2') }}</p>
          </div>
          <figure class="fade-in-up m-0 shrink-0 min-w-0">
            <PhotoSlot :src="media.photo03_construction" :alt="$t('casa_akuu.photo_03_alt')" />
          </figure>
        </div>
      </div>
    </section>

    <section class="section-padding bg-white">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <figure class="fade-in-up m-0 shrink-0 min-w-0 md:order-1">
            <PhotoSlot :src="media.photo04_renovation" :alt="$t('casa_akuu.photo_04_alt')" />
          </figure>
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0 md:order-2">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('casa_akuu.renovation_title') }}
            </h2>
            <p>{{ $t('casa_akuu.renovation_p1') }}</p>
            <p>{{ $t('casa_akuu.renovation_p2') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding bg-cream border-t border-forest/10">
      <div class="container-narrow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div class="fade-in-up space-y-5 text-night/70 text-lg leading-relaxed min-w-0">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">
              {{ $t('casa_akuu.possible_title') }}
            </h2>
            <p>{{ $t('casa_akuu.possible_p1') }}</p>
            <p>{{ $t('casa_akuu.possible_p2') }}</p>
          </div>
          <figure class="fade-in-up m-0 shrink-0 min-w-0">
            <PhotoSlot :src="media.photo05_possible" :alt="$t('casa_akuu.photo_05_alt')" />
          </figure>
        </div>
      </div>
    </section>

    <section class="section-padding bg-white border-t border-forest/10">
      <div class="container-narrow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-8 md:mb-10">
          <h2 class="text-2xl md:text-3xl font-serif font-bold text-night">
            {{ $t('casa_akuu.video_title') }}
          </h2>
        </header>
        <VideoEmbed
          video-id="ajCGhhsDTtU"
          :title="$t('casa_akuu.video_title')"
        />
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import PageHero from '@/components/shared/PageHero.vue'
import DonSection from '@/components/home/DonSection.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import PhotoSlot from '@/components/casa-akuu/CasaPhotoSlot.vue'
import { casaAkuuMedia as media } from '@/data/casa-akuu-media.js'
import { useScrollAnimation } from '@/composables/useScrollAnimation.js'

useScrollAnimation()
</script>
