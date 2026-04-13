import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes } from './router'
import i18n from './i18n'
import './assets/styles/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior () {
      return { top: 0 }
    }
  },
  ({ app }) => {
    app.use(createPinia())
    app.use(i18n)
  }
)
