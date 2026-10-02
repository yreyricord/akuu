<template>
  <div class="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-forest-50 to-cream px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-night-100 bg-white p-6 shadow-xl sm:p-8">
      <div class="text-center">
        <router-link to="/" class="inline-block" aria-label="AKUU — accueil">
          <img src="/images/LOGOAKUU.png" alt="AKUU" class="mx-auto h-14 w-auto sm:h-16" />
        </router-link>
        <p class="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-forest">Espace adhérent</p>
        <h1 class="mt-1 font-serif text-2xl font-bold text-night">Mot de passe oublié</h1>
        <p class="mt-2 text-sm text-night-400">
          Saisissez l'email de votre compte AKUU. Nous vous enverrons un lien sécurisé valable 30 minutes.
        </p>
      </div>

      <form v-if="!sent" class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="admin-input"
            placeholder="vous@example.com"
          />
        </label>
        <p v-if="error" class="text-sm text-terracotta" role="alert">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Envoi…' : 'Recevoir le lien' }}
        </button>
      </form>

      <div v-else class="mt-6 rounded-2xl border border-leaf/30 bg-leaf/10 p-5 text-sm text-night-600" role="status">
        <p class="font-semibold text-forest">Demande enregistrée</p>
        <p class="mt-2 leading-relaxed">{{ successMessage }}</p>
        <p class="mt-3 text-xs text-night-500">
          Le lien expire au bout de 30 minutes. Pensez à vérifier vos spams.
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-night-400">
        <router-link :to="{ name: 'admin-login' }" class="font-semibold text-forest underline">
          ← Retour à la connexion
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'

const email = ref('')
const loading = ref(false)
const error = ref(null)
const sent = ref(false)
const successMessage = ref('')

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const res = await tresorerieApi.forgotPassword({ email: email.value.trim() })
    successMessage.value = res.message || 'Si un compte existe pour cette adresse, un email de réinitialisation vient d\'être envoyé.'
    sent.value = true
  } catch (e) {
    error.value = e.message || 'Envoi impossible. Réessayez plus tard.'
  } finally {
    loading.value = false
  }
}
</script>
