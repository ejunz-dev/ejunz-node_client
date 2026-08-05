import { clearCredentials, loadCredentials, saveCredentials, type SavedCredentials } from './storage'
import { buildApiUrl, buildEdgeWsUrl, normalizeServerUrl } from '@/utils/url'
import { isDesktop, isMiniProgram, isApp } from '@/utils/platform'
import type { AuthConfig, Device, EdgeNode, EdgeStatus, UpstreamConfig } from '@/types/edge'

let credentials: SavedCredentials = { serverUrl: '', username: '', password: '' }
export function setCredentials(serverUrl: string, username: string, password: string): void { credentials = { serverUrl: normalizeServerUrl(serverUrl), username, password } }
export function getCredentials(): SavedCredentials { return { ...credentials } }
export function getServerUrl(): string { return credentials.serverUrl }
export function getUsername(): string { return credentials.username }
export function getPassword(): string { return credentials.password }
export function getEdgeWsUrl(): string { return buildEdgeWsUrl(credentials.serverUrl, credentials.password) }
export function persistCredentials(): void { saveCredentials(credentials) }
export function restoreCredentials(): boolean { const saved = loadCredentials(); if (!saved) return false; setCredentials(saved.serverUrl, saved.username, saved.password); return true }
export function disconnect(): void { credentials = { serverUrl: '', username: '', password: '' }; clearCredentials() }

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = 'ApiError' } }

/**
 * Get the default request timeout based on platform.
 * Mini-programs and native apps may have different network characteristics.
 */
function getDefaultTimeout(): number {
  // Mini-programs often have stricter timeout limits
  if (isMiniProgram()) return 10000
  // Native apps can use longer timeouts
  if (isApp()) return 20000
  // H5 default
  return 15000
}

/**
 * Make an HTTP request using a custom Tauri Rust command, bypassing WebView
 * CORS restrictions. Only used in the Tauri desktop production build.
 */
async function tauriRequest(url: string, options: Omit<UniApp.RequestOptions, 'url'>): Promise<{ data: any; statusCode: number }> {
  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = { ...(options.header || {}) as Record<string, string> }
  const timeout = options.timeout ?? 15000

  let body: string | undefined
  if (options.data !== undefined && method !== 'GET') {
    body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data)
  }

  // Invoke the custom Tauri Rust command — no npm imports needed.
  const [status, text] = await (window as any).__TAURI_INTERNALS__.invoke<[number, string]>('http_request', {
    url,
    method,
    headers: Object.keys(headers).length > 0 ? headers : null,
    body: body || null,
    timeout,
  })

  let data: any
  try { data = JSON.parse(text) } catch { data = text }
  return { data, statusCode: status }
}

export async function api<T>(path: string, options: Omit<UniApp.RequestOptions, 'url'> = {}): Promise<T> {
  if (!credentials.serverUrl) throw new ApiError(0, '未连接到 Edge 服务器')
  const url = buildApiUrl(credentials.serverUrl, path, credentials.password)
  const headers: Record<string, string> = { ...(options.header || {}) }
  if (options.data !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const timeout = options.timeout ?? getDefaultTimeout()

  // In Tauri desktop, use the HTTP plugin to bypass WebView CORS restrictions.
  if (isDesktop()) {
    try {
      const response = await tauriRequest(url, { ...options, header: headers, timeout })
      const body = response.data as any
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new ApiError(response.statusCode, body?.error || `HTTP ${response.statusCode}`)
      }
      return body as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(0, error instanceof Error ? error.message : '网络请求失败')
    }
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      url,
      header: headers,
      timeout,
      success: (response) => {
        const body = response.data as any
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new ApiError(response.statusCode, body?.error || `HTTP ${response.statusCode}`))
          return
        }
        resolve(body as T)
      },
      fail: (error) => {
        // Provide platform-specific error messages
        const message = error.errMsg || '网络请求失败'
        reject(new ApiError(0, message))
      },
    })
  })
}
export function fetchStatus() { return api<EdgeStatus>('/api/edge/status') }
export function fetchNodes() { return api<{ nodes: EdgeNode[] }>('/api/edge/nodes') }
export function fetchNodeDevices(nodeId: string) { return api<{ devices: Device[]; count: number }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/devices`) }
export function controlDevice(nodeId: string, deviceId: string, state: 'ON' | 'OFF' | 'TOGGLE') { return api<{ result: unknown }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/devices/control`, { method: 'POST', data: { deviceId, state } }) }
export function authorizeNode(nodeId: string) { return api<{ ok: number; nodeId: string }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/authorize`, { method: 'POST' }) }
export function revokeNode(nodeId: string) { return api<{ ok: number }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/revoke`, { method: 'POST' }) }
export function fetchAuthConfig() { return api<AuthConfig>('/api/edge/auth-config') }
export function updateAuthConfig(config: { enabled?: boolean; username?: string; password?: string }) { return api<{ ok: number; enabled: boolean; username: string }>('/api/edge/auth-config', { method: 'POST', data: config }) }
export function fetchUpstreamConfig() { return api<UpstreamConfig>('/api/edge/upstream') }
export function updateUpstreamConfig(config: { enabled?: boolean; endpoint?: string; token?: string }) { return api<{ ok: number; endpoint: string }>('/api/edge/upstream', { method: 'POST', data: config }) }
export function restartUpstream() { return api<{ ok: number }>('/api/edge/upstream/restart', { method: 'POST' }) }
