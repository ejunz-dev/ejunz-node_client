const CONNECTION_KEY = 'ejunz_edge_conn'
const PASSWORD_KEY = 'ejunz_edge_pass'

export interface SavedCredentials { serverUrl: string; username: string; password: string }

/**
 * Check if running inside Neutralino.js with native storage API.
 */
function isNeutralinoStorage(): boolean {
  try {
    return typeof window !== 'undefined' &&
      typeof (window as any).__NL_OS !== 'undefined' &&
      typeof (window as any).Neutralino?.storage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Save credentials to platform-specific persistent storage.
 *
 * - Neutralino: Neutralino.storage.* (native OS keychain)
 * - H5: localStorage
 * - App (iOS/Android): NSUserDefaults / SharedPreferences (via uni-app native storage)
 * - Mini-program: wx.setStorageSync / my.setStorageSync etc.
 */
export function saveCredentials(credentials: SavedCredentials): void {
  if (isNeutralinoStorage()) {
    try {
      const NL = (window as any).Neutralino
      NL.storage.setData(CONNECTION_KEY, JSON.stringify({ serverUrl: credentials.serverUrl, username: credentials.username }))
      NL.storage.setData(PASSWORD_KEY, credentials.password)
      return
    } catch (error) {
      console.warn('[storage] Neutralino storage failed, falling back:', error)
    }
  }
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
  if (isNeutralinoStorage()) {
    try {
      const NL = (window as any).Neutralino
      const raw = NL.storage.getData(CONNECTION_KEY)
      if (!raw) return null
      const value = JSON.parse(raw)
      if (!value?.serverUrl) return null
      return {
        serverUrl: value.serverUrl,
        username: value.username || '',
        password: String(NL.storage.getData(PASSWORD_KEY) || ''),
      }
    } catch (error) {
      console.warn('[storage] Neutralino storage failed, falling back:', error)
    }
  }
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
  if (isNeutralinoStorage()) {
    try {
      const NL = (window as any).Neutralino
      NL.storage.setData(CONNECTION_KEY, '')
      NL.storage.setData(PASSWORD_KEY, '')
      return
    } catch (error) {
      console.warn('[storage] Neutralino clear failed, falling back:', error)
    }
  }
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
  if (isNeutralinoStorage()) return true
  try {
    uni.setStorageSync('__storage_test__', '1')
    uni.removeStorageSync('__storage_test__')
    return true
  } catch {
    return false
  }
}
