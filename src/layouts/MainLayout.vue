<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header">
      <q-toolbar>
        <router-link class="top-brand" to="/balanza">
          <img class="top-brand-logo" src="/images/logo.png" alt="Mark" />
        </router-link>

        <nav class="top-nav" aria-label="Navegación principal">
          <router-link v-if="currentRole === 'balanza'" to="/balanza" class="top-nav-item">
            <Scale :size="18" />
            <span>Balanza</span>
          </router-link>
          <template v-if="currentRole === 'produccion'">
            <router-link
              to="/produccion"
              :class="['top-nav-item', productionSectionClass('producciones')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <Factory :size="18" />
              <span>Producciones</span>
            </router-link>
            <router-link
              to="/produccion/balance"
              :class="['top-nav-item', productionSectionClass('balance')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <Calculator :size="18" />
              <span>Balance de masa</span>
            </router-link>
          </template>
          <template v-if="currentRole === 'expedicion'">
            <router-link
              to="/expedicion"
              :class="['top-nav-item', expeditionSectionClass('stock')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <Warehouse :size="18" />
              <span>Stock</span>
            </router-link>
            <router-link
              to="/expedicion?view=pedidos"
              :class="['top-nav-item', expeditionSectionClass('pedidos')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <ClipboardList :size="18" />
              <span>Pedidos</span>
            </router-link>
            <router-link
              to="/expedicion?view=cargas"
              :class="['top-nav-item', expeditionSectionClass('cargas')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <Truck :size="18" />
              <span>Cargas</span>
            </router-link>
          </template>
        </nav>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div class="zone-switcher-float">
      <button class="zone-fab" type="button">
        <span class="zone-fab-avatar"><component :is="currentRoleIcon" :size="19" /></span>
        <span class="zone-fab-copy">
          <strong>{{ currentRoleLabel }}</strong>
          <small>{{ currentRoleCaption }}</small>
        </span>
        <ChevronsUpDown :size="16" />
        <q-menu auto-close class="role-menu">
          <q-list padding style="min-width: 232px">
            <q-item
              v-for="role in roles"
              :key="role.value"
              clickable
              :active="currentRole === role.value"
              active-class="role-menu-active"
              @click="setRole(role.value)"
            >
              <q-item-section avatar><component :is="role.icon" :size="20" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ role.label }}</q-item-label>
                <q-item-label caption>{{ role.caption }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
      <button class="zone-fab zone-fab--icon" type="button" title="Cerrar sesión" @click="logout">
        <LogOut :size="18" />
      </button>
    </div>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Calculator,
  ChevronsUpDown,
  ClipboardList,
  Factory,
  LogOut,
  Scale,
  Truck,
  Warehouse,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authTokenKey = 'mark-auth-token'

const roles = [
  {
    value: 'balanza',
    label: 'Zona 1',
    caption: 'Camiones y pesos',
    icon: Scale,
    to: '/balanza',
  },
  {
    value: 'produccion',
    label: 'Zona 2',
    caption: 'Producto terminado',
    icon: Factory,
    to: '/produccion',
  },
  {
    value: 'expedicion',
    label: 'Zona 3',
    caption: 'Cargas y despachos',
    icon: Warehouse,
    to: '/expedicion',
  },
]

const currentRole = computed(() => {
  if (route.path.startsWith('/produccion')) return 'produccion'
  if (route.path.startsWith('/expedicion')) return 'expedicion'
  return 'balanza'
})
const currentRoleData = computed(() => roles.find((role) => role.value === currentRole.value))
const currentRoleLabel = computed(() => currentRoleData.value?.label)
const currentRoleCaption = computed(() => currentRoleData.value?.caption)
const currentRoleIcon = computed(() => currentRoleData.value?.icon)
function setRole(roleValue) {
  const role = roles.find((item) => item.value === roleValue)
  if (role) router.push(role.to)
}

function logout() {
  localStorage.removeItem(authTokenKey)
  router.replace('/')
}

function expeditionSectionClass(section) {
  const view = route.query.view
  const active = section === 'stock' ? !view : view === section
  return active ? 'router-link-exact-active' : ''
}

function productionSectionClass(section) {
  const active =
    section === 'producciones'
      ? route.path === '/produccion' || route.path === '/produccion/proceso'
      : route.path === `/produccion/${section}`
  return active ? 'router-link-exact-active' : ''
}
</script>
