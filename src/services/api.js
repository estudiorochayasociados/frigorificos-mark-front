const authTokenKey = 'mark-auth-token'
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

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
    throw error
  }

  return data
}

export function iniciarSesion(usuario, contrasena) {
  return apiRequest('/autenticacion/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, contrasena }),
  })
}
