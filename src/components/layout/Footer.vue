<template>
  <footer id="site-footer" class="footer-root relative z-20 bg-night text-white overflow-hidden">

    <!-- Subtle ambient glow -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="glow glow-1" />
      <div class="glow glow-2" />
    </div>

    <!-- Accent line top -->
    <div class="relative z-10 px-6 sm:px-10">
      <div class="h-px w-full max-w-[1060px] mx-auto bg-gradient-to-r from-transparent via-leaf/25 to-transparent" />
    </div>

    <!-- Colibri décoratif — absolu, hors de la grille -->
    <div class="colibri-deco pointer-events-none select-none absolute right-0 top-0 z-0 h-full flex items-center pr-6 lg:pr-14" aria-hidden="true">
      <div class="colibri-frame">
        <img
          src="/images/collibri-akuu.png"
          alt=""
          class="colibri-float h-auto w-[180px] lg:w-[220px] opacity-[0.10] drop-shadow-[0_8px_32px_rgba(166,198,57,0.08)]"
        />
      </div>
    </div>

    <!-- Main content -->
    <div class="relative z-10 px-6 sm:px-10 pt-14 pb-10">
      <div class="mx-auto max-w-[1060px] grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-16 items-center">

        <!-- Marque + manifeste + réseaux -->
        <div class="space-y-4 text-center sm:text-left">
          <router-link to="/" class="inline-flex items-center gap-3.5 group justify-center sm:justify-start">
            <img src="/images/LOGOAKUU.png" alt="AKUU" class="h-11 w-auto group-hover:scale-105 transition-transform duration-300" />
            <span class="text-2xl font-serif font-bold tracking-wide text-white group-hover:text-leaf transition-colors duration-300">AKUU</span>
          </router-link>
          <p class="text-[14px] font-serif italic text-leaf/80 leading-snug mx-auto sm:mx-0 max-w-[240px]">
            {{ $t('footer.manifeste') }}
          </p>
          <div class="flex items-center gap-2.5 pt-2 justify-center sm:justify-start">
            <a v-for="social in socials" :key="social.label" :href="social.href" target="_blank" rel="noopener noreferrer" class="social-icon" :aria-label="social.label">
              <component :is="social.component" :size="16" weight="fill" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- Liens rapides -->
        <div class="text-center sm:text-left">
          <p class="footer-label sm:text-left text-center">{{ $t('footer.nav_links_title') }}</p>
          <nav :aria-label="$t('footer.nav_links_title')">
            <ul class="space-y-3">
              <li v-for="link in navLinks" :key="link.to">
                <router-link
                  :to="link.to"
                  class="text-[13.5px] text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-2 justify-center sm:justify-start group"
                >
                  <span class="w-1 h-1 rounded-full bg-leaf/50 group-hover:bg-leaf transition-colors duration-200 shrink-0" aria-hidden="true"></span>
                  {{ $t(link.key) }}
                </router-link>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Contact + Newsletter -->
        <div class="space-y-6 text-center sm:text-left">
          <div>
            <p class="footer-label sm:text-left text-center">{{ $t('footer.contact_title') }}</p>
            <ul class="space-y-3 inline-block text-left">
              <li>
                <a href="mailto:contact@akuu.org" class="group flex items-center gap-3 text-[13.5px] text-white/55 hover:text-white transition-colors duration-200">
                  <span class="icon-box group-hover:bg-leaf/15 group-hover:border-leaf/30">
                    <PhEnvelopeSimple :size="16" aria-hidden="true" />
                  </span>
                  contact@akuu.org
                </a>
              </li>
              <li class="flex items-center gap-3">
                <span class="icon-box">
                  <PhMapPin :size="16" weight="fill" aria-hidden="true" />
                </span>
                <span class="text-[13.5px] text-white/55 leading-relaxed">{{ $t('footer.location_short') }}</span>
              </li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div>
            <p class="footer-label text-center sm:text-left">{{ $t('footer.newsletter_title') }}</p>
            <form
              v-if="!newsletterSent"
              name="newsletter"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              @submit.prevent="submitNewsletter"
              class="flex gap-2 max-w-[260px] mx-auto sm:mx-0"
            >
              <input type="hidden" name="form-name" value="newsletter" />
              <!-- Honeypot : autocomplete/tabindex évitent que le navigateur remplisse le champ → sinon Netlify classe en spam. -->
              <p class="hidden" aria-hidden="true">
                <label>{{ $t('footer.newsletter_honeypot') }}
                  <input name="bot-field" type="text" tabindex="-1" autocomplete="off" />
                </label>
              </p>
              <input
                v-model="newsletterEmail"
                type="email"
                name="email"
                autocomplete="email"
                required
                :placeholder="$t('footer.newsletter_placeholder')"
                class="newsletter-input"
              />
              <button type="submit" class="newsletter-btn" :aria-label="$t('footer.newsletter_submit')">
                <PhPaperPlaneTilt :size="16" weight="fill" aria-hidden="true" />
              </button>
            </form>
            <p v-if="newsletterError" class="text-[12px] text-red-300/90 mt-2 max-w-[260px] mx-auto sm:mx-0">{{ $t('footer.newsletter_error') }}</p>
            <p v-else-if="newsletterSent" class="text-[12px] text-leaf/80 italic">{{ $t('footer.newsletter_success') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="relative z-10 px-6 sm:px-10">
      <div class="h-px w-full max-w-[1060px] mx-auto bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
      <div class="py-4 max-w-[1060px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">

        <!-- Copyright + badges légaux -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
          <p class="text-[11px] text-white/55 font-medium tracking-wide">
            &copy; {{ new Date().getFullYear() }} AKUU
          </p>
          <span class="text-white/35 hidden sm:inline" aria-hidden="true">·</span>
          <span class="text-[11px] text-white/50 tracking-wide">{{ $t('footer.loi1901') }}</span>
          <span class="text-white/35 hidden sm:inline" aria-hidden="true">·</span>
          <span class="text-[11px] text-white/45 tracking-wide font-mono">{{ $t('footer.rna') }}</span>
        </div>

        <!-- Centre : Amazonie · France avec icône feuille -->
        <div class="flex items-center gap-1.5 text-[11px] text-white/50 tracking-wide">
          <PhLeaf :size="12" weight="fill" class="text-leaf/60 shrink-0" aria-hidden="true" />
          {{ $t('common.amazonie_france') }}
        </div>

        <!-- Sélecteur de langue -->
        <div class="flex items-center gap-1">
          <button
            v-for="lang in languages"
            :key="lang.code"
            @click="switchLang(lang.code)"
            class="lang-btn"
            :class="{ 'lang-btn--active': locale === lang.code }"
            :aria-label="lang.label"
            :aria-current="locale === lang.code ? 'true' : undefined"
          >
            {{ lang.code.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhFacebookLogo,
  PhInstagramLogo,
  PhLinkedinLogo,
  PhTiktokLogo,
  PhEnvelopeSimple,
  PhMapPin,
  PhPaperPlaneTilt,
  PhLeaf,
} from '@phosphor-icons/vue'
import { UI_LANGUAGES } from '@/config/locales.js'

const { locale } = useI18n()
const newsletterEmail = ref('')
const newsletterSent = ref(false)
const newsletterError = ref(false)

const languages = UI_LANGUAGES

function switchLang(code) {
  locale.value = code
  localStorage.setItem('akuu-locale', code)
}

async function submitNewsletter() {
  newsletterError.value = false
  const params = new URLSearchParams({
    'form-name': 'newsletter',
    email: newsletterEmail.value.trim(),
    'bot-field': '',
  })
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (res.ok) {
      newsletterSent.value = true
      newsletterEmail.value = ''
    } else {
      newsletterError.value = true
    }
  } catch {
    newsletterError.value = true
  }
}

const navLinks = [
  { to: '/association',      key: 'nav.association' },
  { to: '/projets',          key: 'nav.projets' },
  { to: '/musee-shapishiko', key: 'nav.musee' },
  { to: '/volontaires',      key: 'nav.volontaires' },
  { to: '/soutenir',         key: 'nav.soutenir' },
  { to: '/contact',          key: 'nav.contact' },
]

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/AKUUAssociation/', component: PhFacebookLogo },
  { label: 'Instagram', href: 'https://www.instagram.com/akuu_association/', component: PhInstagramLogo },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/akuu-association/', component: PhLinkedinLogo },
  { label: 'TikTok', href: 'https://www.tiktok.com/@akuu_asso', component: PhTiktokLogo },
]
</script>

<style scoped>
/* Ambient glows */
.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.glow-1 {
  width: 500px;
  height: 500px;
  top: -200px;
  right: 5%;
  background: radial-gradient(circle, rgba(166,198,57,0.035) 0%, transparent 60%);
  animation: glow-pulse 12s ease-in-out infinite;
}
.glow-2 {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -5%;
  background: radial-gradient(circle, rgba(4,72,143,0.03) 0%, transparent 60%);
  animation: glow-pulse 12s ease-in-out infinite 6s;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* Footer label */
.footer-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgb(166 198 57 / 0.7);
  margin-bottom: 1.25rem;
}

/* Icon boxes */
.icon-box {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.03);
  border: 1px solid rgb(255 255 255 / 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgb(166 198 57 / 0.7);
  transition: all 0.3s ease;
}

/* Social icons */
.social-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: rgb(255 255 255 / 0.03);
  border: 1px solid rgb(255 255 255 / 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(255 255 255 / 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.social-icon:hover {
  color: white;
  background: rgb(166 198 57);
  border-color: rgb(166 198 57 / 0.5);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgb(166 198 57 / 0.25);
}

/* Colibri : cadre avec marge pour la traînée ; animation sans fuite vers la droite */
.colibri-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem 0.75rem 0.75rem;
  overflow: visible;
  transform-style: preserve-3d;
}

/* Même trajectoire elliptique 3D que le hero, amplitude réduite (colibri plus petit) */
@media (prefers-reduced-motion: no-preference) {
  .colibri-float {
    animation: colibri-3d 11s linear infinite;
    animation-delay: 1.2s;
  }
}

@keyframes colibri-3d {
   0% { transform: translate3d(  0.0px,   0.0px,     0px) rotate( 3.0deg) scale(1.06); }
   5% { transform: translate3d(  2.8px,  -0.4px,   6.5px) rotate( 2.9deg) scale(1.048); }
  10% { transform: translate3d(  5.3px,  -1.6px,  10.7px) rotate( 2.4deg) scale(1.019); }
  15% { transform: translate3d(  7.3px,  -3.4px,  10.7px) rotate( 1.8deg) scale(0.981); }
  20% { transform: translate3d(  8.6px,  -5.7px,   6.5px) rotate( 0.9deg) scale(0.951); }
  25% { transform: translate3d(  9.0px,  -8.3px,   0.0px) rotate( 0.0deg) scale(0.940); }
  30% { transform: translate3d(  8.6px, -10.8px,  -6.5px) rotate(-0.9deg) scale(0.951); }
  35% { transform: translate3d(  7.3px, -13.1px, -10.7px) rotate(-1.8deg) scale(0.981); }
  40% { transform: translate3d(  5.3px, -14.9px, -10.7px) rotate(-2.4deg) scale(1.019); }
  45% { transform: translate3d(  2.8px, -16.1px,  -6.5px) rotate(-2.9deg) scale(1.048); }
  50% { transform: translate3d(  0.0px, -16.5px,   0.0px) rotate(-3.0deg) scale(1.060); }
  55% { transform: translate3d( -2.8px, -16.1px,   6.5px) rotate(-2.9deg) scale(1.048); }
  60% { transform: translate3d( -5.3px, -14.9px,  10.7px) rotate(-2.4deg) scale(1.019); }
  65% { transform: translate3d( -7.3px, -13.1px,  10.7px) rotate(-1.8deg) scale(0.981); }
  70% { transform: translate3d( -8.6px, -10.8px,   6.5px) rotate(-0.9deg) scale(0.951); }
  75% { transform: translate3d( -9.0px,  -8.3px,   0.0px) rotate( 0.0deg) scale(0.940); }
  80% { transform: translate3d( -8.6px,  -5.7px,  -6.5px) rotate( 0.9deg) scale(0.951); }
  85% { transform: translate3d( -7.3px,  -3.4px, -10.7px) rotate( 1.8deg) scale(0.981); }
  90% { transform: translate3d( -5.3px,  -1.6px, -10.7px) rotate( 2.4deg) scale(1.019); }
  95% { transform: translate3d( -2.8px,  -0.4px,  -6.5px) rotate( 2.9deg) scale(1.048); }
 100% { transform: translate3d(  0.0px,   0.0px,   0.0px) rotate( 3.0deg) scale(1.060); }
}

/* Newsletter input + button */
.newsletter-input {
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  color: white;
  font-size: 12.5px;
  outline: none;
  transition: border-color 0.2s;
}
.newsletter-input::placeholder { color: rgb(255 255 255 / 0.25); }
.newsletter-input:focus { border-color: rgb(166 198 57 / 0.5); }

.newsletter-btn {
  padding: 0.45rem 0.65rem;
  border-radius: 0.5rem;
  background: rgb(166 198 57 / 0.15);
  border: 1px solid rgb(166 198 57 / 0.2);
  color: rgb(166 198 57 / 0.8);
  flex-shrink: 0;
  transition: all 0.2s;
}
.newsletter-btn:hover {
  background: rgb(166 198 57);
  border-color: rgb(166 198 57);
  color: white;
}

/* Sélecteur de langue footer */
.lang-btn {
  padding: 0.2rem 0.45rem;
  border-radius: 0.375rem;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgb(255 255 255 / 0.52);
  border: 1px solid transparent;
  transition: all 0.2s;
}
.lang-btn:hover { color: rgb(255 255 255 / 0.82); }
.lang-btn--active {
  color: rgb(166 198 57);
  border-color: rgb(166 198 57 / 0.35);
  background: rgb(166 198 57 / 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .colibri-float { animation: none; }
  .social-icon:hover { transform: none; }
}
</style>
