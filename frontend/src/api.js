
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '')

// Thin fetch wrapper: cookies for the session, X-CSRF-Token for state-changing calls.
function csrf() {
  const m = document.cookie.match(/(?:^|; )pg_csrf=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}

  if (method !== 'GET') {
    headers['X-CSRF-Token'] = csrf()
  }

  let payload

  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const endpoint = `${API_BASE_URL}/api${path}`

  const res = await fetch(endpoint, {
    method,
    headers,
    body: payload,
    credentials: 'include',
  })

  if (res.status === 204) return null

  const isJson = (res.headers.get('content-type') || '').includes(
    'application/json'
  )

  const data = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    let msg = 'Something went wrong. Try again.'

    if (typeof data?.detail === 'string') {
      msg = data.detail
    } else if (Array.isArray(data?.detail)) {
      msg = data.detail.map((d) => d.msg).join(' ')
    }

    throw new ApiError(res.status, msg)
  }

  return data
}
