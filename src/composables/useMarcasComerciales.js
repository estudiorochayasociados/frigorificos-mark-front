import { ref } from 'vue'
import { apiRequest } from '@/services/api'

export function useMarcasComerciales() {
  const marcas = ref([])
  const cargando = ref(false)

  async function listarMarcasComerciales() {
    cargando.value = true
    try {
      marcas.value = await apiRequest('/marcas-comerciales')
      return marcas.value
    } finally {
      cargando.value = false
    }
  }

  function crearMarcaComercial(datos) {
    return apiRequest('/marcas-comerciales', { method: 'POST', body: JSON.stringify(datos) })
  }

  function actualizarMarcaComercial(id, datos) {
    return apiRequest(`/marcas-comerciales/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function eliminarMarcaComercial(id) {
    return apiRequest(`/marcas-comerciales/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  return {
    marcas,
    cargando,
    listarMarcasComerciales,
    crearMarcaComercial,
    actualizarMarcaComercial,
    eliminarMarcaComercial,
  }
}
