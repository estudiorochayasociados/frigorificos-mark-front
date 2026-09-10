import { ref } from 'vue'
import { apiRequest } from '@/services/api'

export function useCamiones() {
  const camiones = ref([])
  const cargando = ref(false)
  const error = ref('')

  async function listarCamiones(fecha) {
    cargando.value = true
    error.value = ''
    try {
      const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : ''
      camiones.value = await apiRequest(`/camiones${query}`)
      return camiones.value
    } catch (exception) {
      error.value = exception.message
      throw exception
    } finally {
      cargando.value = false
    }
  }

  function obtenerCamion(id) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}`)
  }

  function crearCamion(datos) {
    return apiRequest('/camiones', { method: 'POST', body: JSON.stringify(datos) })
  }

  function actualizarCamion(id, datos) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function guardarFaena(id, datos) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}/faena`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function eliminarCamion(id) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function ordenarCamiones(ids) {
    const resultado = await apiRequest('/camiones/orden', {
      method: 'PATCH',
      body: JSON.stringify({ camionIds: ids }),
    })
    camiones.value = resultado
    return resultado
  }

  return {
    camiones,
    cargando,
    error,
    listarCamiones,
    obtenerCamion,
    crearCamion,
    actualizarCamion,
    guardarFaena,
    eliminarCamion,
    ordenarCamiones,
  }
}
