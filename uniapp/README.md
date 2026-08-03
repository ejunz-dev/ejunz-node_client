# Ejunz Edge uni-app client

Standalone Vue 3 + TypeScript + Pinia client for the Ejunz Edge REST and `edge-ws/v1` APIs. It has no React, Capacitor, or Neutralino runtime dependency and is intended for H5 and mp-weixin/native uni-app targets.

## Commands

Run from `local/ejunz/ejunz-node_client`:

```bash
yarn install
yarn dev              # H5 development
yarn build            # H5 production build
yarn typecheck        # vue-tsc

yarn dev:app          # uni-app app development entry
yarn build:app        # uni-app app build entry
yarn dev:mp-weixin    # WeChat Mini Program development entry
yarn build:mp-weixin  # WeChat Mini Program build entry
```

For WeChat Mini Program builds, use the same source with the uni-app CLI or HBuilderX and select `mp-weixin`; the platform entry is provided by `src/manifest.json` and `src/pages.json`.

## Structure

- `src/pages/`: login, dashboard, nodes, devices, and settings pages.
- `src/components/`: reusable page shell, headers, status badges, cards, empty states, and device controls.
- `src/services/api.ts`: `uni.request` REST wrapper, credential setup, and Edge API convenience methods.
- `src/services/edge-ws.ts`: global `uni.connectSocket` singleton with protocol v1 requests, request IDs/timeouts, lifecycle pause/resume, and bounded reconnect backoff.
- `src/stores/`: Pinia session, Edge data, and WebSocket status stores.
- `src/utils/`: URL normalization and node/status presentation helpers.

The server password is sent as the existing `token` query parameter. Credentials are stored with `uni.setStorageSync`; use HTTPS/WSS in production.
