export const routes = [
  {
    path: '/',
    name: 'home',
    meta: { seoRoute: 'home' },
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/association',
    name: 'association',
    meta: { seoRoute: 'association' },
    component: () => import('@/views/AssociationView.vue')
  },
  {
    path: '/projets',
    name: 'projets',
    meta: { seoRoute: 'projets' },
    component: () => import('@/views/ProjetsView.vue')
  },
  {
    path: '/musee-shapishiko',
    name: 'musee-shapishiko',
    meta: { seoRoute: 'museeShapishiko' },
    component: () => import('@/views/MuseeShapishikoView.vue')
  },
  {
    path: '/volontaires',
    name: 'volontaires',
    meta: { seoRoute: 'volontaires' },
    component: () => import('@/views/VolontairesView.vue')
  },
  {
    path: '/soutenir',
    name: 'soutenir',
    meta: { seoRoute: 'soutenir' },
    component: () => import('@/views/SoutienView.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    meta: { seoRoute: 'contact' },
    component: () => import('@/views/ContactView.vue')
  },
  {
    path: '/hydrama',
    name: 'hydrama',
    meta: { seoRoute: 'hydrama' },
    component: () => import('@/views/HydramaView.vue')
  },
  {
    path: '/akuuvision',
    name: 'akuuvision',
    meta: { seoRoute: 'akuuvision' },
    component: () => import('@/views/AkuuVisionView.vue')
  },
  {
    path: '/cours-anglais',
    name: 'cours-anglais',
    meta: { seoRoute: 'coursAnglais' },
    component: () => import('@/views/CoursAnglaisView.vue')
  },
  {
    path: '/casa-akuu',
    name: 'casa-akuu',
    meta: { seoRoute: 'casaAkuu' },
    component: () => import('@/views/CasaAkuuView.vue')
  },
  {
    path: '/gestion-dechets',
    name: 'gestion-dechets',
    meta: { seoRoute: 'gestionDechets' },
    component: () => import('@/views/GestionDechetsView.vue')
  },
  {
    path: '/merci',
    name: 'merci',
    component: () => import('@/views/MerciView.vue')
  },
]

export default routes
