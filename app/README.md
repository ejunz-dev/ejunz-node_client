# Ejunz Edge uni-app client

Standalone Vue 3 + TypeScript + Pinia client for the Ejunz Edge REST and `edge-ws/v1` APIs. Built with **uni-app 3.x**, targeting **all platforms** from a single codebase:

| Platform | Target | Status |
|----------|--------|--------|
| H5 (Web) | Browser / PWA | ✅ |
| iOS | Native App | ✅ |
| Android | Native App | ✅ |
| mp-weixin | WeChat Mini Program | ✅ |
| mp-alipay | Alipay Mini Program | ✅ |
| mp-baidu | Baidu Smart Mini Program | ✅ |
| mp-toutiao | Douyin/Toutiao Mini Program | ✅ |
| mp-qq | QQ Mini Program | ✅ |
| quickapp | Quick App (快应用) | ✅ |
| Desktop (Electron) | macOS / Windows / Linux | ✅ |

## Commands

Run from `local/ejunz/ejunz-node_client`:

```bash
yarn install
yarn dev:h5            # H5 development
yarn build:h5          # H5 production build
yarn typecheck         # vue-tsc

# App (iOS/Android)
yarn dev:app           # App development (all)
yarn build:app         # App production build (all)
yarn dev:app-ios       # iOS-specific development
yarn build:app-ios     # iOS-specific build
yarn dev:app-android   # Android-specific development
yarn build:app-android # Android-specific build

# Mini Programs
yarn dev:mp-weixin     # WeChat Mini Program development
yarn build:mp-weixin   # WeChat Mini Program build
yarn dev:mp-alipay     # Alipay Mini Program development
yarn build:mp-alipay   # Alipay Mini Program build
yarn dev:mp-baidu      # Baidu Mini Program development
yarn build:mp-baidu    # Baidu Mini Program build
yarn dev:mp-toutiao    # Douyin Mini Program development
yarn build:mp-toutiao  # Douyin Mini Program build
yarn dev:mp-qq         # QQ Mini Program development
yarn build:mp-qq       # QQ Mini Program build

# Quick App
yarn dev:quickapp      # Quick App development
yarn build:quickapp    # Quick App build

# Desktop (Electron)
yarn dev:desktop       # Development (HMR via Vite + Electron)
yarn build:desktop     # Production installers
```

## Structure

- `src/pages/`: login, dashboard, nodes, devices, and settings pages.
- `src/components/`: reusable page shell, headers, status badges, cards, empty states, and device controls.
- `src/services/api.ts`: `uni.request` REST wrapper, credential setup, and Edge API convenience methods.
- `src/services/edge-ws.ts`: global `uni.connectSocket` singleton with protocol v1 requests, request IDs/timeouts, lifecycle pause/resume, and bounded reconnect backoff.
- `src/stores/`: Pinia session, Edge data, and WebSocket status stores.
- `src/utils/`: URL normalization, node/status presentation helpers, and platform detection.

## Platform-specific code

Use `uni.getSystemInfoSync().platform` or the `#ifdef` preprocessor in `.vue` files:

```vue
<!-- #ifdef APP-PLUS -->
<view>Only shown in native App (iOS/Android)</view>
<!-- #endif -->
<!-- #ifdef H5 -->
<view>Only shown in browser</view>
<!-- #endif -->
<!-- #ifdef MP-WEIXIN -->
<view>Only shown in WeChat Mini Program</view>
<!-- #endif -->
```

> **Note:** Desktop (Electron) uses runtime detection, not build-time `#ifdef`. Use `isDesktop()` from `@/utils/platform` instead.

See the [uni-app conditional compilation docs](https://uniapp.dcloud.net.cn/tutorial/platform.html) for all available platform identifiers.

## Development

### H5 (Browser)

```bash
yarn dev:h5
# Open http://localhost:5175
```

The Vite dev server proxies `/api/edge` requests to the Edge server (configurable via `EDGE_PROXY_TARGET` env var).

### Native App (iOS/Android)

```bash
# Build the app wgt package
yarn build:app

# Or use HBuilderX to run on device/emulator
# Open the app/ directory in HBuilderX → Run → Run on device
```

### WeChat Mini Program

```bash
yarn dev:mp-weixin
# Open the dist/build/mp-weixin directory in WeChat DevTools
```

### Desktop (Electron)

```bash
# Development (HMR via Vite dev server + Electron dev window)
yarn dev:desktop

# Production build (native installers)
yarn build:desktop
```

The desktop app uses **Electron** to wrap the uni-app H5 build in a native OS webview.

- Window config and preload bridge are in `electron/main.cjs` and `electron/preload.cjs`
- Persistent credentials use the uni-app H5 storage adapter
- Builds produce `.AppImage`, `.deb`, `.rpm`, `.dmg`, `.exe`, and `.msi` installers

Runtime detection (Electron is detected at runtime, not build-time):

```typescript
import { isDesktop, isDesktopOS } from '@/utils/platform'

if (isDesktop()) {
  // Running inside Electron desktop window
} else if (isDesktopOS()) {
  // Running on a desktop OS (macOS/Windows/Linux) but not in Electron
}
```

## Credentials

The server password is sent as the existing `token` query parameter. Credentials are stored with `uni.setStorageSync`; use HTTPS/WSS in production.
