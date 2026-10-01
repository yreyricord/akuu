<template>
  <div class="admin-shell min-h-[100dvh] bg-cream-200" :class="activeModule ? 'pb-24' : 'pb-8'">
    <header class="sticky top-0 z-30 border-b border-night-100 bg-white/95 backdrop-blur px-4 py-3">
      <div
        class="mx-auto flex items-center justify-between gap-3"
        :class="isWideLayout ? 'max-w-6xl' : 'max-w-3xl'"
      >
        <div class="flex min-w-0 items-center gap-3">
          <button type="button" class="shrink-0" aria-label="Accueil modules" @click="goHub">
            <img src="/images/LOGOAKUU.png" alt="" class="h-10 w-auto md:h-11" />
          </button>
          <div class="min-w-0 border-l border-night-100 pl-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-forest">
              {{ activeModuleLabel }}
            </p>
            <p class="truncate text-sm text-night-500">{{ auth.user?.email }}</p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <AdminAccountMenu @logout="onLogout" />
        </div>
      </div>
    </header>

    <div class="mx-auto px-4 py-6" :class="isWideLayout ? 'max-w-6xl' : 'max-w-3xl'">
      <div
        v-if="store.successMessage"
        class="mb-4 rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-forest"
        role="status"
      >
        {{ store.successMessage }}
      </div>
      <div
        v-if="store.error"
        class="mb-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-700"
        role="alert"
      >
        {{ store.error }}
      </div>

      <!-- Paramètres du compte -->
      <AdminAccountSettings
        v-if="accountSection"
        :section="accountSection"
        @back="closeAccount"
        @section="(id) => router.replace({ query: { ...route.query, compte: id } })"
        @logout="onLogout"
      />

      <!-- Hub modules -->
      <AdminHubView
        v-else-if="isHub"
        :access-pending-count="accessPendingCount"
        @enter="enterModule"
      />

      <!-- Module Trésorerie -->
      <template v-else-if="activeModule === 'tresorerie'">
        <AdminTresorerieGuideView
          v-if="activeTab === 'guide'"
          :pending-count="pendingCount"
          @back="goHub"
          @navigate="setTab"
        />
        <AdminDemandeForm v-else-if="activeTab === 'demande'" @submitted="goAfterSubmit" />
        <AdminFactureForm v-else-if="activeTab === 'facture'" @submitted="goAfterSubmit" />
        <AdminValidationQueue v-else-if="activeTab === 'validation'" />
        <AdminDirectExpenseForm v-else-if="activeTab === 'fonctionnement'" @submitted="goAfterDirectExpense" />
        <AdminComptaHub v-else-if="activeTab === 'compta'" />
        <AdminBilanHub v-else-if="activeTab === 'bilan'" />
        <AdminHistoryView v-else-if="activeTab === 'historique'" />
        <AdminAccessQueue v-else-if="activeTab === 'acces'" />
      </template>
    </div>

    <!-- Barre du bas · visible uniquement dans un module -->
    <nav
      v-if="activeModule === 'tresorerie'"
      class="admin-bottom-nav fixed bottom-0 inset-x-0 z-40 border-t border-night-100 bg-white/95 backdrop-blur safe-area-pb"
      aria-label="Navigation trésorerie"
    >
      <ul class="mx-auto flex max-w-6xl px-1">
        <li class="flex-1">
          <button
            type="button"
            class="relative flex w-full flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-semibold text-night-400 transition hover:text-forest"
            @click="goHub"
          >
            <PhSquaresFour :size="22" weight="duotone" aria-hidden="true" />
            Modules
          </button>
        </li>
        <li v-for="tab in visibleTabs" :key="tab.id" class="flex-1">
          <button
            type="button"
            class="relative flex w-full flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-semibold transition"
            :class="activeTab === tab.id ? 'text-forest' : 'text-night-400'"
            @click="setTab(tab.id)"
          >
            <span class="relative">
              <component :is="tabIcons[tab.id]" :size="22" weight="duotone" aria-hidden="true" />
              <span
                v-if="tab.id === 'validation' && pendingCount"
                class="absolute -right-2 -top-1 min-w-[1.125rem] rounded-full bg-terracotta px-1 text-center text-[10px] font-bold leading-4 text-white"
              >
                {{ pendingCount }}
              </span>
              <span
                v-if="tab.id === 'acces' && accessPendingCount"
                class="absolute -right-2 -top-1 min-w-[1.125rem] rounded-full bg-terracotta px-1 text-center text-[10px] font-bold leading-4 text-white"
              >
                {{ accessPendingCount }}
              </span>
            </span>
            {{ tab.label }}
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import AdminAccountMenu from '@/components/admin/AdminAccountMenu.vue'
import AdminAccountSettings from '@/components/admin/AdminAccountSettings.vue'
import { computed, watch, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhReceipt,
  PhFileText,
  PhCheckSquare,
  PhClockCounterClockwise,
  PhTable,
  PhChartBar,
  PhBookOpen,
  PhUserPlus,
  PhSquaresFour,
  PhBank
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import { TRESORERIE_TABS, awaitingVolunteerDevisResubmit } from '@/data/tresorerie-config.js'
import { getModule } from '@/data/admin-modules.js'
import { userHasTabAccess } from '@/data/member-roles.js'
import AdminDemandeForm from '@/components/admin/AdminDemandeForm.vue'
import AdminFactureForm from '@/components/admin/AdminFactureForm.vue'
import AdminValidationQueue from '@/components/admin/AdminValidationQueue.vue'
import AdminHistoryView from '@/components/admin/AdminHistoryView.vue'
import AdminComptaHub from '@/components/admin/AdminComptaHub.vue'
import AdminBilanHub from '@/components/admin/AdminBilanHub.vue'
import AdminHubView from '@/components/admin/AdminHubView.vue'
import AdminTresorerieGuideView from '@/components/admin/AdminTresorerieGuideView.vue'
import AdminAccessQueue from '@/components/admin/AdminAccessQueue.vue'
import AdminDirectExpenseForm from '@/components/admin/AdminDirectExpenseForm.vue'

const accountSection = computed(() => {
  const c = route.query.compte
  return c === 'profil' || c === 'securite' ? c : null
})
function closeAccount() {
  const q = { ...route.query }
  delete q.compte
  router.replace({ query: q })
}
const auth = useAuthStore()
const store = useTresorerieStore()
const route = useRoute()
const router = useRouter()

const tabIcons = {
  guide: PhBookOpen,
  demande: PhFileText,
  facture: PhReceipt,
  validation: PhCheckSquare,
  compta: PhTable,
  bilan: PhChartBar,
  fonctionnement: PhBank,
  historique: PhClockCounterClockwise,
  acces: PhUserPlus
}

const activeModule = computed(() => {
  const m = route.query.module
  return typeof m === 'string' ? m : null
})

const isHub = computed(() => {
  if (route.query.tab === 'accueil') return true
  return !activeModule.value
})

const activeModuleLabel = computed(() => {
  if (accountSection.value) return 'Mon compte'
  if (isHub.value) return 'Espace adhérent'
  return getModule(activeModule.value)?.label ?? 'Module'
})

const visibleTabs = computed(() =>
  TREASORERIE_TABS.filter((t) => {
    if (!userHasTabAccess(auth.user?.role, t.roles)) return false
    if (t.superAdminOnly && !auth.isSuperAdminUser) return false
    return true
  })
)

const activeTab = computed(() => {
  if (isHub.value) return null
  const tab = route.query.tab
  const allowed = visibleTabs.value.map((t) => t.id)
  if (typeof tab === 'string' && allowed.includes(tab)) return tab
  return 'guide'
})

const isWideLayout = computed(
  () => activeModule.value === 'tresorerie' && (activeTab.value === 'compta' || activeTab.value === 'bilan')
)

const pendingCount = computed(() => {
  const demandes = store.pendingDemandes.filter((d) => !awaitingVolunteerDevisResubmit(d)).length
  return demandes + store.pendingFactures.length
})

const accessPendingCount = computed(() => store.pendingAccessRequests.length)

function goHub() {
  router.replace({ name: 'admin-tresorerie' })
  store.clearMessages()
}

function enterModule(moduleId, tab = null) {
  const mod = getModule(moduleId)
  if (!mod?.available) return
  router.replace({
    query: {
      module: moduleId,
      tab: tab ?? mod.defaultTab ?? 'guide'
    }
  })
  store.clearMessages()
}

function setTab(id) {
  router.replace({ query: { ...route.query, module: activeModule.value, tab: id } })
  store.clearMessages()
}

function goAfterSubmit() {
  router.replace({ query: { module: 'tresorerie', tab: 'demande' } })
}

function goAfterDirectExpense() {
  router.replace({ query: { module: 'tresorerie', tab: 'compta' } })
}

async function onLogout() {
  await auth.logout()
  router.replace({ name: 'admin-login' })
}

watch(activeTab, (tab) => {
  if (tab === 'demande') {
    store.refreshMine()
    store.loadExchangeRate()
  }
  if (tab === 'validation' && auth.isTreasurer) store.refreshPending()
  if (tab === 'compta' && auth.isTreasurer) store.loadCompta()
  if (tab === 'fonctionnement' && auth.isTreasurer) store.loadExchangeRate()
  if (tab === 'historique') store.loadHistory()
  if (tab === 'acces' && auth.isSuperAdminUser) store.refreshAccessRequests()
}, { immediate: true })

function normalizeRouteQuery() {
  const module = route.query.module
  const tab = route.query.tab
  if (route.query.compte) return
  if (tab === 'accueil' || (typeof module === 'string' && !tab)) {
    router.replace({ name: 'admin-tresorerie' })
  }
}

watch(
  () => [route.query.module, route.query.tab],
  () => normalizeRouteQuery(),
  { immediate: true }
)

onMounted(() => {
  if (auth.isTreasurer) store.refreshPending()
  if (auth.isSuperAdminUser) store.refreshAccessRequests()
})
</script>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
