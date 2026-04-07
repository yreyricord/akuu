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
              <svg class="w-6 h-6 transition-colors duration-300" :style="{ color: item.color }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
                v-html="item.icon" />
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
              <svg class="w-5 h-5 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
                v-html="mission.icon" />
            </div>
            <h3 class="text-lg font-serif font-bold mb-2">
              {{ $t(`volontaires.missions.${mission.key}.title`) }}
            </h3>
            <p class="text-white/60 text-sm leading-relaxed">
              {{ $t(`volontaires.missions.${mission.key}.text`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Témoignages -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <SectionTitle>{{ $t('volontaires.testimonials_title') }}</SectionTitle>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="temoignage in volontairesInfo.temoignages"
            :key="temoignage.id"
            class="fade-in-up card p-6"
          >
            <div class="flex items-center gap-4 mb-4">
              <img
                v-if="temoignage.photo"
                :src="temoignage.photo"
                :alt="temoignage.prenom"
                class="w-14 h-14 rounded-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                <svg class="w-7 h-7 text-forest/40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div>
                <h4 class="font-serif font-bold text-night">{{ temoignage.prenom }}</h4>
                <p class="text-xs text-night/40">{{ $t(`volontaires.testimonials.${temoignage.id}.mission`) }}, {{ temoignage.annee }}</p>
              </div>
            </div>
            <blockquote class="text-night/60 text-sm leading-relaxed italic">
              "{{ $t(`volontaires.testimonials.${temoignage.id}.quote`) }}"
            </blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- Vidéo : La vie à Puerto Miguel -->
    <section class="section-padding bg-white">
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '@/store'
import PageHero from '@/components/shared/PageHero.vue'
import SectionTitle from '@/components/shared/SectionTitle.vue'
import CTABanner from '@/components/shared/CTABanner.vue'
import TheProcessSteps from '@/components/shared/TheProcessSteps.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'

const store = useDataStore()
const volontairesInfo = store.volontairesInfo

const whyItems = [
  {
    key: 'immersion',
    color: '#2D6915',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />'
  },
  {
    key: 'impact',
    color: '#04488F',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />'
  },
  {
    key: 'skills',
    color: '#A6C639',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-7.342m0 0a3.722 3.722 0 0 0-3.741 0" />'
  },
  {
    key: 'community',
    color: '#4071A6',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />'
  }
]

const { t } = useI18n()
const processSteps = computed(() => [
  { key: 'step1', title: t('volontaires.process_steps.step1.title'), text: t('volontaires.process_steps.step1.text') },
  { key: 'step2', title: t('volontaires.process_steps.step2.title'), text: t('volontaires.process_steps.step2.text') },
  { key: 'step3', title: t('volontaires.process_steps.step3.title'), text: t('volontaires.process_steps.step3.text') },
  { key: 'step4', title: t('volontaires.process_steps.step4.title'), text: t('volontaires.process_steps.step4.text') },
])

const missions = [
  {
    key: 'civique',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />'
  },
  {
    key: 'benevole',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />'
  },
  {
    key: 'stage',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />'
  }
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
