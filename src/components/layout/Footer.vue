<template>
  <footer ref="footerEl" class="footer-root relative bg-night text-white overflow-hidden">

    <!-- Subtle ambient glow -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="glow glow-1" />
      <div class="glow glow-2" />
    </div>

    <!-- Accent line top -->
    <div class="relative z-10 px-6 sm:px-10">
      <div class="h-px w-full max-w-[920px] mx-auto bg-gradient-to-r from-transparent via-leaf/25 to-transparent" />
    </div>

    <!-- Main content : bloc centré (colibri à gauche du texte, pas collé au bord écran) -->
    <div class="relative z-10 px-6 sm:px-10 pt-14 pb-10">
      <div class="footer-cluster mx-auto max-w-[920px] flex flex-col sm:flex-row flex-wrap sm:flex-nowrap items-center sm:items-start justify-center gap-10 sm:gap-8 lg:gap-12">

        <!-- Colibri à gauche : marge intérieure pour que la traînée + l’oiseau restent dans le cadre -->
        <div class="colibri-wrap footer-reveal order-first shrink-0 w-full max-w-[200px] sm:max-w-none sm:w-[min(200px,28vw)] flex justify-center sm:justify-end sm:pr-2">
          <div class="colibri-frame">
            <img
              src="/images/collibri-akuu.png"
              alt=""
              class="colibri-float colibri-img h-auto w-full max-w-[180px] sm:max-w-[200px] opacity-[0.98] select-none drop-shadow-[0_8px_32px_rgba(166,198,57,0.12)]"
            />
          </div>
        </div>

        <!-- Marque + réseaux -->
        <div class="footer-reveal space-y-5 text-center sm:text-left min-w-0 flex-1 sm:max-w-[280px]" style="--delay: 0.08s">
          <router-link to="/" class="inline-flex items-center gap-3.5 group justify-center sm:justify-start">
            <img
              src="/images/LOGOAKUU.png"
              alt="AKUU"
              class="h-11 w-auto group-hover:scale-105 transition-transform duration-300"
            />
            <span class="text-2xl font-serif font-bold tracking-wide text-white group-hover:text-leaf transition-colors duration-300">
              AKUU
            </span>
          </router-link>
          <p class="text-[13.5px] leading-[1.7] text-white/40 mx-auto sm:mx-0 max-w-xs">
            {{ $t('footer.slogan') }}
          </p>
          <div class="flex items-center gap-2.5 pt-1 justify-center sm:justify-start">
            <a
              v-for="social in socials"
              :key="social.label"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="social-icon"
              :aria-label="social.label"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" v-html="social.icon" />
            </a>
          </div>
        </div>

        <!-- Contact -->
        <div class="footer-reveal w-full sm:w-auto sm:min-w-[220px] text-center sm:text-left" style="--delay: 0.16s">
          <p class="footer-label sm:text-left text-center">{{ $t('footer.contact_title') }}</p>
          <ul class="space-y-4 inline-block text-left">
            <li>
              <a
                href="mailto:contact@akuu.org"
                class="group flex items-center gap-3 text-[13.5px] text-white/40 hover:text-white transition-colors duration-200"
              >
                <span class="icon-box group-hover:bg-leaf/15 group-hover:border-leaf/30">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                contact@akuu.org
              </a>
            </li>
            <li class="flex items-center gap-3">
              <span class="icon-box">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </span>
              <span class="text-[13.5px] text-white/40 leading-relaxed">
                {{ $t('footer.address_line1') }}<br />{{ $t('footer.address_line2') }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar (aligné sur la largeur du bloc principal) -->
    <div class="relative z-10 px-6 sm:px-10">
      <div class="h-px w-full max-w-[920px] mx-auto bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div class="py-5 max-w-[920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-[11px] text-white/20 font-medium tracking-wide">
          &copy; {{ new Date().getFullYear() }} {{ $t('footer.copyright_detail') }}
        </p>
        <div class="flex items-center gap-2 text-[11px] text-white/20 tracking-wide">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-leaf/40 animate-pulse" />
          {{ $t('common.amazonie_france') }}
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const footerEl = ref(null)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 }
  )

  footerEl.value?.querySelectorAll('.footer-reveal').forEach((el) => {
    observer.observe(el)
  })
})

const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/AKUUAssociation/',
    icon: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/akuu_association/',
    icon: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/akuu-association/',
    icon: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@akuu_asso',
    icon: '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>',
  },
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

/* Scroll reveal */
.footer-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}
.footer-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Colibri : cadre avec marge pour la traînée ; animation sans fuite vers la droite */
.colibri-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem 0.75rem 0.75rem;
  overflow: visible;
}

@keyframes colibri-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(3px, -8px) rotate(1.2deg); }
  50% { transform: translate(-5px, -4px) rotate(-1deg); }
  75% { transform: translate(-2px, 4px) rotate(0.8deg); }
}
.colibri-float {
  animation: colibri-drift 8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .colibri-float { animation: none; }
  .social-icon:hover { transform: none; }
  .footer-reveal { opacity: 1; transform: none; transition: none; }
}
</style>
