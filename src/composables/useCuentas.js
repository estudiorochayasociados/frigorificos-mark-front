import { ref } from 'vue'
import { apiRequest } from '@/services/api'

export function useCuentas() {
  const cuentas = ref([])

  async function listarCuentas() {
    cuentas.value = await apiRequest('/cuentas')
    return cuentas.value
  }

  function crearCuenta(datos) {
    return apiRequest('/cuentas', { method: 'POST', body: JSON.stringify(datos) })
  }

  function actualizarCuenta(id, datos) {
    return apiRequest(`/cuentas/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function eliminarCuenta(id) {
    return apiRequest(`/cuentas/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return { cuentas, listarCuentas, crearCuenta, actualizarCuenta, eliminarCuenta }
}
