<template>
  <div class="space-y-6">
    <button type="button" class="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-night-500 hover:text-night" @click="$emit('back')">
      <PhArrowLeft :size="16" aria-hidden="true" /> Retour
    </button>
    <h1 class="font-serif text-3xl font-bold text-forest-700">Paramètres du compte</h1>

    <div class="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
      <!-- Navigation -->
      <nav aria-label="Paramètres" class="flex gap-1 overflow-x-auto md:flex-col">
        <button
          v-for="s in SECTIONS"
          :key="s.id"
          type="button"
          class="flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition"
          :class="section === s.id ? 'bg-white text-forest-700 shadow-sm' : 'text-night-500 hover:bg-white/60 hover:text-night'"
          :aria-current="section === s.id ? 'page' : undefined"
          @click="$emit('section', s.id)"
        >
          <component :is="s.icon" :size="20" aria-hidden="true" /> {{ s.label }}
        </button>
      </nav>

      <!-- Profil -->
      <section v-if="section === 'profil'" class="rounded-2xl border border-night-100 bg-white p-6 shadow-sm" aria-labelledby="t-profil">
        <h2 id="t-profil" class="text-lg font-semibold text-night">Mon profil</h2>
        <div class="mt-5 flex items-center gap-4">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-xl font-bold text-white" aria-hidden="true">{{ initials }}</span>
          <div>
            <p class="text-lg font-semibold">{{ displayName }}</p>
            <span class="mt-1 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-bold uppercase text-forest-700">{{ auth.roleDisplay }}</span>
          </div>
        </div>
        <dl class="mt-6 divide-y divide-night-50 text-sm">
          <div class="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt class="text-night-500">Prénom et nom</dt>
            <dd class="font-medium">{{ displayName }}</dd>
          </div>
          <div class="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt class="text-night-500">Email de connexion</dt>
            <dd class="font-medium">{{ auth.user?.email }}</dd>
          </div>
          <div class="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt class="text-night-500">Rôle</dt>
            <dd class="font-medium">{{ auth.roleDisplay }}</dd>
          </div>
        </dl>
        <p class="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-night-600">
          Pour corriger votre nom, votre email ou votre rôle, écrivez à l'administrateur de l'association.
        </p>
      </section>

      <!-- Sécurité -->
      <section v-else-if="section === 'securite'" class="rounded-2xl border border-night-100 bg-white p-6 shadow-sm" aria-labelledby="t-secu">
        <h2 id="t-secu" class="text-lg font-semibold text-night">Mot de passe et sécurité</h2>
        <p class="mt-1 text-sm text-night-500">Choisissez un mot de passe que vous n'utilisez nulle part ailleurs.</p>

        <form class="mt-6 max-w-md space-y-4" novalidate @submit.prevent="submit">
          <div v-for="f in FIELDS" :key="f.key" class="space-y-1.5">
            <label :for="`pwd-${f.key}`" class="text-sm font-medium text-night">{{ f.label }}</label>
            <div class="relative">
              <input
                :id="`pwd-${f.key}`"
                v-model="form[f.key]"
                :type="visible[f.key] ? 'text' : 'password'"
                :autocomplete="f.autocomplete"
                class="admin-input w-full py-2.5 pr-12 text-sm"
                :aria-invalid="fieldError(f.key) ? 'true' : undefined"
                :aria-describedby="f.key === 'next' ? 'pwd-rules' : undefined"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-night-400 hover:text-night"
                :aria-label="visible[f.key] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                @click="visible[f.key] = !visible[f.key]"
              >
                <component :is="visible[f.key] ? PhEyeSlash : PhEye" :size="20" aria-hidden="true" />
              </button>
            </div>
            <p v-if="fieldError(f.key)" class="text-xs text-terracotta-700">{{ fieldError(f.key) }}</p>

            <template v-if="f.key === 'next' && form.next">
              <div class="flex gap-1 pt-1" aria-hidden="true">
                <span v-for="i in 4" :key="i" class="h-1.5 flex-1 rounded-full" :class="i <= strength.score ? strength.cls : 'bg-night-100'" />
              </div>
              <p class="text-xs" :class="strength.text">Robustesse : {{ strength.label }}</p>
            </template>
            <ul v-if="f.key === 'next'" id="pwd-rules" class="space-y-0.5 pt-1 text-xs">
              <li v-for="r in rules" :key="r.label" :class="r.ok ? 'text-forest-700' : 'text-night-500'">
                {{ r.ok ? '✓' : '○' }} {{ r.label }}
              </li>
            </ul>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" class="btn-primary" :disabled="sending">{{ sending ? 'Enregistrement…' : 'Changer le mot de passe' }}</button>
            <p v-if="message" class="text-sm" :class="message.ok ? 'text-forest-700' : 'text-terracotta-700'" role="status">{{ message.text }}</p>
          </div>
        </form>

        <div class="mt-8 border-t border-night-100 pt-6">
          <h3 class="text-sm font-semibold text-night">Session</h3>
          <p class="mt-1 text-sm text-night-500">
            Par sécurité, la connexion se coupe d'elle-même au bout de 6 heures. Sur un ordinateur partagé, déconnectez-vous après usage.
          </p>
          <button
            type="button"
            class="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-terracotta/40 px-4 text-sm font-semibold text-terracotta-700 hover:bg-terracotta/5"
            @click="$emit('logout')"
          >
            <PhSignOut :size="18" aria-hidden="true" /> Se déconnecter
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { PhArrowLeft, PhEye, PhEyeSlash, PhLockKey, PhSignOut, PhUserCircle } from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'

defineProps({ section: { type: String, default: 'profil' } })
defineEmits(['back', 'section', 'logout'])

const SECTIONS = [
  { id: 'profil', label: 'Mon profil', icon: PhUserCircle },
  { id: 'securite', label: 'Mot de passe', icon: PhLockKey }
]
const FIELDS = [
  { key: 'current', label: 'Mot de passe actuel', autocomplete: 'current-password' },
  { key: 'next', label: 'Nouveau mot de passe', autocomplete: 'new-password' },
  { key: 'confirm', label: 'Confirmer le nouveau mot de passe', autocomplete: 'new-password' }
]

const auth = useAuthStore()
const form = reactive({ current: '', next: '', confirm: '' })
const visible = reactive({ current: false, next: false, confirm: false })
const tried = ref(false)
const sending = ref(false)
const message = ref(null)

const displayName = computed(() => {
  const u = auth.user || {}
  return u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || ''
})
const initials = computed(() => {
  const u = auth.user || {}
  const parts = (u.first_name && u.last_name) ? [u.first_name, u.last_name] : String(displayName.value).split(/[\s.@_-]+/)
  return parts.filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?'
})

const rules = computed(() => [
  { label: 'Au moins 10 caractères', ok: form.next.length >= 10 },
  { label: 'Une majuscule et une minuscule', ok: /[a-z]/.test(form.next) && /[A-Z]/.test(form.next) },
  { label: 'Un chiffre ou un symbole', ok: /[\d\W_]/.test(form.next) },
  { label: 'Différent du mot de passe actuel', ok: !!form.next && form.next !== form.current }
])
const strength = computed(() => {
  const score = rules.value.filter((r) => r.ok).length
  return [
    { score, label: 'trop faible', cls: 'bg-terracotta', text: 'text-terracotta-700' },
    { score, label: 'trop faible', cls: 'bg-terracotta', text: 'text-terracotta-700' },
    { score, label: 'moyenne', cls: 'bg-ochre-500', text: 'text-ochre-700' },
    { score, label: 'bonne', cls: 'bg-leaf-700', text: 'text-forest-700' },
    { score, label: 'très bonne', cls: 'bg-forest', text: 'text-forest-700' }
  ][score]
})

function fieldError(key) {
  if (!tried.value) return ''
  if (key === 'current' && !form.current) return 'Indiquez votre mot de passe actuel.'
  if (key === 'next' && form.next.length < 10) return 'Au moins 10 caractères.'
  if (key === 'next' && form.next === form.current) return "Choisissez un mot de passe différent de l'actuel."
  if (key === 'confirm' && form.confirm !== form.next) return 'Les deux mots de passe ne correspondent pas.'
  return ''
}

async function submit() {
  tried.value = true
  message.value = null
  if (FIELDS.some((f) => fieldError(f.key))) return
  sending.value = true
  try {
    await tresorerieApi.changePassword({ current_password: form.current, new_password: form.next })
    message.value = { ok: true, text: 'Mot de passe changé.' }
    form.current = form.next = form.confirm = ''
    tried.value = false
  } catch (e) {
    message.value = { ok: false, text: e.message }
  } finally {
    sending.value = false
  }
}
</script>
