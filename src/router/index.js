import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/association',
    name: 'association',
    component: () => import('@/views/AssociationView.vue')
  },
  {
    path: '/projets',
    name: 'projets',
    component: () => import('@/views/ProjetsView.vue')
  },
  {
    path: '/musee-shapishiko',
    name: 'musee-shapishiko',
    component: () => import('@/views/MuseeShapishikoView.vue')
  },
  {
    path: '/volontaires',
    name: 'volontaires',
    component: () => import('@/views/VolontairesView.vue')
  },
  {
    path: '/soutenir',
    name: 'soutenir',
    component: () => import('@/views/SoutienView.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/ContactView.vue')
  },
  {
    path: '/hydrama',
    name: 'hydrama',
    component: () => import('@/views/HydramaView.vue')
  },
  {
    path: '/akuuvision',
    name: 'akuuvision',
    component: () => import('@/views/AkuuVisionView.vue')
  },
  {
    path: '/cours-anglais',
    name: 'cours-anglais',
    component: () => import('@/views/CoursAnglaisView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
