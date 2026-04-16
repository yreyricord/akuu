<template>
  <div>
    <PageHero
      :title="$t('contact.hero_title')"
      :subtitle="$t('contact.hero_subtitle')"
      image="/images/hero-contact.jpg"
    />

    <section class="section-padding bg-cream">
      <div class="container-narrow">
        <div class="grid lg:grid-cols-5 gap-12">
          <!-- Form -->
          <div class="lg:col-span-3">
            <div class="card p-8">
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                @submit.prevent="handleSubmit"
              >
                <input type="hidden" name="form-name" value="contact" />
                <p class="hidden">
                  <label>{{ $t('common.honeypot_label') }} <input name="bot-field" type="text" tabindex="-1" autocomplete="off" /></label>
                </p>

                <div class="space-y-6">
                  <div>
                    <label for="name" class="block text-sm font-medium text-night mb-2">
                      {{ $t('contact.name') }} *
                    </label>
                    <input
                      id="name"
                      v-model="form.name"
                      type="text"
                      name="name"
                      autocomplete="name"
                      required
                      class="w-full px-4 py-3 rounded-xl border border-forest/20 bg-cream focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all"
                      :placeholder="$t('contact.name')"
                    />
                  </div>

                  <div>
                    <label for="email" class="block text-sm font-medium text-night mb-2">
                      {{ $t('contact.email') }} *
                    </label>
                    <input
                      id="email"
                      v-model="form.email"
                      type="email"
                      name="email"
                      autocomplete="email"
                      required
                      class="w-full px-4 py-3 rounded-xl border border-forest/20 bg-cream focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all"
                      :placeholder="$t('contact.email')"
                    />
                  </div>

                  <div>
                    <label for="subject" class="block text-sm font-medium text-night mb-2">
                      {{ $t('contact.subject') }}
                    </label>
                    <select
                      id="subject"
                      v-model="form.subject"
                      name="subject"
                      autocomplete="off"
                      class="w-full px-4 py-3 rounded-xl border border-forest/20 bg-cream focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all"
                    >
                      <option value="don">{{ $t('contact.subjects.don') }}</option>
                      <option value="volontaire">{{ $t('contact.subjects.volontaire') }}</option>
                      <option value="presse">{{ $t('contact.subjects.presse') }}</option>
                      <option value="autre">{{ $t('contact.subjects.autre') }}</option>
                    </select>
                  </div>

                  <div>
                    <label for="message" class="block text-sm font-medium text-night mb-2">
                      {{ $t('contact.message') }} *
                    </label>
                    <textarea
                      id="message"
                      v-model="form.message"
                      name="message"
                      autocomplete="off"
                      rows="5"
                      required
                      class="w-full px-4 py-3 rounded-xl border border-forest/20 bg-cream focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all resize-none"
                      :placeholder="$t('contact.message')"
                    />
                  </div>

                  <button type="submit" class="btn-primary w-full" :disabled="submitting">
                    {{ submitting ? $t('contact.sending') : $t('contact.send') }}
                  </button>

                  <Transition
                    enter-active-class="transition ease-out duration-500"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                  >
                    <div v-if="submitSuccess" role="status" aria-live="polite" class="p-6 rounded-2xl bg-leaf/10 border border-leaf/20 flex flex-col items-center gap-3 text-center">
                      <div class="check-circle">
                        <svg class="w-8 h-8 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" class="check-ring" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12l4 4 8-8" class="check-tick" />
                        </svg>
                      </div>
                      <p class="text-forest font-semibold text-sm">{{ $t('contact.success') }}</p>
                    </div>
                  </Transition>
                  <Transition
                    enter-active-class="transition ease-out duration-300"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <div v-if="submitError" role="alert" aria-live="assertive" class="p-4 rounded-xl bg-red-50 text-red-800 text-sm text-center font-medium">
                      {{ $t('contact.error') }}
                    </div>
                  </Transition>
                </div>
              </form>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-2 space-y-8">
            <div class="card p-6">
              <h3 class="font-serif font-bold text-night text-lg mb-4">
                {{ $t('contact.info_title') }}
              </h3>
              <div class="space-y-4">
                <a href="mailto:contact@akuu.org" class="flex items-center gap-3 text-night/60 hover:text-forest transition-colors group">
                  <div class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-white transition-colors">
                    <PhEnvelopeSimple :size="20" />
                  </div>
                  <span class="text-sm">contact@akuu.org</span>
                </a>
                <div class="flex items-start gap-3 text-night/60">
                  <div class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center shrink-0">
                    <PhMapPin :size="20" weight="fill" class="text-forest" />
                  </div>
                  <span class="text-sm">{{ $t('contact.address') }}</span>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-forest/10">
                <div class="flex flex-wrap gap-3">
                  <a
                    href="https://www.facebook.com/AKUUAssociation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <PhFacebookLogo :size="20" weight="fill" />
                  </a>
                  <a
                    href="https://www.instagram.com/akuu_association/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <PhInstagramLogo :size="20" weight="fill" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/akuu-association/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <PhLinkedinLogo :size="20" weight="fill" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@akuu_asso"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="TikTok"
                  >
                    <PhTiktokLogo :size="20" weight="fill" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Map -->
            <div class="card overflow-hidden">
              <div class="p-4 bg-forest/5">
                <h3 class="font-serif font-bold text-night text-sm mb-1">{{ $t('contact.find_us') }}</h3>
                <p class="text-xs text-night/40">{{ $t('contact.map_caption') }}</p>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d10943.450983960287!2d-73.43265239704242!3d-4.540510391254221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sfr!2sfr!4v1775551587864!5m2!1sfr!2sfr"
                width="100%"
                height="250"
                style="border:0;"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin"
                :title="$t('contact.map_iframe_title')"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { PhEnvelopeSimple, PhMapPin, PhFacebookLogo, PhInstagramLogo, PhLinkedinLogo, PhTiktokLogo } from '@phosphor-icons/vue'
import PageHero from '@/components/shared/PageHero.vue'

const form = reactive({
  name: '',
  email: '',
  subject: 'autre',
  message: ''
})

const submitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref(false)

async function handleSubmit() {
  submitError.value = false
  submitSuccess.value = false
  submitting.value = true
  const params = new URLSearchParams({
    'form-name': 'contact',
    name: form.name,
    email: form.email,
    subject: form.subject,
    message: form.message,
    'bot-field': ''
  })
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
    if (!res.ok) throw new Error('netlify form')
    submitSuccess.value = true
    form.name = ''
    form.email = ''
    form.subject = 'autre'
    form.message = ''
  } catch {
    submitError.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Cercle du check : se dessine via stroke-dasharray */
.check-ring {
  stroke: #A6C639;
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  animation: draw-ring 0.45s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
}

/* Coche : se dessine après le cercle */
.check-tick {
  stroke: #2D6915;
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: draw-tick 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

@keyframes draw-ring {
  to { stroke-dashoffset: 0; }
}
@keyframes draw-tick {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .check-ring, .check-tick { animation: none; stroke-dashoffset: 0; }
}
</style>
