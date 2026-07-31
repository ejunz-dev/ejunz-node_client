# Ejunz Node Mobile Client

iOS/Android mobile dashboard for connecting to an `ejunz-node` instance and controlling Zigbee2MQTT devices.

## Stack

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo SecureStore for saved credentials

## Run locally

```bash
npm install
npm start
```

Then open the project with Expo Go, an Android emulator, or an iOS simulator.

```bash
npm run android
npm run ios
```

The phone and `ejunz-node` must be reachable on the same LAN for a local HTTP URL such as `http://192.168.1.100:5284`.

## Current API contract

The first MVP talks to the existing REST endpoints (not MCP):

- `GET /zigbee2mqtt/status`
- `GET /zigbee2mqtt/devices`
- `POST /zigbee2mqtt/device/:deviceId`

The app sends HTTP Basic Authentication using the credentials entered on the connection screen. Production deployments should put `ejunz-node` behind HTTPS and enforce route-level authentication.

## Planned next steps

- Replace Basic Auth with `/api/mobile/auth/login` and refresh tokens.
- Add a dedicated `/api/mobile/*` API with stable normalized device models.
- Add a separate mobile WebSocket for real-time state updates.
- Add QR pairing and push notifications.
