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
      {
        path: 'marcas-comerciales',
        component: () => import('@/pages/Zona1/MarcasComercialesPage.vue'),
      },
      {
        path: 'usuarios',
        component: () => import('@/pages/Zona1/UsuariosPage.vue'),
        meta: { requiresAdmin: true },
      },
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
        meta: { requiresFacundo: true },
      },
      {
        path: 'produccion/proceso',
        component: () => import('@/pages/Zona2/ProduccionProcesoPage.vue'),
      },
      { path: 'comercial', redirect: '/expedicion/pedidos', meta: { requiresFacundo: true } },
      { path: 'expedicion', redirect: '/expedicion/stock', meta: { requiresFacundo: true } },
      {
        path: 'expedicion/stock',
        component: () => import('@/pages/Zona3/StockPage.vue'),
        meta: { requiresFacundo: true },
      },
      {
        path: 'expedicion/pedidos',
        component: () => import('@/pages/Zona3/PedidosPage.vue'),
        meta: { requiresFacundo: true },
      },
      {
        path: 'expedicion/pedidos/nuevo',
        component: () => import('@/pages/Zona3/PedidosPage.vue'),
        meta: { requiresFacundo: true },
      },
      {
        path: 'expedicion/repartos',
        component: () => import('@/pages/Zona3/RepartosPage.vue'),
        meta: { requiresFacundo: true },
      },
      {
        path: 'expedicion/repartos/nuevo',
        component: () => import('@/pages/Zona3/RepartosPage.vue'),
        meta: { requiresFacundo: true },
      },
      {
        path: 'expedicion/movimientos',
        component: () => import('@/pages/Zona3/MovimientosPage.vue'),
        meta: { requiresFacundo: true },
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
