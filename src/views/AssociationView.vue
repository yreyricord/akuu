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
            <!-- Quote fondateur -->
            <figure class="mt-8 rounded-2xl border-l-4 border-leaf bg-gradient-to-br from-forest/8 via-leaf/5 to-transparent p-6 md:p-8 shadow-sm">
              <div class="flex gap-5 md:gap-6 items-start">
                <div class="shrink-0">
                  <img
                    src="/images/equipe/Marlon_Diaz_2.jpg"
                    :alt="$t('association.quote_portrait_alt')"
                    class="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg ring-2 ring-leaf/30"
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <blockquote class="min-w-0 flex-1">
                  <PhQuotes :size="28" weight="fill" class="text-leaf/50 mb-3" aria-hidden="true" />
                  <p class="text-night/80 italic text-xl md:text-2xl font-serif leading-relaxed mb-4">
                    "{{ $t('association.quote') }}"
                  </p>
                  <cite class="not-italic flex items-center gap-2 text-forest font-semibold text-sm">
                    <span class="w-5 h-px bg-leaf inline-block" aria-hidden="true"></span>
                    {{ $t('association.quote_author') }}
                  </cite>
                </blockquote>
              </div>
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
              <component :is="value.icon" :size="28" weight="duotone" class="text-forest group-hover:text-white transition-colors duration-300" />
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
        <div class="text-center mb-10">
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
        <div class="text-center mb-8">
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
        <div class="text-center mb-8 max-w-2xl mx-auto">
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

        <div class="max-w-6xl mx-auto space-y-12">
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
import {
  PhQuotes,
  PhSun,
  PhUsersThree,
  PhBank,
  PhGlobeHemisphereWest,
  PhPuzzlePiece,
  PhArrowsLeftRight
} from '@phosphor-icons/vue'
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
  durable: { icon: PhSun },
  solidarite: { icon: PhUsersThree },
  culture: { icon: PhBank },
  savoirs: { icon: PhGlobeHemisphereWest },
  environnement: { icon: PhPuzzlePiece },
  echanges: { icon: PhArrowsLeftRight }
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
