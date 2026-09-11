import { apiRequest } from '@/services/api'
import { dateQuery } from '@/utils/date'

const zona2StorageKeys = [
  'mark-frigorifico-produccion-v2',
  'mark-frigorifico-balance-masa-v1',
  'mark-frigorifico-stock-terminado-v1',
]

export function limpiarPersistenciaLocalZona2() {
  if (typeof localStorage === 'undefined') return
  zona2StorageKeys.forEach((key) => localStorage.removeItem(key))
}

export function useProducciones() {
  async function listarProducciones(fecha) {
    const query = dateQuery(fecha)
    const producciones = await apiRequest(`/producciones${query}`)
    limpiarPersistenciaLocalZona2()
    return producciones
  }

  async function obtenerProduccion(id) {
    const produccion = await apiRequest(`/producciones/${encodeURIComponent(id)}`)
    limpiarPersistenciaLocalZona2()
    return produccion
  }

  function crearProduccion(datos) {
    return apiRequest('/producciones', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  }

  function confirmarIngreso(id) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/ingreso`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
  }

  function agregarCamiones(id, camionIds) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/camiones`, {
      method: 'PATCH',
      body: JSON.stringify({ camionIds }),
    })
  }

  function confirmarProduccion(id, datos) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/produccion`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function confirmarConsumo(id, datos) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/consumo`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function cerrarProduccion(id, datos) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/cierre`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  return {
    listarProducciones,
    obtenerProduccion,
    crearProduccion,
    agregarCamiones,
    confirmarIngreso,
    confirmarProduccion,
    confirmarConsumo,
    cerrarProduccion,
  }
}
