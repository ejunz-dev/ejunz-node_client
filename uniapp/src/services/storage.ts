const CONNECTION_KEY = 'ejunz_edge_conn'
const PASSWORD_KEY = 'ejunz_edge_pass'

export interface SavedCredentials { serverUrl: string; username: string; password: string }

/**
 * Save credentials to platform-specific persistent storage.
 *
 * - H5 / Tauri: localStorage (via uni-app)
 * - App (iOS/Android): NSUserDefaults / SharedPreferences (via uni-app native storage)
 * - Mini-program: wx.setStorageSync / my.setStorageSync etc.
 */
export function saveCredentials(credentials: SavedCredentials): void {
  try {
    uni.setStorageSync(CONNECTION_KEY, JSON.stringify({ serverUrl: credentials.serverUrl, username: credentials.username }))
    uni.setStorageSync(PASSWORD_KEY, credentials.password)
  } catch (error) {
    console.warn('[storage] Failed to save credentials:', error)
  }
}

/**
 * Load saved credentials from platform-specific persistent storage.
 * Returns null if no saved credentials exist or if they are corrupted.
 */
export function loadCredentials(): SavedCredentials | null {
  try {
    const raw = uni.getStorageSync(CONNECTION_KEY)
    if (!raw) return null
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!value?.serverUrl) return null
    return {
      serverUrl: value.serverUrl,
      username: value.username || '',
      password: String(uni.getStorageSync(PASSWORD_KEY) || ''),
    }
  } catch (error) {
    console.warn('[storage] Failed to load credentials:', error)
    return null
  }
}

/**
 * Clear all saved credentials from storage.
 */
export function clearCredentials(): void {
  try {
    uni.removeStorageSync(CONNECTION_KEY)
    uni.removeStorageSync(PASSWORD_KEY)
  } catch (error) {
    console.warn('[storage] Failed to clear credentials:', error)
  }
}

/**
 * Check if persistent storage is available on the current platform.
 * Some mini-program environments may restrict storage access.
 */
export function isStorageAvailable(): boolean {
  try {
    uni.setStorageSync('__storage_test__', '1')
    uni.removeStorageSync('__storage_test__')
    return true
  } catch {
    return false
  }
}
