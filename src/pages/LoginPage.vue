<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-logo-wrap">
        <img class="login-logo" src="/images/logo.png" alt="Mark" />
      </div>

      <div class="login-copy">
        <span class="eyebrow"><LockKeyhole :size="14" /> ACCESO OPERATIVO</span>
        <h1>Ingresar al sistema</h1>
      </div>

      <q-form class="login-form" @submit.prevent="login">
        <q-input v-model="email" outlined dense label="Usuario" autocomplete="username" />
        <q-input
          v-model="password"
          outlined
          dense
          type="password"
          label="Contraseña"
          autocomplete="current-password"
        />
        <button class="primary-action full-width" type="submit">
          Entrar <ArrowRight :size="17" />
        </button>
      </q-form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, LockKeyhole } from '@lucide/vue'

const authTokenKey = 'mark-auth-token'
const router = useRouter()
const email = ref('demo@mark.local')
const password = ref('demo')

function login() {
  localStorage.setItem(authTokenKey, `demo-token-${Date.now()}`)
  router.replace('/balanza')
}
</script>
