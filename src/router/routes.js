const routes = [
  {
    path: '/',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'balanza', component: () => import('@/pages/Zona1/BalanzaPage.vue') },
      { path: 'balanza/form1', component: () => import('@/pages/Zona1/BalanzaForm1.vue') },
      {
        path: 'balanza/form1/:id',
        name: 'balanza-form1',
        component: () => import('@/pages/Zona1/BalanzaForm1.vue'),
      },
      {
        path: 'balanza/form2/:id',
        name: 'balanza-form2',
        component: () => import('@/pages/Zona1/BalanzaForm2.vue'),
      },
      { path: 'produccion', component: () => import('@/pages/Zona2/ProduccionPage.vue') },
      {
        path: 'produccion/balance',
        component: () => import('@/pages/Zona2/BalanceMasaPage.vue'),
      },
      {
        path: 'produccion/proceso',
        component: () => import('@/pages/Zona2/ProduccionProcesoPage.vue'),
      },
      { path: 'comercial', redirect: '/expedicion/pedidos' },
      { path: 'expedicion', redirect: '/expedicion/stock' },
      { path: 'expedicion/stock', component: () => import('@/pages/Zona3/StockPage.vue') },
      { path: 'expedicion/pedidos', component: () => import('@/pages/Zona3/PedidosPage.vue') },
      {
        path: 'expedicion/pedidos/nuevo',
        component: () => import('@/pages/Zona3/PedidosPage.vue'),
      },
      { path: 'expedicion/repartos', component: () => import('@/pages/Zona3/RepartosPage.vue') },
      {
        path: 'expedicion/repartos/nuevo',
        component: () => import('@/pages/Zona3/RepartosPage.vue'),
      },
      {
        path: 'expedicion/movimientos',
        component: () => import('@/pages/Zona3/MovimientosPage.vue'),
      },
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
