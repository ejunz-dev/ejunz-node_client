export function normalizeServerUrl(value: string): string {
  const input = value.trim()
  if (!input) return ''
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `http://${input}`
  return withProtocol.replace(/\/+$/, '')
}

export function buildApiUrl(serverUrl: string, path: string, token = ''): string {
  const base = normalizeServerUrl(serverUrl)
  // In H5 dev mode, use a relative URL so the Vite dev proxy handles the
  // cross-origin request instead of the browser (avoids CORS errors).
  if (typeof window !== 'undefined' && base && !base.startsWith(window.location.origin)) {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, `${window.location.origin}/`)
    if (token) url.searchParams.set('token', token)
    return url.toString()
  }
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${base}/`)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

export function buildEdgeWsUrl(serverUrl: string, token = ''): string {
  const base = normalizeServerUrl(serverUrl)
  const url = new URL('/api/edge/ws', `${base}/`)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

export function displayServerUrl(serverUrl: string): string {
  return normalizeServerUrl(serverUrl).replace(/^https?:\/\//i, '')
}

export function redactUrl(value: string): string {
  try {
    const url = new URL(value)
    if (url.searchParams.has('token')) url.searchParams.set('token', '***')
    return url.toString()
  } catch { return value.replace(/([?&]token=)[^&]*/i, '$1***') }
}
