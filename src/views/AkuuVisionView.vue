<template>
  <div>
    <PageHero
      :title="$t('akuuvision.hero_title')"
      :subtitle="$t('akuuvision.hero_subtitle')"
      image="/images/sensibilisation.jpg"
    />

    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="max-w-3xl mx-auto">
          <div class="grid md:grid-cols-2 gap-12 items-start">
            <div class="fade-in-up">
              <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-6">
                {{ $t('akuuvision.what_title') }}
              </h2>
              <p class="text-night/60 text-lg leading-relaxed mb-4">
                {{ $t('akuuvision.what_text') }}
              </p>
              <div class="flex flex-wrap gap-2 mt-6">
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest">{{ $t('akuuvision.tag_awareness') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-bleu/10 text-bleu">{{ $t('akuuvision.tag_climate') }}</span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-leaf/20 text-forest">{{ $t('akuuvision.tag_ongoing') }}</span>
              </div>
            </div>
            <div class="fade-in-up">
              <div class="p-6 rounded-2xl bg-white border border-night/[0.06] shadow-sm">
                <dl class="space-y-4 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('akuuvision.info_start') }}</dt>
                    <dd class="text-night font-semibold">2019</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('akuuvision.info_status') }}</dt>
                    <dd class="text-forest font-semibold">{{ $t('akuuvision.info_status_value') }}</dd>
                  </div>
                  <div class="border-t border-night/[0.06]" />
                  <div class="flex justify-between">
                    <dt class="text-night/40 font-medium">{{ $t('akuuvision.info_location') }}</dt>
                    <dd class="text-night font-semibold">{{ $t('akuuvision.location_value') }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vidéo -->
    <section class="section-padding bg-white">
      <div class="container-narrow max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('akuuvision.video_kicker') }}</p>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night">{{ $t('akuuvision.video_title') }}</h2>
        </div>
        <VideoEmbed
          video-id="gHu9EebMLZQ"
          :title="$t('akuuvision.hero_title')"
        />
      </div>
    </section>

    <!-- Activités -->
    <section class="section-padding bg-cream">
      <div class="container-narrow max-w-3xl mx-auto">
        <h2 class="text-2xl font-serif font-bold text-night mb-8 text-center">{{ $t('akuuvision.activities_title') }}</h2>
        <div class="grid sm:grid-cols-3 gap-6">
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('akuuvision.act_1_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('akuuvision.act_1_text') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-bleu/10 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-bleu" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('akuuvision.act_2_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('akuuvision.act_2_text') }}</p>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-night/[0.06] text-center">
            <div class="w-12 h-12 rounded-xl bg-leaf/20 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
              </svg>
            </div>
            <h3 class="font-serif font-bold text-night mb-1">{{ $t('akuuvision.act_3_title') }}</h3>
            <p class="text-xs text-night/50">{{ $t('akuuvision.act_3_text') }}</p>
          </div>
        </div>
      </div>
    </section>

    <DonSection />
  </div>
</template>

<script setup>
import PageHero from '@/components/shared/PageHero.vue'
import VideoEmbed from '@/components/shared/VideoEmbed.vue'
import DonSection from '@/components/home/DonSection.vue'
</script>
