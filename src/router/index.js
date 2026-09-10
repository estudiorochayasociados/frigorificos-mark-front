import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'

const authTokenKey = 'mark-auth-token'
const accountKey = 'mark-auth-account'

function currentAccount() {
  try {
    return JSON.parse(localStorage.getItem(accountKey) || 'null')
  } catch {
    return null
  }
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  Router.beforeEach((to) => {
    const hasToken = Boolean(localStorage.getItem(authTokenKey))
    const account = currentAccount()

    if (to.meta.requiresAuth && !hasToken) return '/'
    if (to.meta.requiresAdmin && account?.rol !== 'admin') return '/balanza'
    if (to.meta.guestOnly && hasToken) return '/balanza'
  })

  return Router
})
