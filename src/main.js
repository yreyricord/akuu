import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes } from './router'
import { setupAdminGuards } from './router/adminGuards.js'
import i18n from './i18n'
import './assets/styles/main.css'

/**
 * Après un redéploiement, les fichiers hachés de l'ancien build disparaissent du serveur. Un onglet
 * resté ouvert réclame encore son chunk CSS / JS : Vite fait alors échouer l'import dynamique de la
 * route, la page ne se monte plus et l'utilisateur ne peut plus se connecter (juste un 404 sur un
 * .css dans la console). On recharge une fois pour aller chercher le nouvel index ; le délai évite
 * la boucle de rechargement si l'échec est réel (réseau coupé, déploiement cassé).
 */
function setupChunkReloadRecovery() {
  if (typeof window === 'undefined') return

  const FLAG = 'akuu_chunk_reload_at'
  const LOOP_GUARD_MS = 15_000

  window.addEventListener('vite:preloadError', (event) => {
    let last = 0
    try {
      last = Number(window.sessionStorage.getItem(FLAG)) || 0
    } catch {
      // sessionStorage indisponible (navigation privée, iframe cloisonnée) : on recharge quand même.
    }
    if (Date.now() - last < LOOP_GUARD_MS) return

    try {
      window.sessionStorage.setItem(FLAG, String(Date.now()))
    } catch {
      // idem : sans stockage on accepte le risque d'un rechargement unique.
    }
    event.preventDefault()
    window.location.reload()
  })
}

setupChunkReloadRecovery()

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior () {
      return { top: 0 }
    }
  },
  ({ app, router }) => {
    app.use(createPinia())
    app.use(i18n)
    setupAdminGuards(router)
  }
)
