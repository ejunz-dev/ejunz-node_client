# Ejunz Edge Client

iOS/Android client for connecting to an `ejunz-node` **Edge** server, managing remote nodes, and controlling Zigbee devices.

Built with **CapacitorJS** + **Vite** + **React/TypeScript** — one codebase for both iOS and Android.

## Tech Stack

- **Frontend**: React 18 + TypeScript + React Router
- **Build**: Vite 6 (`@vitejs/plugin-react`, HMR)
- **Shell**: CapacitorJS 7 (iOS: WKWebView / Android: WebView)
- **API**: Edge REST API (`/api/edge/*`, HTTP Basic Auth)
- **Storage**: `localStorage` (connection credentials)

## Quick Start

```bash
# Install dependencies
yarn install

# Build the frontend
yarn build

# Sync to native platforms
yarn sync

# Open native IDE
yarn open ios      # macOS + Xcode
yarn open android   # Android Studio
```

## Development (Hot Reload)

```bash
# Start Vite dev server (port 3000, HMR, API proxy to :5283)
yarn dev

# Open http://localhost:3000 in your browser
# Changes to ui/app/ are hot-reloaded automatically
```

Live reload on a native device:

```bash
# iOS simulator
yarn cap:dev

# Android emulator / device
yarn cap:dev:android
```

## Project Structure

```
ui/                   ← React/TSX source (development directory)
  app/
    index.tsx         ← Entry point
    App.tsx           ← Router + layout
    api.ts            ← Edge API wrapper (/api/edge/*)
    components/
      Header.tsx      ← Navigation bar
    pages/
      Connect.tsx     ← Connect to Edge server
      Dashboard.tsx   ← Overview (node stats, upstream status)
      Nodes.tsx       ← Node management (authorize/revoke)
      Devices.tsx     ← Device control (select node → toggle devices)
  vite.config.ts      ← Vite config (proxy, output dir)
  index.html          ← HTML entry
  package.json        ← UI workspace dependencies
  tsconfig.json
www/                  ← Build output (Capacitor webDir)
  index.html
  assets/
ios/                  ← Xcode project (Capacitor-generated)
android/              ← Android Studio project (Capacitor-generated)
capacitor.config.json ← Capacitor configuration
package.json          ← Root workspace config
```

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

The MVP uses HTTP Basic Auth. Production deployments should use HTTPS.

## Connection Addresses

- LAN Edge: `http://192.168.1.100:5283`
- Remote (via FRP): `http://47.86.164.129:10031`
