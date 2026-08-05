import { isDesktop } from './platform'

/** Append a query parameter to a URL string, handling existing query. */
function setQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

export function normalizeServerUrl(value: string): string {
  const input = value.trim()
  if (!input) return ''
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `http://${input}`
  return withProtocol.replace(/\/+$/, '')
}

export function buildApiUrl(serverUrl: string, path: string, token = ''): string {
  const base = normalizeServerUrl(serverUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // In H5 dev mode, use a relative URL so the Vite dev proxy handles the
  // cross-origin request instead of the browser (avoids CORS errors).
  // Skip this for Tauri desktop — there's no dev proxy, use direct URL.
  if (!isDesktop() && typeof window !== 'undefined' && base && !base.startsWith(window.location.origin)) {
    let url = `${window.location.origin}${normalizedPath}`
    if (token) url = setQueryParam(url, 'token', token)
    return url
  }
  let url = `${base}${normalizedPath}`
  if (token) url = setQueryParam(url, 'token', token)
  return url
}

export function buildEdgeWsUrl(serverUrl: string, token = ''): string {
  const base = normalizeServerUrl(serverUrl)
  let url = `${base}/api/edge/ws`
  // Replace http/https protocol with ws/wss
  url = url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  if (token) url = setQueryParam(url, 'token', token)
  return url
}

export function displayServerUrl(serverUrl: string): string {
  return normalizeServerUrl(serverUrl).replace(/^https?:\/\//i, '')
}

export function redactUrl(value: string): string {
  return value.replace(/([?&]token=)[^&]*/i, '$1***')
}
