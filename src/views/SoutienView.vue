<template>
  <div>

    <!-- ═══════════════════════════════════════════════
         HERO + WIDGET
    ═══════════════════════════════════════════════ -->
    <section class="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

      <!-- Fond photo + overlay -->
      <div class="absolute inset-0 z-0">
        <img src="/images/hero-soutien.jpg" alt="" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/80 to-forest/40" />
      </div>

      <!-- Colonne gauche -->
      <div class="relative z-10 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-32 lg:py-0 lg:w-1/2 text-white">
        <span class="inline-flex items-center gap-2 text-leaf font-semibold text-sm uppercase tracking-widest mb-6">
          <span class="w-8 h-px bg-leaf"></span>
          {{ $t('soutien.label') }}
        </span>

        <h1 class="text-4xl md:text-5xl xl:text-6xl font-serif font-bold leading-tight mb-6">
          {{ $t('soutien.hero_line1') }}<br />
          <span class="text-leaf">{{ $t('soutien.hero_line2') }}</span><br />
          {{ $t('soutien.hero_line3') }}
        </h1>

        <p class="text-white/70 text-lg leading-relaxed max-w-md mb-4">
          {{ $t('soutien.hero_text1') }}
        </p>
        <p class="text-white font-medium max-w-md mb-10">
          {{ $t('soutien.hero_text2_prefix') }}
          <span class="text-leaf">{{ $t('soutien.hero_text2_highlight') }}</span>{{ $t('soutien.hero_text2_suffix') }}
        </p>

        <!-- Simulateur de déduction fiscale -->
        <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-sm">
          <p class="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4">
            {{ $t('soutien.simulator_title') }}
          </p>

          <!-- Slider -->
          <div class="mb-5">
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-white/60 text-sm">{{ $t('soutien.simulator_give') }}</span>
              <span class="text-2xl font-serif font-bold text-white">{{ donAmount }}€
                <span class="text-sm font-sans font-normal text-white/50">/{{ $t('soutien.simulator_month') }}</span>
              </span>
            </div>
            <input
              v-model.number="donAmount"
              type="range" min="5" max="100" step="5"
              class="w-full h-2 rounded-full appearance-none cursor-pointer"
              style="accent-color: #A6C639;"
            />
            <div class="flex justify-between text-white/30 text-xs mt-1">
              <span>5€</span><span>50€</span><span>100€</span>
            </div>
          </div>

          <!-- Résultat -->
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white/10 rounded-2xl p-3">
              <div class="text-lg font-bold text-white">{{ annualAmount }}€</div>
              <div class="text-white/50 text-xs mt-0.5">{{ $t('soutien.simulator_annual') }}</div>
            </div>
            <div class="bg-leaf/20 border border-leaf/40 rounded-2xl p-3">
              <div class="text-lg font-bold text-leaf">-{{ taxReduction }}€</div>
              <div class="text-white/50 text-xs mt-0.5">{{ $t('soutien.simulator_reduction') }}</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-3">
              <div class="text-lg font-bold text-white">{{ realCost }}€</div>
              <div class="text-white/50 text-xs mt-0.5">{{ $t('soutien.simulator_real') }}</div>
            </div>
          </div>

          <!-- Résumé mensuel -->
          <div class="mt-3 bg-leaf/10 border border-leaf/20 rounded-2xl px-4 py-3 text-center">
            <p class="text-white/70 text-xs">
              {{ $t('soutien.simulator_monthly_label') }}
              <span class="text-leaf font-bold text-sm">{{ realCostMonthly }}€/{{ $t('soutien.simulator_month') }}</span>
            </p>
          </div>

          <p class="text-white/40 text-xs text-center mt-4">
            {{ $t('soutien.simulator_note') }}
          </p>
        </div>
      </div>

      <!-- Colonne droite : widget HelloAsso -->
      <div class="relative z-10 flex items-center justify-center lg:w-1/2 px-6 pb-16 lg:py-24">
        <div class="w-full max-w-md">

          <!-- Badge -->
          <div class="flex items-center gap-2 bg-leaf/20 border border-leaf/30 rounded-xl px-4 py-2.5 mb-4">
            <svg class="w-4 h-4 text-leaf shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-white text-xs font-medium">
              {{ $t('soutien.widget_badge') }}
            </p>
          </div>

          <!-- Widget HelloAsso (langue dynamique) -->
          <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <iframe
              :key="widgetSrc"
              id="haWidgetLight"
              allowtransparency="true"
              allow="payment"
              scrolling="auto"
              :src="widgetSrc"
              style="width: 100%; min-height: 500px; border: none; display: block;"
              onload="window.addEventListener('message', function(e) { const dataHeight = e.data.height; const el = document.getElementById('haWidgetLight'); if (el && dataHeight > parseFloat(el.height || 0)) { el.height = dataHeight + 'px';}})"
            />
          </div>

          <p class="text-white/40 text-xs text-center mt-3">
            {{ $t('soutien.widget_secure') }}
          </p>
        </div>
      </div>

    </section>

    <!-- ═══════════════════════════════════════════════
         STATS
    ═══════════════════════════════════════════════ -->
    <section class="bg-night text-white py-16 px-4">
      <div class="container-narrow">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div v-for="stat in stats" :key="stat.value" class="fade-in-up">
            <div class="text-3xl md:text-4xl font-serif font-bold text-leaf mb-1">{{ stat.value }}</div>
            <div class="text-white/50 text-sm">{{ $t(stat.labelKey) }}</div>
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

        <div class="grid md:grid-cols-3 gap-6">

          <!-- Adhérer -->
          <div class="fade-in-up group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-forest/5 to-leaf/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div class="relative">
              <div class="w-14 h-14 bg-forest/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-forest group-hover:scale-110 transition-all duration-300">🤝</div>
              <h3 class="text-xl font-serif font-bold text-night mb-3">{{ $t('soutien.adherer_title') }}</h3>
              <p class="text-night/55 text-sm leading-relaxed mb-6">{{ $t('soutien.adherer_text') }}</p>
              <a href="https://www.helloasso.com/associations/akuu/adhesions/adhesion-annuelle" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-forest font-semibold text-sm group-hover:gap-3 transition-all">
                {{ $t('soutien.adherer_cta') }}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>
          </div>

          <!-- Bénévole -->
          <div class="fade-in-up group relative bg-forest rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden text-white">
            <div class="absolute top-4 right-4 bg-leaf text-white text-xs font-bold px-3 py-1 rounded-full">{{ $t('soutien.recommended') }}</div>
            <div class="relative">
              <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">🌍</div>
              <h3 class="text-xl font-serif font-bold mb-3">{{ $t('soutien.benevole_title') }}</h3>
              <p class="text-white/70 text-sm leading-relaxed mb-6">{{ $t('soutien.benevole_text') }}</p>
              <router-link to="/volontaires"
                class="inline-flex items-center gap-2 text-leaf font-semibold text-sm group-hover:gap-3 transition-all">
                {{ $t('soutien.benevole_cta') }}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
            </div>
          </div>

          <!-- Partenaire -->
          <div class="fade-in-up group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-bleu/5 to-bleu-ciel/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div class="relative">
              <div class="w-14 h-14 bg-bleu/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-bleu group-hover:scale-110 transition-all duration-300">🏛️</div>
              <h3 class="text-xl font-serif font-bold text-night mb-3">{{ $t('soutien.partenaire_title') }}</h3>
              <p class="text-night/55 text-sm leading-relaxed mb-6">{{ $t('soutien.partenaire_text') }}</p>
              <router-link to="/contact"
                class="inline-flex items-center gap-2 text-bleu font-semibold text-sm group-hover:gap-3 transition-all">
                {{ $t('soutien.partenaire_cta') }}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
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
        <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
          <PartnerCard
            v-for="partner in store.partenaires"
            :key="partner.nom"
            :nom="partner.nom"
            :logo="partner.logo"
            :url="partner.url"
          />
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '@/store'
import PartnerCard from '@/components/shared/PartnerCard.vue'

const store = useDataStore()
const { locale } = useI18n()

const donAmount = ref(20)

const annualAmount = computed(() => donAmount.value * 12)
const taxReduction = computed(() => Math.round(annualAmount.value * 0.66))
const realCost = computed(() => annualAmount.value - taxReduction.value)
const realCostMonthly = computed(() => Math.round((realCost.value / 12) * 100) / 100)

// Langue du widget HelloAsso : fr pour français, en pour tout le reste
const widgetLang = computed(() => locale.value === 'fr' ? 'fr' : 'en')
const widgetSrc = computed(() =>
  `https://www.helloasso.com/associations/akuu/formulaires/1/widget?view=form&lang=${widgetLang.value}`
)

const stats = [
  { value: '10 ans', labelKey: 'soutien.stat_terrain' },
  { value: '500+',  labelKey: 'soutien.stat_beneficiaires' },
  { value: '30+',   labelKey: 'soutien.stat_benevoles' },
  { value: '66%',   labelKey: 'soutien.stat_impots' }
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
