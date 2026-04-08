<template>
  <div>
    <PageHero
      :title="$t('association.hero_title')"
      :subtitle="$t('association.hero_subtitle')"
      image="/images/hero-association.jpg"
    />

    <!-- Qui sommes-nous -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div class="fade-in-up">
            <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6">
              {{ $t('association.who_title') }}
            </h2>
            <p class="text-night/60 text-lg leading-relaxed mb-8">
              {{ $t('association.who_text') }}
            </p>
            <figure class="flex gap-5 md:gap-6 items-start">
              <div class="shrink-0 pt-1">
                <img
                  src="/images/equipe/Marlon_Diaz_2.jpg"
                  :alt="$t('association.quote_portrait_alt')"
                  class="w-[4.5rem] h-[4.5rem] md:w-24 md:h-24 rounded-2xl object-cover shadow-md ring-2 ring-forest/15"
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <blockquote class="relative pl-6 border-l-4 border-forest min-w-0 flex-1">
                <svg class="absolute -top-2 -left-1 w-8 h-8 text-forest/20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p class="text-night/70 italic text-lg leading-relaxed mb-3">
                  "{{ $t('association.quote') }}"
                </p>
                <cite class="text-forest font-semibold text-sm not-italic block mt-1">
                  {{ $t('association.quote_author') }}
                </cite>
              </blockquote>
            </figure>
          </div>
          <div class="fade-in-up rounded-2xl shadow-xl overflow-hidden bg-night/5">
            <img
              src="/images/hero-volontaires.jpg"
              :alt="$t('association.who_image_alt')"
              class="w-full h-auto block"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Nos valeurs -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <SectionTitle>{{ $t('association.values_title') }}</SectionTitle>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(value, key) in values"
            :key="key"
            class="fade-in-up p-6 rounded-2xl border border-forest/10 hover:border-forest/30 hover:shadow-lg transition-all duration-300 group"
          >
            <div class="w-14 h-14 rounded-xl bg-forest/10 flex items-center justify-center mb-4 group-hover:bg-forest transition-colors duration-300">
              <svg class="w-7 h-7 text-forest group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" v-html="value.icon" />
            </div>
            <h3 class="text-lg font-serif font-bold text-night mb-2">
              {{ $t(`association.values.${key}.title`) }}
            </h3>
            <p class="text-night/60 text-sm leading-relaxed">
              {{ $t(`association.values.${key}.text`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Équipe -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <SectionTitle>{{ $t('association.team_title') }}</SectionTitle>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <TeamCard
            v-for="member in equipe"
            :key="member.id ?? `${member.prenom}-${member.nom}`"
            :prenom="member.prenom || $t('common.placeholder_firstname')"
            :nom="member.nom || $t('common.placeholder_lastname')"
            :role="$t(`equipe.${String(member.id).toLowerCase()}.role`)"
            :photo="member.photo"
            :bio="$t(`equipe.${String(member.id).toLowerCase()}.bio`)"
          />
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="section-padding bg-cream">
      <div class="max-w-7xl mx-auto w-full">
        <div class="text-center mb-14">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('association.history_since') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('association.history_title') }}</h2>
        </div>
        <div class="relative w-full">
          <!-- Visuels : :item-visual-srcs="['/images/...', ...]" (ordre = années) ; sinon placeholders numérotés -->
          <TheTimeline
            :items="sortedTimeline"
            trail-bird-src="/images/collibri-akuu.png"
            :trail-bird-alt="$t('common.colibri_trail_alt')"
          />
        </div>
      </div>
    </section>

    <!-- Reportage ITV -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-8 md:mb-10">
          <h2 class="text-2xl md:text-3xl font-serif font-bold text-night">
            {{ $t('association.itv_section_title') }}
          </h2>
        </div>
        <div class="max-w-3xl mx-auto">
          <VideoEmbed
            v-if="itvYoutubeId"
            :video-id="itvYoutubeId"
            :title="$t('association.itv_section_title')"
          />
          <div
            v-else
            class="rounded-2xl border border-dashed border-night/20 bg-cream/80 px-6 py-12 text-center text-night/55 text-sm leading-relaxed"
          >
            {{ $t('association.itv_placeholder') }}
          </div>
        </div>
      </div>
    </section>

    <!-- Parole d'Amazonie -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('association.videos_title') }}</h2>
        </div>
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <VideoEmbed
            video-id="8j-P2ey0MMM"
            :title="$t('association.video_parole_1')"
            :caption="$t('association.video_parole_1')"
          />
          <VideoEmbed
            video-id="UXAm7o4lWek"
            :title="$t('association.video_parole_2')"
            :caption="$t('association.video_parole_2')"
          />
        </div>
      </div>
    </section>

    <!-- Réseaux sociaux -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-12 max-w-2xl mx-auto">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">
            {{ $t('association.social_kicker') }}
          </p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-4">
            {{ showInstagramSection ? $t('association.social_title') : $t('association.social_title_tiktok_only') }}
          </h2>
          <p class="text-night/60 text-lg leading-relaxed">
            {{ showInstagramSection ? $t('association.social_subtitle') : $t('association.social_subtitle_tiktok_only') }}
          </p>
        </div>

        <div class="max-w-6xl mx-auto space-y-16">
          <!-- Instagram -->
          <div v-if="showInstagramSection">
            <h3 class="text-sm font-semibold uppercase tracking-widest text-night/45 mb-6">
              {{ $t('association.social_instagram_label') }}
            </h3>
            <InstagramFeedGrid
              v-if="instagramFeed.length"
              :posts="instagramFeed"
              :profile-url="reseaux.instagram.profileUrl"
              :see-all-label="$t('association.social_see_all_instagram')"
            />
            <InstagramPostEmbed
              v-else
              :source="reseaux.instagram.postUrlOrShortcode"
              :profile-url="reseaux.instagram.profileUrl"
              :title="$t('association.social_instagram_title')"
              :cta-text="$t('association.social_instagram_cta')"
              :hint-text="$t('association.social_fallback_instagram')"
            />
          </div>

          <!-- TikTok -->
          <div>
            <h3
              v-if="showInstagramSection"
              class="text-sm font-semibold uppercase tracking-widest text-night/45 mb-6"
            >
              {{ $t('association.social_tiktok_label') }}
            </h3>
            <TikTokFeedGrid
              v-if="tiktokFeed.length"
              :videos="tiktokFeed"
              :profile-url="reseaux.tiktok.profileUrl"
              :see-all-label="$t('association.social_see_all_tiktok')"
              :open-on-tiktok-label="$t('association.social_open_on_tiktok')"
            />
            <div
              v-else-if="manualTiktokUrls.length"
              class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            >
              <TikTokEmbed
                v-for="(url, idx) in manualTiktokUrls"
                :key="`${url}-${idx}`"
                :video-url="url"
                :profile-url="reseaux.tiktok.profileUrl"
                :title="$t('association.social_tiktok_title')"
                :cta-text="$t('association.social_tiktok_cta')"
                :hint-text="$t('association.social_fallback_tiktok')"
              />
            </div>
            <div v-else class="max-w-sm mx-auto w-full">
              <TikTokEmbed
                :video-url="reseaux.tiktok.videoUrl"
                :profile-url="reseaux.tiktok.profileUrl"
                :title="$t('association.social_tiktok_title')"
                :cta-text="$t('association.social_tiktok_cta')"
                :hint-text="$t('association.social_fallback_tiktok')"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Informations légales -->
    <section class="section-padding bg-cream">
      <div class="max-w-2xl mx-auto px-4">
        <SectionTitle>{{ $t('association.legal_title') }}</SectionTitle>
        <div class="space-y-3">
          <AccordionItem :title="$t('association.legal.siret').split(':')[0]">
            <p>{{ $t('association.legal.siret') }}</p>
          </AccordionItem>
          <AccordionItem :title="$t('association.legal.rna').split(':')[0]">
            <p>{{ $t('association.legal.rna') }}</p>
          </AccordionItem>
          <AccordionItem :title="$t('association.legal_accordion_siege')">
            <p>{{ $t('association.legal.siege') }}</p>
          </AccordionItem>
          <AccordionItem :title="$t('association.legal_accordion_contact')">
            <p>{{ $t('association.legal.contact') }}</p>
          </AccordionItem>
        </div>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/store'
import PageHero from '@/components/shared/PageHero.vue'
import SectionTitle from '@/components/shared/SectionTitle.vue'
import TheTimeline from '@/components/shared/TheTimeline.vue'
import TeamCard from '@/components/shared/TeamCard.vue'
import AccordionItem from '@/components/shared/AccordionItem.vue'
import DonSection from '@/components/home/DonSection.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import InstagramPostEmbed from '@/components/shared/InstagramPostEmbed.vue'
import InstagramFeedGrid from '@/components/shared/InstagramFeedGrid.vue'
import TikTokEmbed from '@/components/shared/TikTokEmbed.vue'
import TikTokFeedGrid from '@/components/shared/TikTokFeedGrid.vue'
import reseauxAssociation from '@/data/reseaux-association.json'
import associationMedia from '@/data/association-media.json'

const store = useDataStore()

/** ID YouTube du reportage ITV : .env VITE_ASSOCIATION_ITV_YOUTUBE_ID ou association-media.json */
const itvYoutubeId = (
  String(import.meta.env.VITE_ASSOCIATION_ITV_YOUTUBE_ID || '').trim() ||
  String(associationMedia.itvYoutubeVideoId || '').trim()
)
const reseaux = reseauxAssociation

const instagramFeed = ref([])
const tiktokFeed = ref([])

const manualTiktokUrls = computed(() => {
  const fromFeed = reseaux.feed?.tiktokVideoUrls
  if (Array.isArray(fromFeed) && fromFeed.length) return fromFeed.filter(Boolean)
  if (reseaux.tiktok?.videoUrl) return [reseaux.tiktok.videoUrl]
  return []
})

const showInstagramSection = computed(
  () =>
    instagramFeed.value.length > 0 ||
    !!(reseaux.instagram?.postUrlOrShortcode && String(reseaux.instagram.postUrlOrShortcode).trim())
)

function socialFeedRequestUrl() {
  const ig = reseaux.feed?.instagramLimit ?? 6
  const tt = reseaux.feed?.tiktokLimit ?? 6
  const qs = new URLSearchParams({
    instagramLimit: String(ig),
    tiktokLimit: String(tt)
  })
  const path = `/.netlify/functions/social-feed?${qs}`
  if (import.meta.env.PROD) return path
  const origin = import.meta.env.VITE_NETLIFY_FUNCTIONS_ORIGIN || ''
  return origin ? `${origin.replace(/\/$/, '')}${path}` : ''
}

async function loadSocialFeed() {
  const url = socialFeedRequestUrl()
  if (!url) return

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data.instagram) && data.instagram.length) {
      instagramFeed.value = data.instagram
    }
    if (Array.isArray(data.tiktok) && data.tiktok.length) {
      tiktokFeed.value = data.tiktok
    }
  } catch {
    /* replis déjà affichés (JSON / cartes) */
  } finally {
    clearTimeout(t)
  }
}

const sortedTimeline = store.sortedTimeline
const equipe = store.equipe

const values = {
  durable: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />'
  },
  solidarite: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />'
  },
  culture: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />'
  },
  savoirs: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-7.342m0 0a3.722 3.722 0 0 0-3.741 0" />'
  },
  environnement: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />'
  },
  echanges: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />'
  }
}

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )
  document.querySelectorAll('.fade-in-up').forEach((el) => observer.observe(el))
  loadSocialFeed()
})

onUnmounted(() => { if (observer) observer.disconnect() })
</script>
