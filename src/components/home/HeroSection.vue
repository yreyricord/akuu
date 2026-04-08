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

    <!-- Couches de gradients : vignette périphérique + assombrissement bas -->
    <div class="absolute inset-0 bg-gradient-to-b from-night/70 via-night/25 to-night/80" />
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_40%,rgba(26,35,26,0.45)_100%)]" />

    <!-- Contenu principal -->
    <div class="relative z-[1] text-center text-white px-4 max-w-4xl mx-auto w-full min-h-0">

      <!-- Colibri -->
      <div class="mb-4 sm:mb-10 md:mb-12 hero-item shrink-0 flex justify-center" style="--delay: 0ms">
        <img
          src="/images/collibri-akuu.png"
          :alt="$t('hero.colibri_alt')"
          class="hero-colibri h-32 sm:h-36 md:h-44 lg:h-48 max-h-[min(12rem,22dvh)] sm:max-h-[min(13.5rem,24dvh)] md:max-h-[min(11rem,26dvh)] lg:max-h-[min(12rem,28dvh)] w-auto max-w-[min(88vw,22rem)] object-contain object-bottom drop-shadow-2xl will-change-transform"
        />
      </div>

      <!-- Label éditorial (remplace la capsule glassmorphism) -->
      <div class="flex justify-center items-center gap-4 mb-5 sm:mb-7 hero-item" style="--delay: 150ms" aria-hidden="true">
        <span class="h-px w-12 sm:w-16 bg-leaf/50"></span>
        <p class="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0.5">
          <span class="text-xs sm:text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
            {{ $t('hero.tagline_badge_lead') }}
          </span>
          <span class="text-leaf/60 text-xs leading-none select-none">◆</span>
          <span class="text-sm sm:text-base font-serif italic font-medium text-leaf leading-none">
            {{ $t('hero.tagline_badge_emphasis') }}
          </span>
        </p>
        <span class="h-px w-12 sm:w-16 bg-leaf/50"></span>
      </div>

      <!-- Ligne 1 -->
      <div class="overflow-hidden mb-1 md:mb-2">
        <h1 class="hero-item text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold leading-none tracking-tight" style="--delay: 280ms">
          {{ $t('hero.tagline_line1') }}
        </h1>
      </div>

      <!-- Ligne 2 -->
      <div class="overflow-hidden mb-5 sm:mb-8 md:mb-10">
        <h1 class="hero-item text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold italic leading-none tracking-tight text-leaf" style="--delay: 420ms">
          {{ $t('hero.tagline_line2') }}
        </h1>
      </div>

      <!-- Sous-titre -->
      <p class="hero-item text-base md:text-lg text-white/75 max-w-xl mx-auto leading-relaxed mb-7 sm:mb-9 md:mb-10" style="--delay: 560ms">
        {{ $t('hero.subtitle') }}
      </p>

      <!-- CTAs -->
      <div class="hero-item flex shrink-0 flex-col gap-3 sm:flex-row sm:gap-4 justify-center relative z-[2] mb-8 sm:mb-10" style="--delay: 700ms">
        <router-link
          to="/soutenir"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-leaf hover:bg-forest text-white rounded-full font-semibold text-base transition-all duration-300 shadow-lg shadow-leaf/40 hover:shadow-xl hover:shadow-leaf/50 hover:-translate-y-0.5 hero-cta-primary"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ $t('hero.cta_don') }}
        </router-link>
        <router-link
          to="/projets"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 hover:border-white/55 text-white rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {{ $t('hero.cta_projets') }}
        </router-link>
      </div>

    </div>

    <!-- Flèche scroll -->
    <div class="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px)+0.25rem)] left-1/2 z-[1] -translate-x-1/2 text-white/40 animate-bounce">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>
</template>

<style scoped>
/* Au moins une hauteur d'écran ; le bloc peut s'allonger si le contenu dépasse (évite de couper les CTA). */
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

@media (prefers-reduced-motion: reduce) {
  .hero-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

@keyframes heroFadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Vol 3D : trajectoire elliptique + profondeur Z + zoom scale — linear pour courbes continues */
@media (prefers-reduced-motion: no-preference) {
  .hero-colibri {
    animation: colibriHover 11s linear infinite;
    animation-delay: 0.85s;
    transform-style: preserve-3d;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .hero-cta-primary {
    animation: ctaGlow 3s ease-in-out infinite;
    animation-delay: 1.5s;
  }
}

@keyframes ctaGlow {
  0%, 100% { box-shadow: 0 8px 24px rgba(166, 198, 57, 0.4); }
  50%       { box-shadow: 0 8px 32px rgba(166, 198, 57, 0.65); }
}

/* 21 keyframes uniformément espacés (t = 0..1 par 0.05)
   X(t) = 12·sin(2πt)      — ellipse horizontale ±12 px
   Y(t) = -11·(1−cos(2πt)) — ellipse verticale  0→-22 px
   Z(t) = 15·sin(4πt)      — profondeur 2 cycles
   S(t) = 1 + 0.08·cos(4πt)— zoom 0.92 → 1.08
   R(t) = 3·cos(2πt)        — inclinaison tangentielle */
@keyframes colibriHover {
   0% { transform: translate3d(  0.0px,   0.0px,     0px) rotate( 3.0deg) scale(1.080); }
   5% { transform: translate3d(  3.7px,  -0.5px,   8.8px) rotate( 2.9deg) scale(1.065); }
  10% { transform: translate3d(  7.1px,  -2.1px,  14.3px) rotate( 2.4deg) scale(1.025); }
  15% { transform: translate3d(  9.7px,  -4.5px,  14.3px) rotate( 1.8deg) scale(0.975); }
  20% { transform: translate3d( 11.4px,  -7.6px,   8.8px) rotate( 0.9deg) scale(0.935); }
  25% { transform: translate3d( 12.0px, -11.0px,   0.0px) rotate( 0.0deg) scale(0.920); }
  30% { transform: translate3d( 11.4px, -14.4px,  -8.8px) rotate(-0.9deg) scale(0.935); }
  35% { transform: translate3d(  9.7px, -17.5px, -14.3px) rotate(-1.8deg) scale(0.975); }
  40% { transform: translate3d(  7.1px, -19.9px, -14.3px) rotate(-2.4deg) scale(1.025); }
  45% { transform: translate3d(  3.7px, -21.5px,  -8.8px) rotate(-2.9deg) scale(1.065); }
  50% { transform: translate3d(  0.0px, -22.0px,   0.0px) rotate(-3.0deg) scale(1.080); }
  55% { transform: translate3d( -3.7px, -21.5px,   8.8px) rotate(-2.9deg) scale(1.065); }
  60% { transform: translate3d( -7.1px, -19.9px,  14.3px) rotate(-2.4deg) scale(1.025); }
  65% { transform: translate3d( -9.7px, -17.5px,  14.3px) rotate(-1.8deg) scale(0.975); }
  70% { transform: translate3d(-11.4px, -14.4px,   8.8px) rotate(-0.9deg) scale(0.935); }
  75% { transform: translate3d(-12.0px, -11.0px,   0.0px) rotate( 0.0deg) scale(0.920); }
  80% { transform: translate3d(-11.4px,  -7.6px,  -8.8px) rotate( 0.9deg) scale(0.935); }
  85% { transform: translate3d( -9.7px,  -4.5px, -14.3px) rotate( 1.8deg) scale(0.975); }
  90% { transform: translate3d( -7.1px,  -2.1px, -14.3px) rotate( 2.4deg) scale(1.025); }
  95% { transform: translate3d( -3.7px,  -0.5px,  -8.8px) rotate( 2.9deg) scale(1.065); }
 100% { transform: translate3d(  0.0px,   0.0px,   0.0px) rotate( 3.0deg) scale(1.080); }
}

</style>
