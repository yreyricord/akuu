<template>
  <div class="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-forest-50 to-cream px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-night-100 bg-white p-6 shadow-xl sm:p-8">
      <div class="text-center">
        <router-link to="/" class="inline-block" aria-label="AKUU — accueil">
          <img src="/images/LOGOAKUU.png" alt="AKUU" class="mx-auto h-14 w-auto sm:h-16" />
        </router-link>
        <p class="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-forest">Espace adhérent</p>
        <h1 class="mt-1 font-serif text-2xl font-bold text-night">Demande d'accès</h1>
        <p class="mt-2 text-sm text-night-400">
          ADMIN · TRÉSORIER · BÉNÉVOLE — validation par l'administrateur AKUU
        </p>
      </div>

      <form v-if="!submitted" class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-night">Prénom</span>
            <input
              v-model="firstName"
              type="text"
              autocomplete="given-name"
              required
              class="admin-input"
              placeholder="Alex"
            />
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-night">Nom</span>
            <input
              v-model="lastName"
              type="text"
              autocomplete="family-name"
              required
              class="admin-input"
              placeholder="Martin"
            />
          </label>
        </div>
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
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium text-night">Rôle demandé</legend>
          <label
            v-for="role in REQUESTABLE_ROLES"
            :key="role.code"
            class="flex cursor-pointer gap-3 rounded-xl border p-3 transition"
            :class="requestedRole === role.code ? 'border-forest bg-forest/5' : 'border-night-100 hover:border-night-200'"
          >
            <input v-model="requestedRole" type="radio" :value="role.code" class="mt-1" />
            <span>
              <span class="block text-sm font-semibold text-night">{{ role.label }}</span>
              <span class="block text-xs text-night-400">{{ role.hint }}</span>
            </span>
          </label>
        </fieldset>
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Message <span class="font-normal text-night-400">(optionnel)</span></span>
          <textarea v-model="message" rows="3" class="admin-input resize-none" placeholder="Motivation, mission, lien avec AKUU…" />
        </label>
        <p v-if="error" class="text-sm text-terracotta">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Envoi…' : 'Envoyer la demande' }}
        </button>
      </form>

      <div v-else class="mt-6 rounded-2xl border border-leaf/30 bg-leaf/10 p-5 text-center">
        <p class="font-semibold text-forest">Demande envoyée</p>
        <p class="mt-2 text-sm text-night-500">
          L'administrateur AKUU va examiner votre demande. Vous recevrez un email une fois la décision prise.
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-night-400">
        Déjà membre ?
        <router-link :to="{ name: 'admin-login' }" class="font-semibold text-forest underline">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { REQUESTABLE_ROLES } from '@/data/member-roles.js'
import { buildFullName } from '@/data/user-profile.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const requestedRole = ref('benevole')
const message = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await tresorerieApi.createAccessRequest({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      name: buildFullName(firstName.value, lastName.value),
      email: email.value.trim(),
      requested_role: requestedRole.value,
      message: message.value.trim()
    })
    submitted.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
