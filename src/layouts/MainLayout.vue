<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header">
      <q-toolbar>
        <button
          class="header-menu-button lt-md"
          type="button"
          aria-label="Abrir menú principal"
          @click="drawerOpen = true"
        >
          <Menu :size="23" />
        </button>
        <router-link class="top-brand" :to="currentRoleData.to">
          <img class="top-brand-logo" src="/images/logo.png" alt="Mark" />
        </router-link>

        <nav class="top-nav gt-sm" aria-label="Navegación principal">
          <router-link
            v-for="item in currentNavigation"
            :key="item.to"
            :to="item.to"
            :class="['top-nav-item', { 'router-link-exact-active': item.active() }]"
          >
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
        <span class="mobile-header-title lt-md">{{ currentRoleLabel }}</span>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" overlay bordered :breakpoint="1024" class="mobile-drawer">
      <div class="mobile-drawer-content">
        <header class="mobile-drawer-header">
          <img src="/images/logo.png" alt="Mark" />
          <button type="button" aria-label="Cerrar menú" @click="drawerOpen = false">
            <X :size="22" />
          </button>
        </header>
        <div class="mobile-drawer-zone">
          <component :is="currentRoleIcon" :size="20" />
          <div><strong>{{ currentRoleLabel }}</strong><small>{{ currentRoleCaption }}</small></div>
        </div>
        <nav class="mobile-drawer-nav" aria-label="Navegación principal">
          <router-link
            v-for="item in currentNavigation"
            :key="item.to"
            :to="item.to"
            :class="{ active: item.active() }"
            @click="drawerOpen = false"
          >
            <component :is="item.icon" :size="20" /><span>{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="mobile-drawer-spacer"></div>
        <div class="mobile-drawer-roles">
          <span>Cambiar zona</span>
          <button
            v-for="role in roles"
            :key="role.value"
            type="button"
            :class="{ active: currentRole === role.value }"
            @click="setRole(role.value)"
          >
            <component :is="role.icon" :size="19" />
            <span><strong>{{ role.label }}</strong><small>{{ role.caption }}</small></span>
          </button>
        </div>
        <button class="mobile-drawer-logout" type="button" @click="logout">
          <LogOut :size="19" /> Cerrar sesión
        </button>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div class="zone-switcher-float gt-sm">
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Calculator,
  ChevronsUpDown,
  ClipboardList,
  Factory,
  LogOut,
  Menu,
  Scale,
  Truck,
  Warehouse,
  X,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authTokenKey = 'mark-auth-token'
const drawerOpen = ref(false)

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
    to: '/expedicion/stock',
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
const navigation = {
  balanza: [{ label: 'Balanza', to: '/balanza', icon: Scale, section: 'balanza' }],
  produccion: [
    { label: 'Producciones', to: '/produccion', icon: Factory, section: 'producciones' },
    { label: 'Balance de masa', to: '/produccion/balance', icon: Calculator, section: 'balance' },
  ],
  expedicion: [
    { label: 'Stock', to: '/expedicion/stock', icon: Warehouse, section: 'stock' },
    { label: 'Pedidos', to: '/expedicion/pedidos', icon: ClipboardList, section: 'pedidos' },
    { label: 'Repartos', to: '/expedicion/repartos', icon: Truck, section: 'repartos' },
    { label: 'Movimientos', to: '/expedicion/movimientos', icon: Warehouse, section: 'movimientos' },
  ],
}
const currentNavigation = computed(() =>
  navigation[currentRole.value].map((item) => ({
    ...item,
    active: () => sectionIsActive(currentRole.value, item.section),
  })),
)

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

function setRole(roleValue) {
  const role = roles.find((item) => item.value === roleValue)
  if (role) {
    drawerOpen.value = false
    router.push(role.to)
  }
}

function logout() {
  localStorage.removeItem(authTokenKey)
  router.replace('/')
}

function expeditionSectionClass(section) {
  const active =
    section === 'stock'
      ? (route.path === '/expedicion' || route.path === '/expedicion/stock') && !route.query.view
      : section === 'movimientos'
        ? route.path === '/expedicion/movimientos' || route.query.view === 'movimientos'
        : route.path.startsWith(`/expedicion/${section}`) || route.query.view === section
  return active ? 'router-link-exact-active' : ''
}

function productionSectionClass(section) {
  const active =
    section === 'producciones'
      ? route.path === '/produccion' || route.path === '/produccion/proceso'
      : route.path === `/produccion/${section}`
  return active ? 'router-link-exact-active' : ''
}

function sectionIsActive(role, section) {
  if (role === 'balanza') return route.path.startsWith('/balanza')
  if (role === 'produccion') return Boolean(productionSectionClass(section))
  return Boolean(expeditionSectionClass(section))
}
</script>

<style scoped lang="scss">
.app-layout {
  background: var(--canvas);
}

.app-header {
  border-bottom: 1px solid var(--line);
  background: rgb(255 255 255 / 96%);
  color: #111;
  backdrop-filter: blur(12px);
}

.app-header :deep(.q-toolbar) {
  gap: 12px;
  min-height: 68px;
  padding: 0 18px;
  overflow-x: auto;
}

.top-brand {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  height: 52px;
  padding: 0 4px;
  overflow: hidden;
}

.top-brand-logo {
  width: 130px;
  height: auto;
  object-fit: contain;
}

.top-nav {
  display: flex;
  flex: 1 1 auto;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.top-nav-item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  color: #656565;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: 160ms ease;
}

.top-nav-item:hover {
  background: #f7f7f7;
  color: #111;
}

.top-nav-item.router-link-exact-active {
  background: var(--soft-red);
  color: var(--brand);
}

.header-menu-button {
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #222;
  cursor: pointer;
}

.header-menu-button:hover {
  border-color: #bbb;
}

.mobile-header-title {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-drawer {
  background: #fff;
}

.mobile-drawer-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  border-bottom: 1px solid var(--line);
}

.mobile-drawer-header img {
  width: 110px;
}

.mobile-drawer-header button,
.mobile-drawer-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--ink);
}

.mobile-drawer-zone {
  display: flex;
  gap: 11px;
  align-items: center;
  margin: 16px 0 10px;
  padding: 13px;
  border-radius: 13px;
  background: #111;
  color: #fff;
}

.mobile-drawer-zone div,
.mobile-drawer-zone span,
.mobile-drawer-roles button span {
  display: grid;
  min-width: 0;
}

.mobile-drawer-zone small,
.mobile-drawer-roles small {
  opacity: 0.66;
  font-size: 11px;
}

.mobile-drawer-nav {
  display: grid;
  gap: 5px;
}

.mobile-drawer-nav a {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 48px;
  padding: 0 13px;
  border-radius: 11px;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.mobile-drawer-nav a.active {
  background: var(--soft-red);
  color: var(--brand);
}

.mobile-drawer-spacer {
  flex: 1;
  min-height: 24px;
}

.mobile-drawer-roles {
  display: grid;
  gap: 5px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.mobile-drawer-roles > span {
  padding: 0 8px 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.mobile-drawer-roles button,
.mobile-drawer-logout {
  display: flex;
  width: 100%;
  gap: 11px;
  align-items: center;
  justify-content: flex-start;
  min-height: 48px;
  padding: 7px 10px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #555;
  text-align: left;
}

.mobile-drawer-roles button.active {
  background: #f5f5f4;
  color: var(--ink);
}

.mobile-drawer-logout {
  margin-top: 10px;
  color: var(--brand-dark);
  font-weight: 650;
}

.zone-switcher-float {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 6000;
  display: flex;
  gap: 8px;
  align-items: center;
}

.zone-fab {
  display: flex;
  gap: 9px;
  align-items: center;
  min-height: 48px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgb(0 0 0 / 12%);
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: 160ms ease;
}

.zone-fab:hover {
  border-color: #cfcfcf;
  box-shadow: 0 10px 34px rgb(0 0 0 / 16%);
}

.zone-fab--icon {
  width: 48px;
  min-height: 48px;
  justify-content: center;
  padding: 0;
}

.zone-fab-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 9px;
  background: #111;
  color: #fff;
}

.zone-fab-copy {
  display: grid;
  flex: 1;
  gap: 1px;
}

.zone-fab-copy strong {
  font-size: 13px;
}

.zone-fab-copy small {
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 1023px) {
  .app-header :deep(.q-toolbar) {
    min-height: 62px;
    overflow: hidden;
    padding: max(4px, env(safe-area-inset-top)) 12px 4px;
  }

  .top-brand {
    height: 48px;
    margin-right: auto;
  }

  .top-brand-logo {
    width: 104px;
  }

  .header-menu-button {
    width: 44px;
    min-height: 44px;
  }
}
</style>
