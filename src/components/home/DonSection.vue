<template>
  <section id="don-section" class="relative overflow-hidden bg-night">

    <!-- Fond : image forêt très sombre + overlay -->
    <div class="absolute inset-0">
      <img src="/images/hero-amazon.jpg" alt="" class="w-full h-full object-cover opacity-15" />
      <div class="absolute inset-0 bg-gradient-to-br from-forest/80 via-night/90 to-night" />
    </div>

    <!-- Formes décoratives -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <svg class="absolute right-0 top-0 w-[600px] h-[600px] text-leaf/5" viewBox="0 0 600 600" fill="currentColor">
        <circle cx="500" cy="100" r="300" />
      </svg>
      <svg class="absolute left-0 bottom-0 w-80 h-80 text-forest/30" viewBox="0 0 320 320" fill="currentColor">
        <circle cx="0" cy="320" r="300" />
      </svg>
      <div class="absolute inset-0 opacity-[0.03]"
        style="background-image: radial-gradient(circle, #A6C639 1px, transparent 1px); background-size: 32px 32px;" />
    </div>

    <div class="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
      <div class="flex flex-col lg:flex-row lg:items-center gap-16">

        <!-- Gauche : message principal -->
        <div class="flex-1 don-reveal" style="--delay:0ms">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-leaf/15 border border-leaf/25 mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
            <span class="text-leaf text-xs font-bold uppercase tracking-[0.25em]">Chaque don compte</span>
          </div>

          <h2 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
            {{ $t('donation.title') }}
          </h2>

          <p class="text-white/75 text-lg leading-relaxed mb-10 max-w-md">
            {{ $t('donation.text') }}
          </p>

          <router-link
            to="/soutenir"
            class="inline-flex items-center gap-3 px-9 py-4 bg-leaf hover:bg-[#b8d440] text-night font-bold text-base rounded-full shadow-2xl shadow-leaf/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {{ $t('donation.cta') }}
          </router-link>
        </div>

        <!-- Droite : simulateur de déduction fiscale -->
        <div class="lg:w-96 don-reveal" style="--delay:150ms">
          <div class="bg-white/8 backdrop-blur-sm border border-white/10 rounded-3xl p-7">
            <p class="text-white/50 text-xs uppercase tracking-widest font-semibold mb-6">
              {{ $t('soutien.simulator_title') }}
            </p>

            <!-- Slider -->
            <div class="mb-6">
              <div class="flex justify-between items-baseline mb-3">
                <span class="text-white/75 text-sm">{{ $t('soutien.simulator_give') }}</span>
                <span class="text-3xl font-serif font-bold text-white">
                  {{ donAmount }}€
                  <span class="text-sm font-sans font-normal text-white/40">/{{ $t('soutien.simulator_month') }}</span>
                </span>
              </div>
              <input
                v-model.number="donAmount"
                type="range" min="5" max="100" step="5"
                class="w-full h-2 rounded-full appearance-none cursor-pointer"
                style="accent-color: #A6C639;"
              />
              <div class="flex justify-between text-white/25 text-xs mt-2">
                <span>5€</span><span>50€</span><span>100€</span>
              </div>
            </div>

            <!-- Résultats -->
            <div class="grid grid-cols-3 gap-3 text-center mb-4">
              <div class="bg-white/8 rounded-2xl p-3">
                <div class="text-xl font-bold text-white">{{ annualAmount }}€</div>
                <div class="text-white/40 text-xs mt-1">{{ $t('soutien.simulator_annual') }}</div>
              </div>
              <div class="bg-leaf/20 border border-leaf/40 rounded-2xl p-3">
                <div class="text-xl font-bold text-leaf">-{{ taxReduction }}€</div>
                <div class="text-white/40 text-xs mt-1">{{ $t('soutien.simulator_reduction') }}</div>
              </div>
              <div class="bg-white/8 rounded-2xl p-3">
                <div class="text-xl font-bold text-white">{{ realCost }}€</div>
                <div class="text-white/40 text-xs mt-1">{{ $t('soutien.simulator_real') }}</div>
              </div>
            </div>

            <!-- Résumé mensuel -->
            <div class="bg-leaf/10 border border-leaf/20 rounded-2xl px-4 py-3 text-center">
              <p class="text-white/75 text-xs">
                {{ $t('soutien.simulator_monthly_label') }}
                <span class="text-leaf font-bold text-sm">{{ realCostMonthly }}€/{{ $t('soutien.simulator_month') }}</span>
              </p>
            </div>

            <p class="text-white/30 text-xs text-center mt-4">
              {{ $t('soutien.simulator_note') }}
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

useI18n()

const donAmount = ref(20)
const annualAmount    = computed(() => donAmount.value * 12)
const taxReduction    = computed(() => Math.round(annualAmount.value * 0.66))
const realCost        = computed(() => annualAmount.value - taxReduction.value)
const realCostMonthly = computed(() => Math.round((realCost.value / 12) * 100) / 100)
</script>

<style scoped>
.don-reveal {
  opacity: 0;
  transform: translateY(24px);
  animation: donReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes donReveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
