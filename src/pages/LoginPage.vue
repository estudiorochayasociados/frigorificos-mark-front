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
        <q-input v-model="email" outlined dense type="email" label="Correo" autocomplete="email" />
        <q-input
          v-model="password"
          outlined
          dense
          type="password"
          label="Contraseña"
          autocomplete="current-password"
        />
        <p v-if="error" class="login-error">{{ error }}</p>
        <button class="primary-action full-width" type="submit" :disabled="loading">
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
import { iniciarSesion } from '@/services/api'

const authTokenKey = 'mark-auth-token'
const accountKey = 'mark-auth-account'
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  loading.value = true
  error.value = ''
  try {
    const session = await iniciarSesion(email.value, password.value)
    localStorage.setItem(authTokenKey, session.token)
    localStorage.setItem(accountKey, JSON.stringify(session.cuenta))
    router.replace('/balanza')
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}
</script>
