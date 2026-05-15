/**
 * Frontend API client for the DevOrbit Flask backend.
 *
 * The Vite dev server proxies `/api` to `http://127.0.0.1:5000`, so callers
 * can use stable relative paths in development and production previews.
 */
const BASE = '/api'

/**
 * Send a JSON request and normalize backend errors into thrown Error objects.
 *
 * @param {string} path API path relative to `/api`.
 * @param {RequestInit} options Fetch options such as method and body.
 * @returns {Promise<unknown>} Parsed JSON response body.
 */
async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

/**
 * Typed-by-convention API surface used by React pages.
 *
 * Keeping endpoint construction here prevents route strings from spreading
 * across page components and makes backend contract changes easier to manage.
 */
export const api = {
  getTasks:       (params = {}) => req(`/tasks?${new URLSearchParams(params)}`),
  createTask:     (body)        => req('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  getTask:        (id)          => req(`/tasks/${id}`),
  updateStatus:   (id, status)  => req(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  saveSnapshot:   (id, content) => req(`/tasks/${id}/snapshot`, { method: 'POST', body: JSON.stringify({ content }) }),
  logInterrupt:   (id, note)    => req(`/tasks/${id}/interrupt`, { method: 'POST', body: JSON.stringify({ note }) }),
  getStandup:     ()            => req('/standup'),
}
