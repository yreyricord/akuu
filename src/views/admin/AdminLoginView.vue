<template>
  <div class="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-forest-50 to-cream px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-night-100 bg-white p-6 shadow-xl sm:p-8">
      <div class="text-center">
        <router-link to="/" class="inline-block" aria-label="AKUU — accueil">
          <img
            src="/images/LOGOAKUU.png"
            alt="AKUU"
            class="mx-auto h-14 w-auto sm:h-16"
          />
        </router-link>
        <p class="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-forest">Espace adhérent</p>
        <h1 class="mt-1 font-serif text-xl font-bold leading-snug text-night sm:text-2xl">
        </h1>
        <p class="mt-2 text-sm text-night-400">
          Trésorerie · formations · missions AKUU
        </p>
      </div>

      <p v-if="apiMisconfigured" class="mt-4 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta-700" role="alert">
        Espace indisponible : l'adresse du serveur n'est pas configurée sur ce site. Prévenez l'administrateur.
      </p>
      <p v-else-if="auth.isMock" class="mt-4 rounded-xl bg-leaf/15 px-3 py-2 text-xs text-forest">
        Mode démo · <strong>admin@demo.akuu.fr</strong> / <strong>tresorier@demo.akuu.fr</strong> / <strong>adherent@demo.akuu.fr</strong> · mdp <code>demo-akuu-2026</code>
      </p>

      <form v-if="!apiMisconfigured" class="mt-6 space-y-4" @submit.prevent="onLogin">
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
        <label class="block space-y-1.5">
          <span class="text-sm font-medium text-night">Mot de passe</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="admin-input"
          />
        </label>
        <p v-if="auth.error" class="text-sm text-terracotta">{{ auth.error }}</p>
        <AdminLoadingPanel
          v-if="auth.loading"
          variant="inline"
          title="Connexion"
          detail="Vérification auprès du serveur AKUU"
          :progress="loginProg.progress"
          hint=""
        />
        <button v-else type="submit" class="btn-primary w-full">
          Se connecter
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-night-500">
        Pas encore de compte ?
        <router-link :to="{ name: 'admin-request-access' }" class="font-semibold text-forest underline">
          Demander un accès
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { apiMisconfigured } from '@/api/tresorerie/client.js'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel.vue'

const auth = useAuthStore()
const loginProg = bindLoadingProgress(toRef(auth, 'loading'), { estimateMs: 12_000, label: 'Authentification…' })
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
function adminRedirectTarget(redirect) {
  try {
    const url = new URL(String(redirect), window.location.origin)
    if (!url.pathname.startsWith('/admin')) return { name: 'admin-tresorerie' }
    const module = url.searchParams.get('module')
    const tab = url.searchParams.get('tab')
    if (module && tab && tab !== 'accueil') {
      const ref = url.searchParams.get('ref')
      return {
        name: 'admin-tresorerie',
        query: { module, tab, ...(ref ? { ref } : {}) }
      }
    }
  } catch {
    /* ignore malformed redirect */
  }
  return { name: 'admin-tresorerie' }
}

async function onLogin() {
  await auth.login(email.value.trim(), password.value)
  const redirect = route.query.redirect
  if (redirect && redirect !== '/admin/login') {
    router.replace(adminRedirectTarget(redirect))
  } else {
    router.replace({ name: 'admin-tresorerie' })
  }
}
</script>
