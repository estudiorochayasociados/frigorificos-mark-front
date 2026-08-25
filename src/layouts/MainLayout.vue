<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="mobile-header lt-md">
      <q-toolbar>
        <img class="mobile-logo" src="/images/logo.png" alt="Mark" />
        <q-toolbar-title class="mobile-title">{{ currentSectionLabel }}</q-toolbar-title>
        <button class="role-pill" type="button">
          <UserRound :size="16" />
          {{ currentRoleLabel }}
          <ChevronDown :size="14" />
          <q-menu auto-close class="role-menu">
            <q-list padding style="min-width: 220px">
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
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above :model-value="true" :width="264" class="app-sidebar" breakpoint="1024">
      <div class="sidebar-content">
        <div class="brand-block">
          <img class="brand-logo" src="/images/logo.png" alt="Mark" />
          <div>
            <div class="brand-name">MARK</div>
            <div class="brand-caption">Gestion frigorifica</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-label">OPERACION</span>
          <router-link v-if="currentRole === 'balanza'" to="/balanza" class="nav-item">
            <Scale :size="20" />
            <span>Balanza</span>
          </router-link>
          <template v-if="currentRole === 'produccion'">
            <router-link to="/produccion" class="nav-item">
              <Factory :size="20" />
              <span>Producciones</span>
            </router-link>
            <router-link to="/produccion?view=historial" class="nav-item">
              <History :size="20" />
              <span>Historial</span>
            </router-link>
          </template>
          <template v-if="currentRole === 'expedicion'">
            <router-link
              to="/expedicion?view=pedidos"
              :class="['nav-item', expeditionSectionClass('pedidos')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <ClipboardList :size="20" />
              <span>Pedidos</span>
            </router-link>
            <router-link
              to="/expedicion"
              :class="['nav-item', expeditionSectionClass('cargas')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <Truck :size="20" />
              <span>Cargas</span>
            </router-link>
            <router-link
              to="/expedicion?view=reportes"
              :class="['nav-item', expeditionSectionClass('reportes')]"
              active-class="route-match"
              exact-active-class="route-exact-match"
            >
              <ChartNoAxesColumnIncreasing :size="20" />
              <span>Reportes</span>
            </router-link>
          </template>
        </nav>

        <div class="sidebar-spacer"></div>

        <div class="profile-label">PERFIL DE DEMO</div>
        <button class="profile-switcher" type="button">
          <span class="profile-avatar"><component :is="currentRoleIcon" :size="19" /></span>
          <span class="profile-copy">
            <strong>{{ currentRoleLabel }}</strong>
            <small>{{ currentRoleCaption }}</small>
          </span>
          <ChevronsUpDown :size="18" />
          <q-menu anchor="top left" self="bottom left" class="role-menu">
            <q-list padding style="min-width: 232px">
              <q-item
                v-for="role in roles"
                :key="role.value"
                clickable
                v-close-popup
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
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="mobile-bottom-nav lt-md">
      <router-link v-if="currentRole === 'balanza'" to="/balanza" class="bottom-nav-item">
        <Scale :size="21" />
        <span>Balanza</span>
      </router-link>
      <template v-if="currentRole === 'produccion'">
        <router-link to="/produccion" class="bottom-nav-item">
          <Factory :size="21" />
          <span>Producciones</span>
        </router-link>
        <router-link to="/produccion?view=historial" class="bottom-nav-item">
          <History :size="21" />
          <span>Historial</span>
        </router-link>
      </template>
      <template v-if="currentRole === 'expedicion'">
        <router-link
          to="/expedicion?view=pedidos"
          :class="['bottom-nav-item', expeditionSectionClass('pedidos')]"
          active-class="route-match"
          exact-active-class="route-exact-match"
        >
          <ClipboardList :size="21" />
          <span>Pedidos</span>
        </router-link>
        <router-link
          to="/expedicion"
          :class="['bottom-nav-item', expeditionSectionClass('cargas')]"
          active-class="route-match"
          exact-active-class="route-exact-match"
        >
          <Truck :size="21" />
          <span>Cargas</span>
        </router-link>
        <router-link
          to="/expedicion?view=reportes"
          :class="['bottom-nav-item', expeditionSectionClass('reportes')]"
          active-class="route-match"
          exact-active-class="route-exact-match"
        >
          <ChartNoAxesColumnIncreasing :size="21" />
          <span>Reportes</span>
        </router-link>
      </template>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Factory,
  History,
  Scale,
  Truck,
  UserRound,
  Warehouse,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

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
    caption: 'Zona 2 y producto terminado',
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
const currentSectionLabel = computed(() => {
  if (currentRole.value === 'produccion') return 'Zona 2'
  if (currentRole.value === 'expedicion') return 'Zona 3'
  return 'Zona 1'
})

function setRole(roleValue) {
  const role = roles.find((item) => item.value === roleValue)
  if (role) router.push(role.to)
}

function expeditionSectionClass(section) {
  const view = route.query.view
  const active = section === 'cargas' ? view !== 'pedidos' && view !== 'reportes' : view === section
  return active ? 'router-link-exact-active' : ''
}
</script>
