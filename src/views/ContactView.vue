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
                  <label>{{ $t('common.honeypot_label') }} <input name="bot-field" /></label>
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
                    enter-active-class="transition ease-out duration-300"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <div v-if="submitSuccess" class="p-4 rounded-xl bg-leaf/10 text-forest text-sm text-center font-medium">
                      {{ $t('contact.success') }}
                    </div>
                  </Transition>
                  <Transition
                    enter-active-class="transition ease-out duration-300"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <div v-if="submitError" class="p-4 rounded-xl bg-red-50 text-red-800 text-sm text-center font-medium">
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
                <a href="mailto:akuu.asso@gmail.com" class="flex items-center gap-3 text-night/60 hover:text-forest transition-colors group">
                  <div class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span class="text-sm">akuu.asso@gmail.com</span>
                </a>
                <div class="flex items-start gap-3 text-night/60">
                  <div class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span class="text-sm">{{ $t('contact.address') }}</span>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-forest/10">
                <div class="flex gap-3">
                  <a
                    href="https://www.facebook.com/AKUUAssociation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/akuu_association/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Map -->
            <div class="card overflow-hidden">
              <div class="p-4 bg-forest/5">
                <h3 class="font-serif font-bold text-night text-sm mb-1">{{ $t('contact.find_us') }}</h3>
                <p class="text-xs text-night/40">Puerto Miguel, Loreto, Pérou</p>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d10943.450983960287!2d-73.43265239704242!3d-4.540510391254221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sfr!2sfr!4v1775551587864!5m2!1sfr!2sfr"
                width="100%"
                height="250"
                style="border:0;"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
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
