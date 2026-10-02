import { useAuthStore } from '@/store/auth.js'
// Ancrage du config onglets dans le bundle principal (évite ReferenceError en chunk admin lazy).
import '@/data/tresorerie-tabs.js'

export function setupAdminGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.initialized) {
      await auth.init()
    }

    const isAdminRoute = to.path.startsWith('/admin')
    const isPublicAdmin =
      to.name === 'admin-login' ||
      to.name === 'admin-request-access' ||
      to.name === 'admin-forgot-password' ||
      to.name === 'admin-reset-password'

    if (!isAdminRoute) return true

    if (to.name === 'admin-login' && auth.isAuthenticated) {
      return { name: 'admin-tresorerie' }
    }

    if (!isPublicAdmin && !auth.isAuthenticated) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }

    if (to.meta.requiresTreasurer && !auth.isTreasurer) {
      return { name: 'admin-tresorerie' }
    }

    return true
  })
}
