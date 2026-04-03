<template>
  <section class="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
    <!-- Image de fond -->
    <img
      src="/images/hero-amazon.jpg"
      :alt="$t('hero.image_alt')"
      class="absolute inset-0 w-full h-full object-cover"
    />
    <!-- Gradient sombre -->
    <div class="absolute inset-0 bg-gradient-to-b from-night/60 via-night/35 to-night/70" />

    <!-- Contenu principal -->
    <div class="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">

      <!-- Colibri (symbole AKUU) -->
      <div class="mb-10 md:mb-12 hero-item" style="--delay: 0ms">
        <img
          src="/images/collibri-akuu.png"
          alt="AKUU"
          class="h-32 sm:h-36 md:h-44 lg:h-48 w-auto max-w-[min(88vw,22rem)] mx-auto object-contain drop-shadow-2xl"
        />
      </div>

      <!-- Badge animé -->
      <div class="flex justify-center mb-6 hero-item" style="--delay: 150ms">
        <span class="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-leaf/50 bg-leaf/10 backdrop-blur-sm text-leaf text-xs font-bold uppercase tracking-[0.3em]">
          <span class="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse flex-shrink-0" />
          {{ $t('hero.tagline_badge') }}
        </span>
      </div>

      <!-- Ligne 1 : "Préservons", grande, serif -->
      <div class="overflow-hidden mb-1 md:mb-2">
        <h1 class="hero-item text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold leading-none tracking-tight" style="--delay: 280ms">
          {{ $t('hero.tagline_line1') }}
        </h1>
      </div>

      <!-- Ligne 2 : "le vivant", italic et vert -->
      <div class="overflow-hidden mb-8 md:mb-10">
        <h1 class="hero-item text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold italic leading-none tracking-tight text-leaf" style="--delay: 420ms">
          {{ $t('hero.tagline_line2') }}
        </h1>
      </div>

      <!-- Sous-titre -->
      <p class="hero-item text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed mb-10" style="--delay: 560ms">
        {{ $t('hero.subtitle') }}
      </p>

      <!-- CTAs -->
      <div class="hero-item flex flex-col sm:flex-row gap-4 justify-center" style="--delay: 700ms">
        <router-link
          to="/projets"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/60 text-white rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {{ $t('hero.cta_projets') }}
        </router-link>
        <router-link
          to="/soutenir"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-leaf hover:bg-forest text-white rounded-full font-semibold text-base transition-all duration-300 shadow-lg shadow-leaf/30 hover:shadow-xl hover:-translate-y-0.5"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ $t('hero.cta_don') }}
        </router-link>
      </div>
    </div>

    <!-- Flèche scroll -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>
</template>

<style scoped>
.hero-item {
  opacity: 0;
  transform: translateY(28px);
  animation: heroFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes heroFadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
