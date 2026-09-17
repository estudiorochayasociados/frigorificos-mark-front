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

function tokenIsValid() {
  const token = localStorage.getItem(authTokenKey)
  if (!token) return false

  try {
    const payload = token.split('.')[1]
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='))
    const { exp } = JSON.parse(decodedPayload)
    return Number.isFinite(exp) && exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function clearSession() {
  localStorage.removeItem(authTokenKey)
  localStorage.removeItem(accountKey)
}

function isFacundoRocha(account) {
  return account?.nombre?.trim().toLocaleLowerCase('es-AR') === 'facundo rocha'
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
    const hasToken = tokenIsValid()
    const account = currentAccount()

    if (to.meta.requiresAuth && !hasToken) {
      clearSession()
      return '/'
    }
    if (to.meta.requiresAdmin && account?.rol !== 'admin') return '/balanza'
    if (to.meta.requiresFacundo && !isFacundoRocha(account)) return '/balanza'
    if (to.meta.guestOnly && hasToken) return '/balanza'
  })

  window.addEventListener('mark:session-invalid', () => {
    Router.replace('/')
  })

  return Router
})
