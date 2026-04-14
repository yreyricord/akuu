<template>
  <div>

    <!-- ═══════════════════════════════════════════════
         HERO — SLIDER + PANEL FISCAL
    ═══════════════════════════════════════════════ -->
    <section class="relative overflow-hidden min-h-screen">
      <!-- Fond -->
      <div class="absolute inset-0 z-0">
        <img src="/images/hero-soutien.jpg" alt="" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-br from-forest/95 via-forest/85 to-night/90" />
        <!-- Particules lumineuses décoratives -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="particle particle-1" />
          <div class="particle particle-2" />
          <div class="particle particle-3" />
        </div>
      </div>

      <!-- Colibri flottant -->
      <img
        src="/images/collibri-akuu.png" alt="" aria-hidden="true"
        class="hero-colibri pointer-events-none absolute z-[2] hidden xl:block h-48 w-auto opacity-10 right-[3%] bottom-[18%]"
      />

      <div class="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 xl:px-6 pt-24 pb-8 md:pt-28">

        <!-- ── Choix de destination (compact toggle) ─────────────── -->
        <div class="mb-6 md:mb-8">
          <div class="inline-flex w-full rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-1">
            <button
              type="button"
              @click="donDestination = 'musee'"
              :class="[
                'dest-toggle flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300',
                donDestination === 'musee'
                  ? 'bg-leaf/20 text-leaf shadow-lg shadow-leaf/10 border border-leaf/30'
                  : 'text-white/50 hover:text-white/80 border border-transparent'
              ]"
            >
              <PhGlobeHemisphereWest :size="18" weight="duotone" />
              {{ $t('soutien.dest_projets_title') }}
            </button>
            <button
              type="button"
              @click="donDestination = 'fonctionnement'"
              :class="[
                'dest-toggle flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300',
                donDestination === 'fonctionnement'
                  ? 'bg-leaf/20 text-leaf shadow-lg shadow-leaf/10 border border-leaf/30'
                  : 'text-white/50 hover:text-white/80 border border-transparent'
              ]"
            >
              <PhHouseSimple :size="18" weight="duotone" />
              {{ $t('soutien.dest_fonc_title') }}
            </button>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 xl:gap-14 items-center mt-6">

          <!-- ── Colonne gauche : Hero texte ── -->
          <div class="text-white">
            <template v-if="donDestination === 'musee'">
              <span class="inline-flex items-center gap-2 text-leaf font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                <span class="w-6 h-px bg-leaf"></span>
                {{ $t('soutien.hero_projet_kicker') }}
                <span class="w-6 h-px bg-leaf"></span>
              </span>
              <h1 class="text-3xl sm:text-4xl xl:text-5xl font-serif font-bold leading-tight mb-4">
                {{ $t('soutien.hero_projet_line1') }}<span class="text-leaf">{{ $t('soutien.hero_projet_line2') }}</span>{{ $t('soutien.hero_projet_line3') }}
              </h1>
              <p class="text-white/60 text-base xl:text-lg leading-relaxed">
                {{ $t('soutien.hero_projet_body') }}
              </p>
            </template>
            <template v-else>
              <span class="inline-flex items-center gap-2 text-leaf font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                <span class="w-6 h-px bg-leaf"></span>
                {{ $t('soutien.hero_fonc_kicker') }}
                <span class="w-6 h-px bg-leaf"></span>
              </span>
              <h1 class="text-3xl sm:text-4xl xl:text-5xl font-serif font-bold leading-tight mb-4">
                {{ $t('soutien.hero_fonc_title1') }}
                <span class="text-leaf">{{ $t('soutien.hero_fonc_title2') }}</span>
              </h1>
              <p class="text-white/60 text-base xl:text-lg leading-relaxed">
                {{ $t('soutien.hero_fonc_body') }}
              </p>
            </template>

            <!-- Parallax forêt piloté par le slider -->
            <div class="mt-8 hidden lg:block">
              <ForestScrollVisual
                :external-progress="forestProgress"
                :show-decor="false"
                :on-dark="true"
                :aria-hidden="true"
              />
            </div>
          </div>

          <!-- ── Colonne droite : Widget de don ── -->
          <div>
            <div class="don-widget relative w-full bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-3xl overflow-hidden">

              <!-- Onglets fréquence (haut de la carte) -->
              <div class="grid grid-cols-2 border-b border-white/10">
                <button
                  type="button"
                  @click="donFrequency = 'monthly'"
                  :class="[
                    'relative py-3 text-sm font-bold tracking-wide transition-all duration-200',
                    donFrequency === 'monthly'
                      ? 'bg-leaf/15 text-leaf border-b-2 border-leaf'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                  ]"
                >
                  {{ $t('soutien.form_freq_monthly') }}
                  <span class="absolute -top-0.5 right-2 sm:right-4 bg-leaf text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">{{ $t('soutien.recommended') }}</span>
                </button>
                <button
                  type="button"
                  @click="donFrequency = 'once'"
                  :class="[
                    'py-3 text-sm font-bold tracking-wide transition-all duration-200',
                    donFrequency === 'once'
                      ? 'bg-white/[0.06] text-white border-b-2 border-white/50'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                  ]"
                >
                  {{ $t('soutien.form_freq_once') }}
                </button>
              </div>

              <!-- Sélecteur de durée (mensuel uniquement) -->
              <transition name="progress-slide">
                <div v-if="donFrequency === 'monthly'" class="flex items-center gap-1 px-5 sm:px-6 pt-3 pb-1">
                  <span class="text-white/35 text-[10px] uppercase tracking-widest font-semibold mr-2 shrink-0">{{ $t('soutien.duration_label') }}</span>
                  <button
                    v-for="d in DURATION_OPTIONS"
                    :key="d"
                    type="button"
                    @click="donDurationMonths = d"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
                      donDurationMonths === d
                        ? 'bg-leaf/20 text-leaf border border-leaf/30'
                        : 'text-white/40 hover:text-white/70 border border-transparent hover:border-white/15'
                    ]"
                  >
                    {{ d }} {{ $t('soutien.duration_months') }}
                  </button>
                </div>
              </transition>

              <!-- Corps : montant + slider + CTA -->
              <div class="px-5 sm:px-6 py-5">
                <!-- Montant -->
                <div class="flex items-baseline gap-1.5 mb-3">
                  <span class="text-5xl sm:text-6xl font-serif font-black text-leaf tabular-nums leading-none">{{ donAmount }}</span>
                  <span class="text-2xl font-serif text-white/50">€</span>
                  <span v-if="donFrequency === 'monthly'" class="text-white/35 text-sm ml-1">/{{ $t('soutien.simulator_month') }}</span>
                </div>

                <!-- Slider colibri -->
                <div
                  class="mb-2 py-3 colibri-slider-wrap"
                  :class="{ 'colibri-slider-wrap--burst': colibriBurstActive }"
                >
                  <input
                    type="range"
                    min="1"
                    :max="SLIDER_MAX"
                    step="1"
                    :value="sliderDisplayedValue"
                    :disabled="useCustomOverMax"
                    class="colibri-slider w-full"
                    :class="{ 'colibri-slider--disabled': useCustomOverMax }"
                    @input="onSliderInput"
                  />
                  <div class="flex justify-between text-white/20 text-[9px] sm:text-[10px] mt-1 px-0.5">
                    <span>1 €</span><span class="hidden sm:inline">20 €</span><span>50 €</span><span>100 €</span><span>{{ SLIDER_MAX }} €</span>
                  </div>
                </div>

                <!-- Montant libre -->
                <div class="mb-4">
                  <button
                    v-if="!useCustomOverMax"
                    type="button"
                    class="text-[11px] text-leaf/70 hover:text-leaf font-semibold underline underline-offset-2 decoration-leaf/25 hover:decoration-leaf transition-colors"
                    @click="openCustomAmount"
                  >
                    {{ $t('soutien.slider_more_link') }}
                  </button>
                  <div v-else class="flex flex-col sm:flex-row sm:items-end gap-2 rounded-xl border border-leaf/25 bg-white/[0.03] px-3 py-2">
                    <div class="flex-1 min-w-[10rem]">
                      <label for="don-custom-amount" class="block text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">
                        {{ $t('soutien.slider_custom_label') }}
                      </label>
                      <input
                        id="don-custom-amount" type="number" :min="CUSTOM_MIN" :max="CUSTOM_MAX" autocomplete="off" step="1" :value="donAmount"
                        class="w-full rounded-lg border border-white/15 bg-night/40 px-3 py-2 text-white text-base font-serif font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-leaf/50"
                        @input="onCustomAmountInput"
                      />
                      <p class="text-white/25 text-[10px] mt-1">{{ $t('soutien.slider_custom_help') }}</p>
                    </div>
                    <button type="button" class="shrink-0 text-xs text-white/40 hover:text-white underline underline-offset-2" @click="closeCustomAmount">
                      {{ $t('soutien.slider_back_range') }}
                    </button>
                  </div>
                </div>

                <!-- Barre de progression projet musée -->
                <transition name="progress-slide">
                  <div v-if="donDestination === 'musee'" class="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{{ $t('soutien.musee_progress_label') }}</span>
                      <span class="text-white/60 text-xs font-bold tabular-nums">
                        {{ Math.round(museeAmountEuros).toLocaleString(numberLocaleByCode[locale] || 'fr-FR') }} €
                        <span class="text-white/30 font-normal">/ {{ MUSEE_GOAL_EUROS.toLocaleString(numberLocaleByCode[locale] || 'fr-FR') }} €</span>
                      </span>
                    </div>
                    <div class="relative h-3 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-white/15 transition-all duration-500 ease-out"
                        :style="{ width: museeCollectedPct + '%' }"
                      />
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-leaf/80 to-leaf transition-all duration-300 ease-out"
                        :style="{ width: museeWithDonPct + '%' }"
                      />
                    </div>
                    <div class="flex items-center justify-between mt-1.5">
                      <span v-if="donAmount > 0" class="text-leaf text-[10px] font-semibold">
                        +{{ totalDonAmount.toLocaleString(numberLocaleByCode[locale] || 'fr-FR') }} €
                        <span class="text-white/30">{{ $t('soutien.musee_progress_your_don') }}</span>
                      </span>
                      <span class="text-white/30 text-[10px] tabular-nums ml-auto">{{ Math.round(museeWithDonPct) }}%</span>
                    </div>
                  </div>
                </transition>

                <!-- Barre de progression fonctionnement mensuel -->
                <transition name="progress-slide">
                  <div v-if="donDestination === 'fonctionnement' && isMonthly" class="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{{ $t('soutien.fonc_progress_label') }}</span>
                      <span class="text-white/60 text-xs font-bold tabular-nums">
                        {{ Math.round(monthlyAmountEuros ?? 0).toLocaleString(numberLocaleByCode[locale] || 'fr-FR') }} €
                        <span class="text-white/30 font-normal">/ {{ FONC_GOAL_MONTHLY }} € / {{ $t('soutien.simulator_month') }}</span>
                      </span>
                    </div>
                    <div class="relative h-3 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-white/15 transition-all duration-500 ease-out"
                        :style="{ width: foncCollectedPct + '%' }"
                      />
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-leaf/80 to-leaf transition-all duration-300 ease-out"
                        :style="{ width: foncWithDonPct + '%' }"
                      />
                    </div>
                    <div class="flex items-center justify-between mt-1.5">
                      <span v-if="donAmount > 0" class="text-leaf text-[10px] font-semibold">
                        +{{ donAmount.toLocaleString(numberLocaleByCode[locale] || 'fr-FR') }} € / {{ $t('soutien.simulator_month') }}
                        <span class="text-white/30">{{ $t('soutien.musee_progress_your_don') }}</span>
                      </span>
                      <span class="text-white/30 text-[10px] tabular-nums ml-auto">{{ Math.round(foncWithDonPct) }}%</span>
                    </div>
                  </div>
                </transition>

                <!-- Simulateur fiscal intégré -->
                <div class="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4 space-y-2.5">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse shrink-0"></span>
                    <span class="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{{ $t('soutien.simulator_title') }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-white/40 text-[10px] uppercase tracking-widest font-medium">{{ $t('soutien.simulator_reduction') }}</span>
                      <span class="text-leaf/60 text-[10px] ml-1">66%</span>
                    </div>
                    <span class="text-xl font-serif font-black text-leaf tabular-nums">-{{ displayTax }} <span class="text-leaf/50 text-xs font-sans">€</span><span v-if="isMonthly" class="text-leaf/50 text-xs font-sans"> / {{ $t('soutien.simulator_month') }}</span></span>
                  </div>
                  <div class="border-t border-white/[0.08] pt-2 flex items-center justify-between">
                    <span class="text-white/40 text-[10px] uppercase tracking-widest font-medium">{{ $t('soutien.simulator_real') }}</span>
                    <span class="text-2xl font-serif font-black text-white tabular-nums">{{ displayReal }} <span class="text-white/40 text-xs font-sans">€</span><span v-if="isMonthly" class="text-white/40 text-xs font-sans"> / {{ $t('soutien.simulator_month') }}</span></span>
                  </div>
                  <p class="text-white/25 text-[9px] leading-relaxed pt-1 border-t border-white/[0.05]">
                    {{ $t('soutien.simulator_note') }}
                  </p>
                </div>

                <!-- CTA pleine largeur + shimmer -->
                <button
                  @click="submitDonation"
                  :disabled="donLoading || donAmount < 1 || (useCustomOverMax && donAmount < CUSTOM_MIN)"
                  class="cta-donate group relative w-full flex items-center justify-center gap-3 bg-leaf hover:bg-leaf/90 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-leaf/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span class="cta-shimmer absolute inset-0 pointer-events-none" aria-hidden="true"></span>
                  <span v-if="donLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span v-else class="text-xl transition-transform duration-200 group-hover:translate-x-1">→</span>
                  <span class="relative">{{ $t('soutien.form_cta', { amount: donAmount }) }}<template v-if="isMonthly"> / {{ $t('soutien.simulator_month') }}</template></span>
                </button>

                <!-- Erreurs + sécurité -->
                <p v-if="donFallbackWarning" class="text-amber-200 bg-amber-900/20 border border-amber-400/20 rounded-lg text-[11px] mt-3 px-3 py-1.5">
                  {{ $t('soutien.form_fallback_warning') }}
                </p>
                <p class="text-white/25 text-[10px] mt-3 flex items-center justify-center gap-1">
                  <svg class="w-3 h-3 text-white/20 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                  {{ $t('soutien.widget_secure') }}
                </p>
              </div>
            </div>
          </div>

        </div>

        <!-- Dernières contributions : marquee dans le 1er bandeau, contour animé au scroll -->
        <div
          v-if="recentContributions.length > 0 || statsLoading"
          ref="heroFeedStripRef"
          class="mt-10 md:mt-12 w-full shrink-0"
        >
          <div
            class="hero-feed-shell relative overflow-hidden bg-night/45 backdrop-blur-md border border-white/15"
            :style="heroFeedShellStyle"
          >
            <div
              class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
              aria-hidden="true"
              style="box-shadow: inset 0 0 0 1px rgba(166,198,57,0.2);"
            />
            <div class="relative flex flex-wrap items-center gap-3 px-4 py-3 md:px-5 border-b border-white/10">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-leaf/15 border border-leaf/30">
                <span class="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse shrink-0" />
                <span class="text-leaf text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{{ $t('donation.badge') }}</span>
              </div>
              <p class="text-white/55 text-[10px] md:text-xs font-semibold uppercase tracking-widest">{{ $t('soutien.feed_title') }}</p>
            </div>
            <div class="relative py-3 md:py-3.5">
              <div v-if="statsLoading && recentContributions.length === 0" class="flex gap-3 px-4 overflow-x-auto">
                <div v-for="n in 4" :key="n" class="shrink-0 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[200px] animate-pulse">
                  <div class="w-9 h-9 rounded-full bg-white/10 shrink-0"></div>
                  <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-3 bg-white/10 rounded w-3/4"></div>
                    <div class="h-2 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
              <div v-else class="marquee-track marquee-track--hero">
                <div class="marquee-content">
                  <div
                    v-for="(c, i) in marqueeContributions"
                    :key="'h' + i"
                    class="shrink-0 flex items-center gap-3 bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-2.5 min-w-[200px] max-w-[280px]"
                  >
                    <div class="w-9 h-9 rounded-full bg-leaf/20 flex items-center justify-center text-leaf font-bold text-sm shrink-0">
                      {{ c.firstName ? c.firstName[0].toUpperCase() : '?' }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-white text-sm font-semibold truncate">
                        {{ c.firstName || $t('soutien.feed_anonymous') }}
                        <span v-if="c.city" class="text-white/40 font-normal">· {{ c.city }}</span>
                      </p>
                      <p class="text-leaf text-xs font-bold truncate">
                        {{ c.amountEuros != null ? c.amountEuros + ' €' : '—' }}
                        <span class="text-white/35 font-normal">· {{ formatContribLabel(c.formLabel) }} · {{ timeAgo(c.date) }}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         BANDEAU STATS (style AnniversaryBanner)
    ═══════════════════════════════════════════════ -->
    <section ref="statsBannerRef" class="relative overflow-hidden text-white">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <img src="/images/mission-akuu.jpg" alt="" class="h-full w-full object-cover object-center scale-105 brightness-[0.72] saturate-[0.92]" loading="lazy" decoding="async" />
        <div class="absolute inset-0 bg-gradient-to-r from-forest/78 via-night/68 to-night/80" />
      </div>

      <div class="relative z-[1] container-narrow px-4 sm:px-6 py-10 md:py-14">
        <div
          class="mx-auto max-w-6xl rounded-3xl border border-white/20 bg-night/55 px-4 py-7 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md backdrop-saturate-150 sm:px-6 md:px-8 md:py-9"
          :class="statsRevealed ? 'stats-card--in' : 'stats-card--idle'"
        >
          <div class="stats-metrics text-center">
            <div class="stat-cell">
              <span class="stat-value text-white">{{ statsCountYears }}</span>
              <span class="stat-label text-leaf text-[10px] sm:text-xs uppercase tracking-[0.12em] font-medium leading-tight text-center max-w-[7rem]">{{ $t('soutien.stat_terrain') }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-value text-white">{{ statsCountBenef }}<span class="text-leaf">+</span></span>
              <span class="stat-label text-leaf text-[10px] sm:text-xs uppercase tracking-[0.12em] font-medium leading-tight text-center max-w-[7rem]">{{ $t('soutien.stat_beneficiaires') }}</span>
            </div>
            <div class="stat-cell stat-cell--funds">
              <span class="stat-value text-white">{{ statsCountFunds }}</span>
              <span class="stat-label text-leaf text-[10px] sm:text-xs uppercase tracking-[0.12em] font-medium leading-tight text-center max-w-[11rem]">{{ $t('soutien.stat_collecte') }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-value text-white">{{ statsCountVol }}<span class="text-leaf">+</span></span>
              <span class="stat-label text-leaf text-[10px] sm:text-xs uppercase tracking-[0.12em] font-medium leading-tight text-center max-w-[7rem]">{{ $t('soutien.stat_benevoles') }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-value text-leaf">66%</span>
              <span class="stat-label text-leaf text-[10px] sm:text-xs uppercase tracking-[0.12em] font-medium leading-tight text-center max-w-[7rem]">{{ $t('soutien.stat_impots') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         3 FAÇONS DE S'ENGAGER
    ═══════════════════════════════════════════════ -->
    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="text-center mb-14 fade-in-up">
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-night mb-3">{{ $t('soutien.other_title') }}</h2>
          <p class="text-night/50 max-w-xl mx-auto">{{ $t('soutien.other_subtitle') }}</p>
        </div>

        <div class="flex flex-col gap-6 md:gap-8">
          <div class="fade-in-up group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-xl sm:p-8 md:p-10">
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-forest/5 to-leaf/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div class="relative grid gap-8 md:grid-cols-12 md:items-center md:gap-10 lg:gap-12">
              <div class="md:col-span-5 lg:col-span-4">
                <figure class="mx-auto max-w-xs md:mx-0">
                  <img src="/images/equipe/Ilona_Crozes.jpeg" :alt="$t('soutien.member_spotlight_photo_alt')" class="aspect-[4/5] w-full rounded-2xl object-cover object-center shadow-lg ring-1 ring-night/10" loading="lazy" decoding="async" />
                  <figcaption class="mt-3 text-center text-sm text-night/50 md:text-left">
                    <span class="font-semibold text-night">{{ $t('soutien.member_spotlight_name') }}</span>
                    <span class="mt-0.5 block text-xs leading-snug">{{ $t('soutien.member_spotlight_role') }}</span>
                  </figcaption>
                </figure>
              </div>
              <div class="flex flex-col md:col-span-7 lg:col-span-8">
                <span class="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
                  {{ $t('soutien.member_spotlight_kicker') }}
                </span>
                <blockquote class="mb-6 border-l-4 border-leaf pl-4 text-lg font-serif leading-relaxed text-night md:text-xl md:pl-5">
                  <p class="text-pretty">{{ $t('soutien.member_spotlight_quote') }}</p>
                </blockquote>
                <div class="mb-6 h-px w-full max-w-md bg-night/10" />
                <div class="flex flex-wrap items-center gap-3 md:gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-forest group-hover:text-white"><PhHandshake :size="24" weight="duotone" /></div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-serif text-xl font-bold text-night">{{ $t('soutien.adherer_title') }}</h3>
                    <p class="mt-1 text-sm leading-relaxed text-night/55">{{ $t('soutien.adherer_text') }}</p>
                  </div>
                </div>
                <a href="https://www.helloasso.com/associations/akuu/adhesions/adhesion-annuelle" target="_blank" rel="noopener noreferrer" class="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-forest transition-all group-hover:gap-3">
                  {{ $t('soutien.adherer_cta') }}
                  <PhArrowRight :size="16" class="shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="fade-in-up group relative bg-forest rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden text-white">
              <div class="absolute top-4 right-4 bg-leaf text-white text-xs font-bold px-3 py-1 rounded-full">{{ $t('soutien.recommended') }}</div>
              <div class="relative">
                <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300"><PhGlobeHemisphereWest :size="24" weight="duotone" /></div>
                <h3 class="text-xl font-serif font-bold mb-3">{{ $t('soutien.benevole_title') }}</h3>
                <p class="text-white/70 text-sm leading-relaxed mb-6">{{ $t('soutien.benevole_text') }}</p>
                <router-link to="/volontaires" class="inline-flex items-center gap-2 text-leaf font-semibold text-sm group-hover:gap-3 transition-all">
                  {{ $t('soutien.benevole_cta') }}
                  <PhCaretRight :size="16" />
                </router-link>
              </div>
            </div>

            <div class="fade-in-up group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-bleu/5 to-bleu-ciel/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div class="relative">
                <div class="w-14 h-14 bg-bleu/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-bleu group-hover:scale-110 transition-all duration-300"><PhBank :size="24" weight="duotone" /></div>
                <h3 class="text-xl font-serif font-bold text-night mb-3">{{ $t('soutien.partenaire_title') }}</h3>
                <p class="text-night/55 text-sm leading-relaxed mb-6">{{ $t('soutien.partenaire_text') }}</p>
                <router-link to="/contact" class="inline-flex items-center gap-2 text-bleu font-semibold text-sm group-hover:gap-3 transition-all">
                  {{ $t('soutien.partenaire_cta') }}
                  <PhCaretRight :size="16" />
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         PARTENAIRES
    ═══════════════════════════════════════════════ -->
    <section class="section-padding bg-white">
      <div class="container-narrow">
        <div class="text-center mb-12 fade-in-up">
          <p class="text-night/40 text-xs font-semibold uppercase tracking-widest mb-3">{{ $t('partners.trusted') }}</p>
          <h2 class="text-2xl font-serif font-bold text-night">{{ $t('partners.title') }}</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 sm:gap-5 md:gap-6 items-center">
          <PartnerCard v-for="partner in store.partenaires" :key="partner.nom" :nom="partner.nom" :logo="partner.logo" :url="partner.url" />
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useDataStore } from '@/store'
import PartnerCard from '@/components/shared/PartnerCard.vue'
import ForestScrollVisual from '@/components/shared/ForestScrollVisual.vue'
import { useScrollExpand } from '@/composables/useScrollExpand'
import { PhHouseSimple, PhArrowRight, PhLock, PhHandshake, PhGlobeHemisphereWest, PhBank, PhCaretRight } from '@phosphor-icons/vue'

const store = useDataStore()
const route = useRoute()
const { t, locale } = useI18n()

const numberLocaleByCode = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', pt: 'pt-BR', de: 'de-DE' }

// ── Slider principal (1–500 €) + montant libre > 500 ─────────────────────
const SLIDER_MAX = 200
const CUSTOM_MIN = 201
const CUSTOM_MAX = 100_000
const MILESTONE_EUROS = [20, 50, 100, 200, 500, 1000]

const donAmount = ref(20)
const useCustomOverMax = ref(false)
const colibriBurstActive = ref(false)
let colibriBurstTimers = []
let colibriBurstGeneration = 0

const sliderDisplayedValue = computed(() =>
  useCustomOverMax.value ? SLIDER_MAX : Math.min(SLIDER_MAX, donAmount.value)
)

const forestProgress = computed(() => {
  const linear = Math.max(0, (donAmount.value - 1) / (SLIDER_MAX - 1))
  return Math.min(1, Math.log(1 + linear * 9) / Math.log(10))
})

function onSliderInput(e) {
  const raw = Number(e.target.value)
  const v = Math.min(SLIDER_MAX, Math.max(1, Math.round(Number.isFinite(raw) ? raw : 1)))
  useCustomOverMax.value = false
  donAmount.value = v
}

function openCustomAmount() {
  const prev = donAmount.value
  useCustomOverMax.value = true
  const next = Math.max(CUSTOM_MIN, prev)
  donAmount.value = next
  if (next > prev) runColibriMilestones(prev, next)
}

function onCustomAmountInput(e) {
  const raw = e.target.valueAsNumber
  if (!Number.isFinite(raw)) return
  const prev = donAmount.value
  const v = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(raw)))
  if (v === prev) return
  donAmount.value = v
  if (v > prev) runColibriMilestones(prev, v)
}

function closeCustomAmount() {
  useCustomOverMax.value = false
  donAmount.value = Math.min(SLIDER_MAX, Math.max(1, donAmount.value))
}

function runColibriMilestones(from, to) {
  if (to <= from) return
  const crossed = MILESTONE_EUROS.filter((t) => from < t && to >= t)
  if (crossed.length === 0) return

  colibriBurstTimers.forEach(clearTimeout)
  colibriBurstTimers = []

  const gen = ++colibriBurstGeneration
  let delay = 0
  const stepMs = 580

  for (let i = 0; i < crossed.length; i++) {
    const startId = setTimeout(() => {
      if (gen !== colibriBurstGeneration) return
      colibriBurstActive.value = true
    }, delay)
    colibriBurstTimers.push(startId)

    const endId = setTimeout(() => {
      if (gen !== colibriBurstGeneration) return
      colibriBurstActive.value = false
    }, delay + 560)
    colibriBurstTimers.push(endId)

    delay += stepMs
  }
}

const donDestination = ref('musee')
const donFrequency = ref('monthly')
const donDurationMonths = ref(12)
const DURATION_OPTIONS = [3, 6, 9, 12]
const donLoading = ref(false)
const donFallbackWarning = ref(false)
const donErrorFromHA = ref(false)

const isMonthly = computed(() => donFrequency.value === 'monthly')
const totalDonAmount = computed(() => isMonthly.value ? donAmount.value * donDurationMonths.value : donAmount.value)
const taxReduction = computed(() => Math.floor(donAmount.value * 0.66))
const realCost = computed(() => donAmount.value - taxReduction.value)
const realCostMonthly = computed(() => isMonthly.value
  ? Math.round((realCost.value / 12) * 100) / 100
  : realCost.value
)

// ── Chiffres animés du panneau fiscal ────────────────────────────────────
const displayAnnual = ref(totalDonAmount.value)
const displayTax = ref(taxReduction.value)
const displayReal = ref(realCost.value)
const displayMonthlyReal = ref(realCostMonthly.value)

function animateValue(from, to, setter, duration = 250) {
  const start = performance.now()
  const diff = to - from
  function step(now) {
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    setter(Math.round((from + diff * eased) * 100) / 100)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

watch(totalDonAmount,   (n, o) => animateValue(o, n, v => { displayAnnual.value = Math.round(v) }))
watch(taxReduction,     (n, o) => animateValue(o, n, v => { displayTax.value = Math.round(v) }))
watch(realCost,         (n, o) => animateValue(o, n, v => { displayReal.value = Math.round(v) }))
watch(realCostMonthly, (n, o) => animateValue(o, n, v => {
  displayMonthlyReal.value = Math.round(v * 100) / 100
}))

watch(donAmount, (n, o) => {
  if (o === undefined) return
  if (useCustomOverMax.value) return
  if (n > o) runColibriMilestones(o, n)
})

// ── Parallaxe panneau fiscal ──────────────────────────────────────────────
const fiscalPanelRef = ref(null)
const fiscalParallax = ref(0)

function handleScroll() {
  fiscalParallax.value = -(window.scrollY * 0.06)
}

const heroFeedStripRef = ref(null)
const { expandStyle: heroFeedExpandStyle, progress: heroFeedScrollProgress } = useScrollExpand(heroFeedStripRef, {
  maxRadius: 22,
  maxMarginVw: 3.5,
  offsetVh: 10,
  triggerVh: 55
})
const heroFeedShellStyle = computed(() => ({
  ...heroFeedExpandStyle.value,
  '--hero-feed-p': String(heroFeedScrollProgress.value)
}))

// ── Stats dynamiques ──────────────────────────────────────────────────────
const STATIC_TOTAL_EUROS = 66362

const statsLoading = ref(true)
const newDonationsEuros = ref(0)
const monthlyAmountEuros = ref(null)
const museeAmountEuros = ref(0)
const recentContributions = ref([])

const MUSEE_GOAL_EUROS = 25_000
const FONC_GOAL_MONTHLY = 350
const museeCollectedPct = computed(() => Math.min(100, (museeAmountEuros.value / MUSEE_GOAL_EUROS) * 100))
const museeWithDonPct = computed(() => {
  const donated = donDestination.value === 'musee' ? totalDonAmount.value : 0
  return Math.min(100, ((museeAmountEuros.value + donated) / MUSEE_GOAL_EUROS) * 100)
})
const foncCollectedPct = computed(() => {
  const current = monthlyAmountEuros.value ?? 0
  return Math.min(100, (current / FONC_GOAL_MONTHLY) * 100)
})
const foncWithDonPct = computed(() => {
  const current = monthlyAmountEuros.value ?? 0
  const donated = donDestination.value === 'fonctionnement' && isMonthly.value ? donAmount.value : 0
  return Math.min(100, ((current + donated) / FONC_GOAL_MONTHLY) * 100)
})

const marqueeContributions = computed(() => {
  const arr = recentContributions.value
  if (arr.length === 0) return []
  return arr.length < 4 ? [...arr, ...arr, ...arr] : [...arr, ...arr]
})

// ── Stats banner counters ─────────────────────────────────────────────────
const statsBannerRef = ref(null)
const statsRevealed = ref(false)
const statsCountYears = ref('0')
const statsCountBenef = ref('0')
const statsCountFunds = ref('—')
const statsCountVol = ref('0')
let statsAnimated = false

function animateCount(target, setter, duration = 2500) {
  const stepTime = 16
  const totalSteps = Math.max(1, duration / stepTime)
  const increment = target / totalSteps
  let current = 0
  const interval = setInterval(() => {
    current += increment
    if (current >= target) {
      setter(String(target))
      clearInterval(interval)
    } else {
      setter(String(Math.round(current)))
    }
  }, stepTime)
}

function triggerStatsAnimation() {
  if (statsAnimated) return
  statsAnimated = true
  statsRevealed.value = true
  animateCount(10, v => { statsCountYears.value = v })
  animateCount(500, v => { statsCountBenef.value = v })
  animateCount(150, v => { statsCountVol.value = v })
  const totalFunds = STATIC_TOTAL_EUROS + newDonationsEuros.value
  const fundLocale = numberLocaleByCode[locale.value] || 'fr-FR'
  const stepTime = 16
  const duration = 2500
  const totalSteps = Math.max(1, duration / stepTime)
  const increment = totalFunds / totalSteps
  let current = 0
  const interval = setInterval(() => {
    current += increment
    if (current >= totalFunds) {
      statsCountFunds.value = totalFunds.toLocaleString(fundLocale) + ' €'
      clearInterval(interval)
    } else {
      statsCountFunds.value = Math.round(current).toLocaleString(fundLocale) + ' €'
    }
  }, stepTime)
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatMonthlyEuro(n) {
  const v = typeof n === 'number' && !Number.isNaN(n) ? n : 0
  const tag = numberLocaleByCode[locale.value] || 'fr-FR'
  return v.toLocaleString(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatContribLabel(formLabel) {
  return formLabel === 'musee' ? t('soutien.feed_label_musee') : t('soutien.feed_label_op')
}

function timeAgo(isoDate) {
  if (!isoDate) return ''
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return '< 1 min'
  if (hours < 1) return `${mins} min`
  if (days < 1) return `${hours} h`
  if (days < 30) return `${days} j`
  return `${Math.floor(days / 30)} mois`
}

// ── HelloAsso checkout ────────────────────────────────────────────────────
async function submitDonation() {
  if (donAmount.value < 1) return
  if (useCustomOverMax.value && donAmount.value < CUSTOM_MIN) return
  donLoading.value = true
  donFallbackWarning.value = false
  try {
    console.log('[submitDonation] calling function…')
    const res = await fetch('/.netlify/functions/helloasso-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountEuros: donAmount.value,
        destination: donDestination.value,
        frequency: donFrequency.value,
        durationMonths: donFrequency.value === 'monthly' ? donDurationMonths.value : 1
      })
    })
    const data = await res.json()
    console.log('[submitDonation] response:', JSON.stringify(data))
    if (data.redirectUrl) {
      if (data.fallback) {
        console.warn('[submitDonation] fallback! reason:', data.reason, data.debug)
        donFallbackWarning.value = true
        donLoading.value = false
        setTimeout(() => { window.open(data.redirectUrl, '_blank') }, 2500)
      } else {
        window.open(data.redirectUrl, '_blank')
        donLoading.value = false
      }
      return
    }
  } catch (err) {
    console.error('[submitDonation] fetch error:', err)
  }
  donFallbackWarning.value = true
  donLoading.value = false
  setTimeout(() => {
    window.open('https://www.helloasso.com/associations/akuu/formulaires/1', '_blank')
  }, 2500)
}

// ── Stats API ─────────────────────────────────────────────────────────────
async function loadLiveStats() {
  try {
    const res = await fetch('/.netlify/functions/helloasso-stats')
    if (!res.ok) return
    const data = await res.json()
    if (!data.live) return
    if (data.newDonationsEuros != null) newDonationsEuros.value = data.newDonationsEuros
    if (data.monthlyAmountEuros != null) monthlyAmountEuros.value = data.monthlyAmountEuros
    if (data.museeAmountEuros != null) museeAmountEuros.value = data.museeAmountEuros
    if (Array.isArray(data.recentContributions)) recentContributions.value = data.recentContributions
  } catch {
    // Silencieux
  } finally {
    statsLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
let observer = null
onMounted(() => {
  loadLiveStats()

  if (route.query.status === 'error') {
    donErrorFromHA.value = true
  }

  if (route.query.from === 'merci' || (typeof document !== 'undefined' && document.referrer?.includes('helloasso.com'))) {
    setTimeout(() => loadLiveStats(), 1000)
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible')
        if (e.target === statsBannerRef.value) triggerStatsAnimation()
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el))
  if (statsBannerRef.value) observer.observe(statsBannerRef.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('scroll', handleScroll)
  colibriBurstTimers.forEach(clearTimeout)
  colibriBurstTimers = []
})
</script>

<style scoped>
/* ── Transition panneau fonctionnement ───────────────────── */
.fonc-expand-enter-active,
.fonc-expand-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.fonc-expand-enter-from,
.fonc-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.fonc-expand-enter-to,
.fonc-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ── CTA shimmer + pulse ─────────────────────────────────── */
@keyframes ctaShimmer {
  0%   { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}
.cta-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
  animation: ctaShimmer 3s ease-in-out infinite;
}
.cta-donate:disabled .cta-shimmer { animation: none; }

@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 8px 25px rgba(166,198,57,0.3); }
  50%      { box-shadow: 0 8px 40px rgba(166,198,57,0.5), 0 0 60px rgba(166,198,57,0.15); }
}
@media (prefers-reduced-motion: no-preference) {
  .cta-donate:not(:disabled) { animation: ctaPulse 2.5s ease-in-out infinite; }
  .cta-donate:hover { animation: none; }
}

/* ── Colibri flottant ──────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  .hero-colibri {
    animation: colibriFloat 8s ease-in-out infinite;
  }
}
@keyframes colibriFloat {
  0%, 100% { transform: translate(0, 0) rotate(2deg); }
  25%      { transform: translate(-8px, -12px) rotate(-1deg); }
  50%      { transform: translate(4px, -20px) rotate(3deg); }
  75%      { transform: translate(-4px, -10px) rotate(0deg); }
}

/* ── Slider colibri ────────────────────────────────────── */
.colibri-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(166,198,57,0.25), rgba(166,198,57,0.55));
  outline: none;
  cursor: pointer;
}
.colibri-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 96px;
  height: 96px;
  border: none;
  background: url('/images/collibri-akuu.png') center/contain no-repeat;
  cursor: grab;
  filter: drop-shadow(0 2px 10px rgba(0,0,0,0.4));
  transition: transform 0.15s ease;
}
.colibri-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.2) rotate(-10deg);
}
.colibri-slider--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.colibri-slider--disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}
.colibri-slider--disabled::-moz-range-thumb {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes colibriMilestoneBurst {
    0% {
      transform: scale(1) rotate(0deg);
      filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
    }
    22% {
      transform: scale(1.38) rotate(-22deg);
      filter: drop-shadow(0 0 32px rgba(166, 198, 57, 0.95)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.35));
    }
    50% {
      transform: scale(1.2) rotate(14deg);
      filter: drop-shadow(0 0 24px rgba(166, 198, 57, 0.75));
    }
    100% {
      transform: scale(1) rotate(0deg);
      filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
    }
  }
  .colibri-slider-wrap--burst .colibri-slider::-webkit-slider-thumb {
    animation: colibriMilestoneBurst 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) both;
  }
  .colibri-slider-wrap--burst .colibri-slider::-moz-range-thumb {
    animation: colibriMilestoneBurst 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) both;
  }
}

.colibri-slider::-moz-range-thumb {
  width: 96px;
  height: 96px;
  border: none;
  background: url('/images/collibri-akuu.png') center/contain no-repeat;
  cursor: grab;
  filter: drop-shadow(0 2px 10px rgba(0,0,0,0.4));
  border-radius: 50%;
}
.colibri-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(166,198,57,0.25), rgba(166,198,57,0.55));
}

/* ── Panneau fiscal parallaxe ──────────────────────────── */
.fiscal-panel {
  will-change: transform;
  transition: transform 0.1s linear;
}

/* ── Particules lumineuses ─────────────────────────────── */
.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .particle-1 {
    width: 300px; height: 300px;
    top: 10%; left: 5%;
    background: radial-gradient(circle, rgba(166,198,57,0.08) 0%, transparent 70%);
    animation: particlePulse 8s ease-in-out infinite;
    opacity: 1;
  }
  .particle-2 {
    width: 200px; height: 200px;
    top: 50%; right: 10%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    animation: particlePulse 12s ease-in-out 3s infinite;
    opacity: 1;
  }
  .particle-3 {
    width: 150px; height: 150px;
    bottom: 15%; left: 30%;
    background: radial-gradient(circle, rgba(166,198,57,0.06) 0%, transparent 70%);
    animation: particlePulse 10s ease-in-out 6s infinite;
    opacity: 1;
  }
}
@keyframes particlePulse {
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
  50%       { transform: scale(1.4) translate(10px, -15px); opacity: 1; }
}

/* ── Bandeau stats : grille, montants sans coupure ───── */
.stats-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 0.5rem;
  align-items: start;
}
.stat-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.stat-cell--funds {
  grid-column: span 2;
}
.stat-value {
  font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  font-weight: 700;
  font-size: clamp(1.65rem, 5vw, 2.65rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stat-cell--funds .stat-value {
  font-size: clamp(1.45rem, 4.2vw, 2.35rem);
  letter-spacing: -0.02em;
}
@media (min-width: 768px) {
  .stats-metrics {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(11.5rem, 1.45fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem 0.25rem;
  }
  .stat-cell--funds {
    grid-column: span 1;
  }
  .stat-value {
    font-size: clamp(1.7rem, 2.6vw, 2.5rem);
  }
  .stat-cell--funds .stat-value {
    font-size: clamp(1.45rem, 2.1vw, 2.15rem);
  }
}
@media (min-width: 1024px) {
  .stats-metrics {
    gap: 0.75rem 0.5rem;
  }
}

/* ── Hero feed strip (scroll + lueur type DonSection) ─── */
.hero-feed-shell {
  transition: margin-left 0.12s linear, margin-right 0.12s linear, border-radius 0.12s linear, box-shadow 0.2s ease;
  box-shadow:
    0 14px 44px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.07),
    0 0 calc(10px + 32px * var(--hero-feed-p, 0)) rgba(166, 198, 57, 0.3);
}
.marquee-track--hero {
  mask-image: linear-gradient(90deg, transparent, black 4%, black 96%, transparent);
}

/* ── Stats banner card ─────────────────────────────────── */
.stats-card--idle {
  opacity: 0;
  transform: translate3d(0, 1.25rem, 0);
  transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}
.stats-card--in {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Marquee ───────────────────────────────────────────── */
.marquee-track { overflow: hidden; }
.marquee-content {
  display: flex;
  gap: 0.75rem;
  width: max-content;
  animation: marqueeScroll 25s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-content { animation: none; overflow-x: auto; }
}
@keyframes marqueeScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* ── Colibri orbitant ──────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .stats-card--idle { opacity: 1 !important; transform: none !important; transition: none; }
}

/* ── Destination toggle ───────────────────────────────── */
.dest-toggle {
  backdrop-filter: blur(12px);
}
@media (prefers-reduced-motion: no-preference) {
  .dest-toggle { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
  .dest-toggle:active { transform: scale(0.97); }
}

/* ── Progress bar slide transition ───────────────────── */
.progress-slide-enter-active,
.progress-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.progress-slide-enter-from,
.progress-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.progress-slide-enter-to,
.progress-slide-leave-from {
  opacity: 1;
  max-height: 120px;
}
</style>
