import { ref } from 'vue'
import { apiRequest } from '@/services/api'
import { dateQuery } from '@/utils/date'

export function useCamiones() {
  const camiones = ref([])
  const cargando = ref(false)
  const error = ref('')

  async function listarCamiones(fecha) {
    cargando.value = true
    error.value = ''
    try {
      const query = dateQuery(fecha)
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
    return apiRequest('/camiones', { method: 'POST', body: JSON.stringify(truckPayload(datos)) })
  }

  function actualizarCamion(id, datos) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(truckPayload(datos)),
    })
  }

  function guardarFaena(id, datos) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}/faena`, {
      method: 'PATCH',
      body: JSON.stringify({
        faena: { novedades: datos.faena?.novedades },
        fechas: {
          egreso: datos.fechas?.egreso,
          inicioFaena: datos.fechas?.inicioFaena,
          finFaena: datos.fechas?.finFaena,
        },
      }),
    })
  }

  function eliminarCamion(id) {
    return apiRequest(`/camiones/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  function truckPayload(datos) {
    return {
      comercial: {
        loteSenasa: datos.comercial?.loteSenasa,
        documentos: { ...datos.comercial?.documentos },
        marcaComercial: datos.comercial?.marcaComercialId,
      },
      vehiculo: { ...datos.vehiculo },
      pesos: {
        origen: { ...datos.pesos?.origen },
        planta: { ...datos.pesos?.planta },
        faena: { ...datos.pesos?.faena },
      },
      aves: { ...datos.aves },
      fechas: {
        ingreso: { ...datos.fechas?.ingreso },
        egreso: { ...datos.fechas?.egreso },
      },
      operacion:
        Number(datos.operacion?.ordenProduccion || 0) > 0
          ? { ordenProduccion: Number(datos.operacion.ordenProduccion) }
          : {},
    }
  }

  async function ordenarCamiones(ids, fecha) {
    const resultado = await apiRequest('/camiones/orden', {
      method: 'PATCH',
      body: JSON.stringify({ truckIds: ids, ...(fecha ? { date: fecha } : {}) }),
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
