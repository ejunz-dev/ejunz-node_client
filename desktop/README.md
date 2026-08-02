# Ejunz Edge Desktop

Desktop client built with Neutralino.js + Vue 3 + TypeScript + Naive UI. It acts as a remote management panel for an ejunz-node Edge server: node authorize/revoke, device control, and auth/upstream configuration.

## Development

```bash
# from the repo root
yarn install

# browser-only debugging (vite :5174, /api/edge proxied to $EDGE_API, default http://localhost:5283)
yarn dev:desktop

# Neutralino window debugging (fetch the binaries first, once)
yarn workspace @ejunz/node-client-desktop update
yarn neu:dev
```

## Build

```bash
yarn build:desktop   # builds the frontend, then `neu build --release`
```

Artifacts land in `desktop/dist/ejunz-edge-desktop/`.

## Release

Releases are built by CI (`.github/workflows/release.yml`), following the
xcpc-tools model: push a tag and the workflow builds the frontend, runs
`neu update && neu build --release`, packages each platform binary with
`resources.neu` (tar.gz for Linux/macOS, zip for Windows), and publishes a
GitHub Release.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Unlike xcpc-tools' machine-setup (Linux-only because it shells out to
`systemctl`/`hostnamectl`), this app only talks REST/WS to the Edge server,
so all platforms are published.

## Notes

- The API layer is ported from the mobile client's `ui/app/api.ts`. Auth uses a `?token=` query parameter, so plain `fetch` works inside the webview. CORS is an allowlist on the Edge server (`cors` key in `config.edge.yaml`); it must include the app origin — `localhost:5174` (vite dev) and `localhost:5175` (Neutralino window, fixed via `port` in `neutralino.config.json`).
- Real-time device state sync uses the `/api/edge/ws` WebSocket push channel (`src/ws.ts`, `?token=` auth, 3s reconnect). There is intentionally no polling/SSE fallback.
- Credentials are persisted via the Neutralino `storage.*` native API, falling back to `localStorage` when running in a plain browser during development.
