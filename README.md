# Ejunz Edge Client

Multi-platform client for connecting to an `ejunz-node` **Edge** server, managing remote nodes, and controlling Zigbee devices.

Built with **uni-app 3.x** (Vue 3 + TypeScript + Pinia) — one codebase for **all platforms**.

## Supported Platforms

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

## Quick Start

```bash
# Install dependencies
yarn install

# H5 development
yarn dev:h5

# H5 production build
yarn build:h5

# Type check
yarn typecheck
```

## Development

### H5 (Browser)

```bash
yarn dev:h5
# Open http://localhost:5175
```

The Vite dev server proxies `/api/edge` requests to the Edge server (configurable via `EDGE_PROXY_TARGET` env var).

### Native App (iOS/Android)

```bash
# Build for all app platforms
yarn build:app

# iOS-specific build
yarn build:app-ios

# Android-specific build
yarn build:app-android
```

### Mini Programs

```bash
# WeChat Mini Program
yarn dev:mp-weixin
# Open dist/build/mp-weixin in WeChat DevTools

# Alipay Mini Program
yarn dev:mp-alipay

# Baidu Mini Program
yarn dev:mp-baidu

# Douyin Mini Program
yarn dev:mp-toutiao

# QQ Mini Program
yarn dev:mp-qq
```

### Quick App

```bash
yarn dev:quickapp
yarn build:quickapp
```

## Project Structure

```
uniapp/               ← uni-app source (all platforms)
  src/
    pages/            ← Page components (login, dashboard, nodes, devices, settings)
    components/       ← Reusable UI components
    services/         ← API client, WebSocket, storage
    stores/           ← Pinia state management
    utils/            ← URL helpers, status formatting, platform detection
    types/            ← TypeScript type definitions
    manifest.json     ← Platform configuration
    pages.json        ← Page routing and tab bar
  vite.config.ts      ← Vite + uni-app plugin config
  package.json        ← uni-app workspace dependencies
  README.md           ← Detailed uni-app documentation

ui/                   ← Legacy React/Mantine UI (deprecated, replaced by uniapp/)
desktop/              ← Legacy Neutralino.js desktop app (deprecated)
ios/                  ← Legacy Capacitor iOS project (deprecated)
android/              ← Legacy Capacitor Android project (deprecated)
capacitor.config.json ← Legacy Capacitor config (deprecated)
```

> **Note:** The `ui/`, `desktop/`, `ios/`, and `android/` directories are legacy artifacts from the previous React + Capacitor stack. All new development uses the `uniapp/` directory.

## Edge API

The client manages the Edge server through its REST API:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/edge/status` | Edge status (node count, broker, upstream) |
| GET | `/api/edge/nodes` | List all registered nodes |
| GET | `/api/edge/nodes/:nodeId/devices` | Zigbee devices behind a node |
| POST | `/api/edge/nodes/:nodeId/devices/control` | Control a device (ON/OFF/TOGGLE) |
| POST | `/api/edge/nodes/:nodeId/authorize` | Authorize a pending node |
| POST | `/api/edge/nodes/:nodeId/revoke` | Revoke a node |
| GET/POST | `/api/edge/auth-config` | Authentication configuration |
| GET/POST | `/api/edge/upstream` | Upstream connection configuration |

## Connection Addresses

- LAN Edge: `http://192.168.1.100:5283`
- Remote (via FRP): `http://47.86.164.129:10031`

## Platform-specific Code

Use uni-app's conditional compilation (`#ifdef` / `#ifndef`) in `.vue` files, or the runtime platform utilities in `uniapp/src/utils/platform.ts`:

```typescript
import { isApp, isMiniProgram, isH5 } from '@/utils/platform'

if (isApp()) {
  // Native app-specific logic
} else if (isMiniProgram()) {
  // Mini-program specific logic
}
```

See [`uniapp/README.md`](uniapp/README.md) for detailed implementation documentation.
