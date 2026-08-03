const CONNECTION_KEY = 'ejunz_edge_conn'
const PASSWORD_KEY = 'ejunz_edge_pass'

export interface SavedCredentials { serverUrl: string; username: string; password: string }
export function saveCredentials(credentials: SavedCredentials): void {
  try {
    uni.setStorageSync(CONNECTION_KEY, JSON.stringify({ serverUrl: credentials.serverUrl, username: credentials.username }))
    uni.setStorageSync(PASSWORD_KEY, credentials.password)
  } catch { /* storage is optional on unusual runtimes */ }
}
export function loadCredentials(): SavedCredentials | null {
  try {
    const raw = uni.getStorageSync(CONNECTION_KEY)
    if (!raw) return null
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!value?.serverUrl) return null
    return { serverUrl: value.serverUrl, username: value.username || '', password: String(uni.getStorageSync(PASSWORD_KEY) || '') }
  } catch { return null }
}
export function clearCredentials(): void {
  try { uni.removeStorageSync(CONNECTION_KEY); uni.removeStorageSync(PASSWORD_KEY) } catch { /* ignore */ }
}
