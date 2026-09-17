const authTokenKey = 'mark-auth-token'
const accountKey = 'mark-auth-account'
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://26.103.1.82:3000/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem(authTokenKey)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.mensaje || 'No se pudo completar la operación.')
    error.status = response.status
    error.code = data?.codigo

    // A protected request rejected by the API means the stored session can no longer be used.
    if (response.status === 401 && path !== '/autenticacion/login') {
      localStorage.removeItem(authTokenKey)
      localStorage.removeItem(accountKey)
      window.dispatchEvent(new Event('mark:session-invalid'))
    }

    throw error
  }

  return data
}

export function iniciarSesion(correo, contrasena) {
  return apiRequest('/autenticacion/login', {
    method: 'POST',
    body: JSON.stringify({ correo, contrasena }),
  })
}
