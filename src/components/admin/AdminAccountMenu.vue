<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-cream-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Mon compte"
      @click="open = !open"
    >
      <span class="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-bold text-white" aria-hidden="true">
        {{ initials }}
      </span>
      <PhCaretDown :size="14" weight="bold" class="text-night-400 transition" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-night-100 bg-white shadow-xl"
      role="menu"
      aria-label="Mon compte"
      @keydown.esc="close"
    >
      <div class="flex items-center gap-3 border-b border-night-100 px-4 py-4">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-base font-bold text-white" aria-hidden="true">
          {{ initials }}
        </span>
        <div class="min-w-0">
          <p class="truncate font-semibold text-night">{{ displayName }}</p>
          <p class="truncate text-xs text-night-500">{{ auth.user?.email }}</p>
          <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" :class="roleClass">{{ auth.roleDisplay }}</span>
        </div>
      </div>
      <button type="button" role="menuitem" class="menu-item" @click="go('profil')">
        <PhUserCircle :size="20" aria-hidden="true" /> Mon profil
      </button>
      <button type="button" role="menuitem" class="menu-item" @click="go('securite')">
        <PhLockKey :size="20" aria-hidden="true" /> Mot de passe et sécurité
      </button>
      <div class="border-t border-night-100" />
      <button type="button" role="menuitem" class="menu-item text-terracotta-700" @click="logout">
        <PhSignOut :size="20" aria-hidden="true" /> Se déconnecter
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhCaretDown, PhLockKey, PhSignOut, PhUserCircle } from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth.js'

const emit = defineEmits(['logout'])
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const open = ref(false)
const root = ref(null)

const displayName = computed(() => {
  const u = auth.user || {}
  return u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Mon compte'
})
const initials = computed(() => {
  const u = auth.user || {}
  const parts = (u.first_name && u.last_name) ? [u.first_name, u.last_name] : String(displayName.value).split(/[\s.@_-]+/)
  return parts.filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?'
})
const roleClass = computed(() =>
  auth.isAdmin ? 'bg-forest/10 text-forest-700' : auth.isTreasurer ? 'bg-bleu/10 text-bleu-700' : 'bg-leaf/15 text-forest-700'
)

function close() { open.value = false }
function go(section) {
  close()
  router.push({ query: { ...route.query, compte: section } })
}
function logout() {
  close()
  emit('logout')
}
function onDoc(e) { if (open.value && root.value && !root.value.contains(e.target)) close() }
onMounted(() => document.addEventListener('click', onDoc))
onBeforeUnmount(() => document.removeEventListener('click', onDoc))

defineExpose({ initials, displayName })
</script>

<style scoped>
.menu-item {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  transition: background-color 0.15s;
}
.menu-item:hover,
.menu-item:focus-visible {
  background: #f5f2ed;
  outline: none;
}
</style>
