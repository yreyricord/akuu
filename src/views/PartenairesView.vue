<template>
  <div>
    <PageHero
      :title="$t('partenaires_page.hero_title')"
      :subtitle="$t('partenaires_page.hero_subtitle')"
      image="/images/hero-association.jpg"
    />

    <!-- Intro -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl text-center mx-auto">
        <p class="text-night/65 text-lg leading-relaxed fade-in-up">
          {{ $t('partenaires_page.intro') }}
        </p>
      </div>
    </section>

    <!-- Partner grid -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6 fade-in-up">
          <PartnerCard
            v-for="partner in partenaires"
            :key="partner.nom"
            :nom="partner.nom"
            :logo="partner.logo"
            :url="partner.url"
          />
        </div>
      </div>
    </section>

    <!-- CTA partnership -->
    <CTABanner
      :title="$t('partenaires_page.partnership_title')"
      :text="$t('partenaires_page.partnership_text')"
      :cta-label="$t('partenaires_page.cta_button')"
      cta-url="/contact"
      :show-icon="false"
      :show-tax-info="false"
      variant="forest"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/store'
import PageHero from '@/components/shared/PageHero.vue'
import PartnerCard from '@/components/shared/PartnerCard.vue'
import CTABanner from '@/components/shared/CTABanner.vue'

const store = useDataStore()
const partenaires = store.partenaires

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
