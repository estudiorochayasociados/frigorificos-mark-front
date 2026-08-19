<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="mobile-header lt-md">
      <q-toolbar>
        <img class="mobile-logo" src="/images/logo.png" alt="Mark" />
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
          <router-link v-if="currentRole === 'lider'" to="/lider" class="nav-item">
            <UsersRound :size="20" />
            <span>Lider de linea</span>
          </router-link>
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
      <router-link v-if="currentRole === 'lider'" to="/lider" class="bottom-nav-item">
        <UsersRound :size="21" />
        <span>Lider</span>
      </router-link>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronsUpDown, Scale, UserRound, UsersRound } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const roles = [
  {
    value: 'balanza',
    label: 'Balanza',
    caption: 'Camiones y pesos',
    icon: Scale,
  },
  {
    value: 'lider',
    label: 'Lider de linea',
    caption: 'Incidencias y tiempos',
    icon: UsersRound,
  },
]

const currentRole = computed(() => (route.path.startsWith('/lider') ? 'lider' : 'balanza'))
const currentRoleData = computed(() => roles.find((role) => role.value === currentRole.value))
const currentRoleLabel = computed(() => currentRoleData.value?.label)
const currentRoleCaption = computed(() => currentRoleData.value?.caption)
const currentRoleIcon = computed(() => currentRoleData.value?.icon)

function setRole(role) {
  router.push(role === 'lider' ? '/lider' : '/balanza')
}
</script>
