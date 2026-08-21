const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/balanza' },
      { path: 'balanza', component: () => import('@/pages/BalanzaPage.vue') },
      { path: 'zona-2', component: () => import('@/pages/Zona2Page.vue') },
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
