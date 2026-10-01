<template>
  <div class="space-y-8">
    <!-- En-tête -->
    <header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-600 to-night px-6 py-8 text-white shadow-lg">
      <div
        class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-leaf/20 blur-2xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-bleu/15 blur-2xl"
        aria-hidden="true"
      />
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-leaf/90">Espace adhérent</p>
      <h2 class="mt-2 font-serif text-2xl font-bold sm:text-3xl">
        Bonjour{{ auth.user?.name ? `, ${firstName}` : '' }}
      </h2>
      <p class="mt-2 max-w-md text-sm leading-relaxed text-white/80">
        Choisissez un module pour commencer. Trésorerie, formations et outils mission AKUU.
      </p>
    </header>

    <!-- Modules -->
    <section>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night-400">Vos modules</h3>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2">
        <li v-for="mod in ADMIN_MODULES" :key="mod.id">
          <button
            type="button"
            class="module-card group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition"
            :class="mod.available
              ? 'border-night-100 bg-white shadow-sm hover:border-forest/30 hover:shadow-md active:scale-[0.99]'
              : 'cursor-not-allowed border-night-100/80 bg-night-50/50 opacity-90'"
            :disabled="!mod.available"
            @click="mod.available && emit('enter', mod.id)"
          >
            <span
              v-if="mod.comingSoon"
              class="absolute right-3 top-3 rounded-full bg-night-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-night-500"
            >
              Bientôt
            </span>
            <span
              class="flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-105"
              :class="accentClasses[mod.accent]"
            >
              <PhWallet v-if="mod.icon === 'wallet'" :size="28" weight="duotone" aria-hidden="true" />
              <PhGraduationCap v-else :size="28" weight="duotone" aria-hidden="true" />
            </span>
            <p class="mt-4 font-serif text-xl font-bold text-night">{{ mod.label }}</p>
            <p class="text-xs font-semibold uppercase tracking-wide" :class="mod.available ? 'text-forest' : 'text-night-400'">
              {{ mod.tagline }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-night-500">{{ mod.description }}</p>
            <span
              v-if="mod.available"
              class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest group-hover:gap-2 transition-all"
            >
              Ouvrir
              <PhArrowRight :size="16" weight="bold" aria-hidden="true" />
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Admin · demandes d'accès -->
    <section v-if="auth.isSuperAdminUser" class="rounded-2xl border border-forest/20 bg-forest/5 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-forest">Administration</h3>
          <p class="mt-1 text-sm text-night-600">
            {{ accessPendingCount }} demande{{ accessPendingCount !== 1 ? 's' : '' }} d'accès en attente
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-600"
          @click="emit('enter', 'tresorerie', 'acces')"
        >
          <PhUserPlus :size="18" weight="duotone" aria-hidden="true" />
          Gérer les accès
        </button>
      </div>
    </section>

    <!-- Rappel rôle -->
    <p class="text-center text-xs text-night-400">
      Connecté en tant que <strong class="text-night-600">{{ auth.roleDisplay }}</strong>
      · {{ auth.user?.email }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PhWallet, PhGraduationCap, PhArrowRight, PhUserPlus } from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth.js'
import { ADMIN_MODULES } from '@/data/admin-modules.js'
import { displayFirstName } from '@/data/user-profile.js'

defineProps({
  accessPendingCount: { type: Number, default: 0 }
})

const emit = defineEmits(['enter'])

const auth = useAuthStore()

const firstName = computed(() => displayFirstName(auth.user))

const accentClasses = {
  forest: 'bg-forest/10 text-forest',
  bleu: 'bg-bleu/10 text-bleu'
}
</script>

<style scoped>
.module-card:focus-visible {
  @apply outline-none ring-2 ring-forest ring-offset-2;
}
</style>
