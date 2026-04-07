<template>
  <section
    class="hero-home relative z-0 isolate flex flex-col items-center justify-center overflow-x-hidden pt-[7.25rem] md:pt-[8.5rem] pb-[max(6rem,env(safe-area-inset-bottom,0px)+4.5rem)]"
  >
    <!-- Image de fond -->
    <img
      src="/images/hero-amazon.jpg"
      :alt="$t('hero.image_alt')"
      class="absolute inset-0 w-full h-full object-cover"
    />
    <!-- Gradient sombre -->
    <div class="absolute inset-0 bg-gradient-to-b from-night/60 via-night/35 to-night/70" />

    <!-- Contenu principal -->
    <div class="relative z-[1] text-center text-white px-4 max-w-4xl mx-auto w-full min-h-0">

      <!-- Colibri : sous la zone du menu fixe (z-50) ; max-h évite qu’il remonte quand la fenêtre est basse -->
      <div class="mb-4 sm:mb-10 md:mb-12 hero-item shrink-0" style="--delay: 0ms">
        <img
          src="/images/collibri-akuu.png"
          :alt="$t('hero.colibri_alt')"
          class="h-32 sm:h-36 md:h-44 lg:h-48 max-h-[min(12rem,22dvh)] sm:max-h-[min(13.5rem,24dvh)] md:max-h-[min(11rem,26dvh)] lg:max-h-[min(12rem,28dvh)] w-auto max-w-[min(88vw,22rem)] mx-auto object-contain object-bottom drop-shadow-2xl"
        />
      </div>

      <!-- Badge animé -->
      <div class="flex justify-center mb-4 sm:mb-6 hero-item" style="--delay: 150ms">
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
      <div class="overflow-hidden mb-5 sm:mb-8 md:mb-10">
        <h1 class="hero-item text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold italic leading-none tracking-tight text-leaf" style="--delay: 420ms">
          {{ $t('hero.tagline_line2') }}
        </h1>
      </div>

      <!-- Sous-titre -->
      <p class="hero-item text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8 md:mb-10" style="--delay: 560ms">
        {{ $t('hero.subtitle') }}
      </p>

      <!-- CTAs : shrink-0 + z pour rester au-dessus du fond et toujours visibles (pas rognés par un hero trop court) -->
      <div class="hero-item flex shrink-0 flex-col gap-3 sm:flex-row sm:gap-4 justify-center relative z-[2]" style="--delay: 700ms">
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
    <div class="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px)+0.25rem)] left-1/2 z-[1] -translate-x-1/2 text-white/50 animate-bounce">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>
</template>

<style scoped>
/* Au moins une hauteur d’écran ; le bloc peut s’allonger si le contenu dépasse (évite de couper les CTA). */
.hero-home {
  min-height: max(37.5rem, 100vh);
}
@supports (height: 100dvh) {
  .hero-home {
    min-height: max(37.5rem, 100dvh);
  }
}

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
