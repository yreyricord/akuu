<template>
  <div class="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-forest-50 to-cream px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-night-100 bg-white p-6 shadow-xl sm:p-8">
      <div class="text-center">
        <router-link to="/" class="inline-block" aria-label="AKUU — accueil">
          <img src="/images/LOGOAKUU.png" alt="AKUU" class="mx-auto h-14 w-auto sm:h-16" />
        </router-link>
        <p class="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-forest">Espace adhérent</p>
        <h1 class="mt-1 font-serif text-2xl font-bold text-night">Nouveau mot de passe</h1>
        <p class="mt-2 text-sm text-night-400">
          Choisissez un mot de passe d'au moins {{ MIN_LENGTH }} caractères.
        </p>
      </div>

      <p v-if="!token" class="mt-6 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta-700" role="alert">
        Lien invalide. Demandez un nouveau lien depuis la page « Mot de passe oublié ».
      </p>

      <form v-else-if="!done" class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Nouveau mot de passe</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            :minlength="MIN_LENGTH"
            class="admin-input"
          />
        </label>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Confirmer le mot de passe</span>
          <input
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            :minlength="MIN_LENGTH"
            class="admin-input"
          />
        </label>
        <p v-if="localError" class="text-sm text-terracotta" role="alert">{{ localError }}</p>
        <p v-if="error" class="text-sm text-terracotta" role="alert">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Enregistrement…' : 'Enregistrer le mot de passe' }}
        </button>
      </form>

      <div v-else class="mt-6 rounded-2xl border border-leaf/30 bg-leaf/10 p-5 text-center">
        <p class="font-semibold text-forest">Mot de passe mis à jour</p>
        <p class="mt-2 text-sm text-night-500">{{ successMessage }}</p>
        <router-link :to="{ name: 'admin-login' }" class="btn-primary mt-4 inline-flex w-full justify-center">
          Se connecter
        </router-link>
      </div>

      <p v-if="!done" class="mt-6 text-center text-sm text-night-400">
        <router-link :to="{ name: 'admin-forgot-password' }" class="font-semibold text-forest underline">
          Demander un nouveau lien
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { tresorerieApi } from '@/api/tresorerie/client.js'

const MIN_LENGTH = 10
const route = useRoute()
const token = computed(() => String(route.query.token || '').trim())

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref(null)
const localError = ref(null)
const done = ref(false)
const successMessage = ref('')

async function onSubmit() {
  localError.value = null
  error.value = null

  if (password.value.length < MIN_LENGTH) {
    localError.value = `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`
    return
  }
  if (password.value !== confirm.value) {
    localError.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  loading.value = true
  try {
    const res = await tresorerieApi.resetPassword({
      token: token.value,
      new_password: password.value
    })
    successMessage.value = res.message || 'Vous pouvez maintenant vous connecter.'
    done.value = true
  } catch (e) {
    error.value = e.message || 'Réinitialisation impossible.'
  } finally {
    loading.value = false
  }
}
</script>
