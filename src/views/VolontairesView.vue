<template>
  <div>
    <PageHero
      :title="$t('volontaires.hero_title')"
      :subtitle="$t('volontaires.hero_subtitle')"
      image="/images/hero-volontaires.jpg"
    />

    <!-- Pourquoi partir -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <SectionTitle>{{ $t('volontaires.why_title') }}</SectionTitle>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in whyItems"
            :key="item.key"
            class="fade-in-up group relative p-6 rounded-2xl bg-white border border-night/5 hover:border-forest/20 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
              :style="{ backgroundColor: item.color + '15' }">
              <component :is="item.icon" :size="24" weight="duotone" class="transition-colors duration-300" :style="{ color: item.color }" />
            </div>
            <h3 class="text-base font-serif font-bold text-night mb-2 group-hover:text-forest transition-colors">
              {{ $t(`volontaires.why_items.${item.key}.title`) }}
            </h3>
            <p class="text-night/55 text-sm leading-relaxed">
              {{ $t(`volontaires.why_items.${item.key}.text`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Process -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <TheProcessSteps
          :steps="processSteps"
          :heading-kicker="$t('volontaires.process_kicker')"
          :heading-title="$t('volontaires.process_title')"
          trail-bird-src="/images/collibri-akuu.png"
          :trail-bird-alt="$t('common.colibri_trail_alt')"
        />
      </div>
    </section>

    <!-- Types de missions -->
    <section class="section-padding bg-forest text-white">
      <div class="container-narrow">
        <SectionTitle :light="true">{{ $t('volontaires.missions_title') }}</SectionTitle>
        <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div
            v-for="mission in missions"
            :key="mission.key"
            class="fade-in-up group p-7 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/14 hover:border-white/25 transition-all duration-300"
          >
            <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors duration-300">
              <component :is="mission.icon" :size="20" weight="duotone" class="text-leaf" />
            </div>
            <h3 class="text-lg font-serif font-bold mb-2">
              {{ $t(`volontaires.missions.${mission.key}.title`) }}
            </h3>
            <p class="text-white/75 text-sm leading-relaxed">
              {{ $t(`volontaires.missions.${mission.key}.text`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Témoignages : une colonne, photo cliquable (lightbox) + texte à côté -->
    <section class="section-padding bg-cream pb-8 md:pb-10 lg:pb-12">
      <div class="container-narrow">
        <h2 class="text-center text-3xl md:text-4xl font-serif font-bold text-night mb-3 md:mb-4">
          {{ $t('volontaires.testimonials_title') }}
        </h2>
        <div class="mx-auto mb-10 flex max-w-md items-center justify-center gap-2 md:mb-12">
          <span class="block h-0.5 w-10 rounded-full bg-forest md:w-12" />
          <PhLeaf :size="16" weight="fill" class="text-forest" aria-hidden="true" />
          <span class="block h-0.5 w-10 rounded-full bg-forest md:w-12" />
        </div>

        <div class="flex flex-col gap-6 md:gap-8">
          <article
            v-for="temoignage in temoignagesList"
            :key="temoignage.id"
            class="fade-in-up mx-auto flex w-full max-w-4xl flex-col gap-5 rounded-2xl bg-white p-5 shadow-md ring-1 ring-night/5 transition hover:shadow-lg sm:flex-row sm:items-start sm:gap-6 md:p-6"
          >
            <button
              type="button"
              class="group/photo mx-auto w-full max-w-[280px] shrink-0 cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-night/10 transition hover:ring-forest/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 sm:mx-0 sm:max-w-none sm:w-48 md:w-56"
              :aria-label="$t('common.team_lightbox_expand')"
              @click="openTestimonialLightbox(temoignage.id, temoignage.photo)"
            >
              <img
                :src="temoignage.photo"
                :alt="$t(`volontaires.testimonials.${temoignage.id}.photo_alt`)"
                class="aspect-[3/4] w-full object-cover object-center transition duration-300 group-hover/photo:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </button>
            <div class="min-w-0 flex-1">
              <blockquote
                class="border-l-2 border-leaf py-0.5 pl-3 text-sm font-serif leading-relaxed text-night/85 md:pl-3.5 md:text-[0.9375rem]"
              >
                <p class="text-pretty">{{ $t(`volontaires.testimonials.${temoignage.id}.quote`) }}</p>
              </blockquote>
              <div class="mt-4 border-t border-night/10 pt-3">
                <p class="text-sm font-semibold leading-tight text-night">
                  {{ $t(`volontaires.testimonials.${temoignage.id}.name`) }}
                </p>
                <p class="mt-0.5 text-[11px] leading-snug text-night/45">
                  {{ $t(`volontaires.testimonials.${temoignage.id}.mission`) }} · {{ temoignage.annee }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <p class="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-night/80 md:mt-10 md:text-[0.9375rem]">
          {{ $t('volontaires.testimonials_submit_intro') }}
          <a
            href="mailto:testimonials@akuu.org"
            class="font-semibold text-forest underline decoration-forest/35 underline-offset-2 transition hover:text-forest/90 hover:decoration-forest"
          >testimonials@akuu.org</a>.
        </p>

        <ImagePreviewLightbox
          v-model="testimonialLightboxOpen"
          :image-src="testimonialLightboxSrc"
          :image-alt="testimonialLightboxAlt"
        />

        <div class="mt-5 flex justify-center fade-in-up md:mt-6">
          <router-link
            to="/contact"
            class="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-forest/90 hover:gap-3"
          >
            {{ $t('volontaires.cta_button') }}
            <PhArrowRight :size="16" class="shrink-0" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- Vidéo : La vie à Puerto Miguel -->
    <section class="section-padding bg-white pt-8 md:pt-10 lg:pt-12">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('volontaires.video_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('volontaires.video_title') }}</h2>
        </div>
        <VideoEmbed
          video-id="dVRrRclq1i8"
          :title="$t('volontaires.video_title')"
        />
      </div>
    </section>

    <!-- CTA -->
    <CTABanner
      :title="$t('volontaires.cta_title')"
      :text="$t('volontaires.cta_text')"
      :cta-label="$t('volontaires.cta_button')"
      cta-url="/contact"
      :show-icon="false"
      :show-tax-info="false"
      variant="forest"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '@/store'
import PageHero from '@/components/shared/PageHero.vue'
import SectionTitle from '@/components/shared/SectionTitle.vue'
import CTABanner from '@/components/shared/CTABanner.vue'
import TheProcessSteps from '@/components/shared/TheProcessSteps.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import ImagePreviewLightbox from '@/components/shared/ImagePreviewLightbox.vue'
import {
  PhGlobe,
  PhLightning,
  PhGraduationCap,
  PhUsersThree,
  PhStar,
  PhHandHeart,
  PhBriefcase,
  PhArrowRight,
  PhLeaf
} from '@phosphor-icons/vue'

const store = useDataStore()
const { t } = useI18n()

const testimonialLightboxOpen = ref(false)
const testimonialLightboxSrc = ref('')
const testimonialLightboxAlt = ref('')

function openTestimonialLightbox (id, src) {
  testimonialLightboxSrc.value = src
  testimonialLightboxAlt.value = t(`volontaires.testimonials.${id}.photo_alt`)
  testimonialLightboxOpen.value = true
}

const temoignagesList = computed(() => store.volontairesInfo.temoignages)

const whyItems = [
  { key: 'immersion', color: '#2D6915', icon: PhGlobe },
  { key: 'impact', color: '#04488F', icon: PhLightning },
  { key: 'skills', color: '#A6C639', icon: PhGraduationCap },
  { key: 'community', color: '#4071A6', icon: PhUsersThree }
]

const processSteps = computed(() => [
  { key: 'step1', title: t('volontaires.process_steps.step1.title'), text: t('volontaires.process_steps.step1.text') },
  { key: 'step2', title: t('volontaires.process_steps.step2.title'), text: t('volontaires.process_steps.step2.text') },
  { key: 'step3', title: t('volontaires.process_steps.step3.title'), text: t('volontaires.process_steps.step3.text') },
  { key: 'step4', title: t('volontaires.process_steps.step4.title'), text: t('volontaires.process_steps.step4.text') },
])

const missions = [
  { key: 'civique', icon: PhStar },
  { key: 'benevole', icon: PhHandHeart },
  { key: 'stage', icon: PhBriefcase }
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
