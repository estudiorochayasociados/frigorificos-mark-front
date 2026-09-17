import { apiRequest } from '@/services/api'
import { dateQuery } from '@/utils/date'

export function useProducciones() {
  function listarProducciones(date) {
    return apiRequest(`/producciones${dateQuery(date)}`)
  }

  function obtenerProduccion(id) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}`)
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

  function agregarCamiones(id, truckIds) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/camiones`, {
      method: 'PATCH',
      body: JSON.stringify({ truckIds }),
    })
  }

  function confirmarProduccion(id, datos) {
    return apiRequest(`/producciones/${encodeURIComponent(id)}/produccion`, {
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
    cerrarProduccion,
  }
}
