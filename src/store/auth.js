import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tresorerieApi, isMockMode } from '@/api/tresorerie/client.js'
import { isAdminRole, isSuperAdmin, isTreasurerRole, normalizeRole, roleLabel } from '@/data/member-roles.js'

const AUTH_KEY = 'akuu_tresorerie_auth'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value?.email))
  const normalizedRole = computed(() => normalizeRole(user.value?.role))
  const isTreasurer = computed(() => isTreasurerRole(user.value?.role))
  const isAdmin = computed(() => isAdminRole(user.value?.role))
  const isSuperAdminUser = computed(() => isSuperAdmin(user.value?.email, user.value?.role))
  const roleDisplay = computed(() => roleLabel(user.value?.role))
  const isMock = computed(() => isMockMode())

  async function init() {
    if (initialized.value) return
    const stored = readStoredSession()
    if (!stored?.token) {
      initialized.value = true
      return
    }
    try {
      loading.value = true
      user.value = await tresorerieApi.me()
    } catch {
      localStorage.removeItem(AUTH_KEY)
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(email, password) {
    error.value = null
    loading.value = true
    try {
      const session = await tresorerieApi.login({ email, password })
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      user.value = session
      return session
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await tresorerieApi.logout()
    localStorage.removeItem(AUTH_KEY)
    user.value = null
  }

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated,
    normalizedRole,
    isTreasurer,
    isAdmin,
    isSuperAdminUser,
    roleDisplay,
    isMock,
    init,
    login,
    logout
  }
})
