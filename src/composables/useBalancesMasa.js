import { apiRequest } from '@/services/api'
import { dateQuery } from '@/utils/date'

export function useBalancesMasa() {
  function listarBalances(fecha) {
    const query = dateQuery(fecha)
    return apiRequest(`/balances-masa${query}`)
  }

  function crearBalance(datos) {
    return apiRequest('/balances-masa', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  }

  function actualizarBalance(id, datos) {
    return apiRequest(`/balances-masa/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  }

  function eliminarBalance(id) {
    return apiRequest(`/balances-masa/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  return {
    listarBalances,
    crearBalance,
    actualizarBalance,
    eliminarBalance,
  }
}
