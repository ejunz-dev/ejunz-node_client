/**
 * Platform detection utility for uni-app.
 *
 * Provides runtime platform checks that work across all uni-app targets
 * (H5, App, mini-programs). Use these in JavaScript logic; for template-level
 * conditional rendering, prefer uni-app's `#ifdef` preprocessor comments.
 */

export type UniPlatform = 'ios' | 'android' | 'h5' | 'tauri' | 'mp-weixin' | 'mp-alipay' | 'mp-baidu' | 'mp-toutiao' | 'mp-qq' | 'quickapp-webview' | 'app' | 'unknown'

let cachedPlatform: UniPlatform | null = null
let cachedSystemInfo: UniApp.GetSystemInfoResult | null = null

function getSystemInfo(): UniApp.GetSystemInfoResult {
  if (!cachedSystemInfo) {
    try {
      cachedSystemInfo = uni.getSystemInfoSync()
    } catch {
      cachedSystemInfo = {} as UniApp.GetSystemInfoResult
    }
  }
  return cachedSystemInfo
}

/** The current uni-app platform string. */
export function getPlatform(): UniPlatform {
  if (cachedPlatform) return cachedPlatform
  // #ifdef APP-PLUS
  cachedPlatform = 'app'
  // #endif
  // #ifdef H5
  cachedPlatform = 'h5'
  // #endif
  // #ifdef MP-WEIXIN
  cachedPlatform = 'mp-weixin'
  // #endif
  // #ifdef MP-ALIPAY
  cachedPlatform = 'mp-alipay'
  // #endif
  // #ifdef MP-BAIDU
  cachedPlatform = 'mp-baidu'
  // #endif
  // #ifdef MP-TOUTIAO
  cachedPlatform = 'mp-toutiao'
  // #endif
  // #ifdef MP-QQ
  cachedPlatform = 'mp-qq'
  // #endif
  // #ifdef QUICKAPP-WEBVIEW
  cachedPlatform = 'quickapp-webview'
  // #endif
  if (!cachedPlatform) cachedPlatform = 'unknown'

  // Runtime override: detect Tauri desktop wrapper.
  // Tauri serves the H5 build in a native WebView, so the build-time
  // platform is 'h5'. Check for the Tauri runtime API at runtime.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if ((cachedPlatform as UniPlatform) === 'h5' && isTauriRuntime()) {
    cachedPlatform = 'tauri'
  }

  return cachedPlatform
}

/** Check if the Tauri native runtime API is available. */
function isTauriRuntime(): boolean {
  try {
    return typeof window !== 'undefined' &&
      (window as any).__TAURI_INTERNALS__ !== undefined
  } catch {
    return false
  }
}

/** Reset cached platform info (useful in tests or after environment change). */
export function resetPlatformCache(): void {
  cachedPlatform = null
  cachedSystemInfo = null
}

/** Is the current platform a native App (iOS/Android)? */
export function isApp(): boolean {
  return getPlatform() === 'app'
}

/** Is the current platform a mini-program? */
export function isMiniProgram(): boolean {
  const p = getPlatform()
  return p.startsWith('mp-')
}

/** Is the current platform H5 (browser)? */
export function isH5(): boolean {
  return getPlatform() === 'h5'
}

/** Is the current platform Desktop (Tauri)? */
export function isDesktop(): boolean {
  return getPlatform() === 'tauri'
}

/** Is the current platform a desktop OS (macOS/Windows/Linux)? */
export function isDesktopOS(): boolean {
  const info = getSystemInfo()
  return info.platform === 'mac' || info.platform === 'windows' || info.platform === 'linux'
}

/** Is the current platform iOS (native app only)? */
export function isIOS(): boolean {
  if (!isApp()) return false
  return getSystemInfo().platform === 'ios'
}

/** Is the current platform Android (native app only)? */
export function isAndroid(): boolean {
  if (!isApp()) return false
  return getSystemInfo().platform === 'android'
}

/** Get the operating system name for display. */
export function getOSName(): string {
  const info = getSystemInfo()
  const osVer = (info as any).osOriginalVersion
  if (osVer) return osVer
  if (info.platform === 'ios') return 'iOS'
  if (info.platform === 'android') return 'Android'
  if (info.platform === 'mac') return 'macOS'
  if (info.platform === 'windows') return 'Windows'
  return info.platform || 'unknown'
}

/** Get the app version from system info. */
export function getAppVersion(): string {
  const info = getSystemInfo()
  return info.appVersion || (info as any).wxVersion || ''
}

/** Check if the device has a notch / safe area. */
export function hasSafeArea(): boolean {
  const info = getSystemInfo()
  return !!(info as any).safeAreaInsets?.top
}

/** Get safe area insets. */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  const info = getSystemInfo()
  const insets = (info as any).safeAreaInsets
  if (insets) {
    return {
      top: insets.top || 0,
      bottom: insets.bottom || 0,
      left: insets.left || 0,
      right: insets.right || 0,
    }
  }
  return { top: 0, bottom: 0, left: 0, right: 0 }
}
