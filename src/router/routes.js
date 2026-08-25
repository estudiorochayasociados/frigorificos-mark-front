const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/balanza' },
      { path: 'balanza', component: () => import('@/pages/BalanzaPage.vue') },
      { path: 'produccion', component: () => import('@/pages/ProduccionPage.vue') },
      { path: 'comercial', redirect: '/expedicion?view=pedidos' },
      { path: 'expedicion', component: () => import('@/pages/Zona3Page.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
