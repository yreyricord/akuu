<template>
  <section ref="sectionRef" class="relative">

    <!-- Fond avec effet d'expansion au scroll -->
    <div class="absolute inset-0 overflow-hidden bg-forest" :style="expandStyle">
      <div class="absolute inset-0 pointer-events-none">
        <svg class="absolute -right-24 -top-24 w-96 h-96 text-leaf/10" viewBox="0 0 400 400" fill="currentColor">
          <circle cx="200" cy="200" r="200" />
        </svg>
        <svg class="absolute -left-16 -bottom-16 w-72 h-72 text-night/20" viewBox="0 0 300 300" fill="currentColor">
          <circle cx="150" cy="150" r="150" />
        </svg>
        <div class="absolute inset-0 opacity-5"
          style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 28px 28px;" />
      </div>
    </div>

    <!-- Contenu (non affecté par l'expansion) -->
    <div class="relative max-w-5xl mx-auto px-6 py-16 md:py-20">
      <div class="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">

        <!-- Colonne gauche : texte -->
        <div class="flex-1 fade-in-up">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-leaf/20 border border-leaf/30 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
            <span class="text-leaf text-xs font-bold uppercase tracking-widest">{{ $t('cta_banner.badge') }}</span>
          </div>

          <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-4">
            {{ title }}
          </h2>

          <p v-if="text" class="text-white/65 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
            {{ text }}
          </p>

          <!-- Badge déduction fiscale (uniquement pour les CTAs de don) -->
          <div v-if="showTaxInfo" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/15 text-white/70 text-sm mb-8">
            <PhCheckCircle :size="16" weight="fill" class="text-leaf flex-shrink-0" />
            {{ $t('cta_banner.tax_deduction') }}
          </div>

          <!-- Boutons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Lien interne -->
            <router-link
              v-if="ctaUrl && ctaUrl.startsWith('/')"
              :to="ctaUrl"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-leaf hover:bg-[#b8d440] text-night font-bold rounded-full shadow-lg shadow-leaf/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              <PhHeart v-if="showIcon" :size="16" weight="fill" />
              {{ ctaLabel }}
            </router-link>
            <!-- Lien externe -->
            <a
              v-else-if="ctaUrl"
              :href="ctaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-leaf hover:bg-[#b8d440] text-night font-bold rounded-full shadow-lg shadow-leaf/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              <PhHeart v-if="showIcon" :size="16" weight="fill" />
              {{ ctaLabel }}
            </a>

            <router-link
              v-if="secondaryUrl"
              :to="secondaryUrl"
              class="inline-flex items-center justify-center px-7 py-3.5 border border-white/25 text-white/80 hover:text-white hover:border-white/50 hover:bg-white/[0.08] font-semibold rounded-full transition-all duration-300 text-sm"
            >
              {{ secondaryLabel }}
            </router-link>
          </div>
        </div>

        <!-- Colonne droite : chiffre clé -->
        <div class="hidden md:flex flex-col items-center justify-center gap-6">
          <!-- Cercle principal -->
          <div class="relative w-52 h-52 flex-shrink-0">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#A6C639" stroke-width="1" stroke-dasharray="4 6" opacity="0.3"/>
              <circle cx="100" cy="100" r="70" fill="rgba(166,198,57,0.08)" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span class="text-5xl font-serif font-black text-leaf leading-none">10</span>
              <span class="text-white/50 text-xs uppercase tracking-widest mt-1">{{ $t('cta_banner.stat_years') }}<br>{{ $t('cta_banner.stat_years_label') }}</span>
            </div>
          </div>

          <!-- Mini stats en dessous -->
          <div class="flex gap-4 text-center">
            <div>
              <div class="text-2xl font-serif font-bold text-white">3</div>
              <div class="text-white/40 text-xs uppercase tracking-wide">{{ $t('cta_banner.stat_villages') }}</div>
            </div>
            <div class="w-px bg-white/10" />
            <div>
              <div class="text-2xl font-serif font-bold text-white">150+</div>
              <div class="text-white/40 text-xs uppercase tracking-wide">{{ $t('cta_banner.stat_benevoles') }}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PhCheckCircle, PhHeart } from '@phosphor-icons/vue'
import { useScrollExpand } from '@/composables/useScrollExpand'

const props = defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
  ctaUrl: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
  secondaryUrl: { type: String, default: '' },
  variant: { type: String, default: 'forest' },
  showIcon: { type: Boolean, default: true },
  showTaxInfo: { type: Boolean, default: true },
  noExpand: { type: Boolean, default: false }
})

const sectionRef = ref(null)
const { expandStyle: _expandStyle } = useScrollExpand(sectionRef)
const expandStyle = computed(() => props.noExpand ? {} : _expandStyle.value)
</script>
