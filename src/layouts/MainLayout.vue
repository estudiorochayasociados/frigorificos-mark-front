<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="mobile-header lt-md">
      <q-toolbar>
        <div class="brand-mark brand-mark--small">M</div>
        <q-toolbar-title class="mobile-title">Zona 1</q-toolbar-title>
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
          <div class="brand-mark">M</div>
          <div>
            <div class="brand-name">MARK</div>
            <div class="brand-caption">Gestion frigorifica</div>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-icon"><Factory :size="19" /></div>
          <div>
            <span>Planta activa</span>
            <strong>Zona 1 Produccion</strong>
          </div>
          <span class="online-dot"></span>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-label">OPERACION</span>
          <router-link
            :to="{ path: '/', query: { ...$route.query, view: 'tablero' } }"
            class="nav-item"
          >
            <LayoutDashboard :size="20" />
            <span>Tablero operativo</span>
          </router-link>
          <router-link
            :to="{ path: '/', query: { ...$route.query, view: 'sap' } }"
            class="nav-item"
          >
            <FileInput :size="20" />
            <span>Entrada DTE / Remito</span>
          </router-link>
        </nav>

        <div class="sidebar-spacer"></div>

        <div class="profile-label">PERFIL DE DEMO</div>
        <button class="profile-switcher" type="button">
          <span class="profile-avatar"><component :is="currentRoleIcon" :size="19" /></span>
          <span class="profile-copy">
            <strong>{{ currentRoleLabel }}</strong>
            <small>Cambiar perfil</small>
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
      <router-link
        :to="{ path: '/', query: { ...$route.query, view: 'tablero' } }"
        class="bottom-nav-item"
      >
        <LayoutDashboard :size="21" />
        <span>Tablero</span>
      </router-link>
      <router-link
        :to="{ path: '/', query: { ...$route.query, view: 'sap' } }"
        class="bottom-nav-item"
      >
        <FileInput :size="21" />
        <span>DTE / Remito</span>
      </router-link>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  ChevronsUpDown,
  Factory,
  FileInput,
  LayoutDashboard,
  Scale,
  UserRound,
  UsersRound,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const roles = [
  {
    value: 'balanza',
    label: 'Balanza',
    caption: 'Camiones, pesos y SAP',
    icon: Scale,
  },
  {
    value: 'lider',
    label: 'Lider de linea',
    caption: 'Incidencias y tiempos',
    icon: UsersRound,
  },
]

const currentRole = computed(() => (route.query.role === 'lider' ? 'lider' : 'balanza'))
const currentRoleData = computed(() => roles.find((role) => role.value === currentRole.value))
const currentRoleLabel = computed(() => currentRoleData.value?.label)
const currentRoleIcon = computed(() => currentRoleData.value?.icon)

function setRole(role) {
  router.push({ path: '/', query: { ...route.query, role } })
}
</script>
