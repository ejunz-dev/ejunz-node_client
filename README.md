# Ejunz Node Native Mobile Client

iOS/Android 原生客户端，用于连接 `ejunz-node` 并控制 Zigbee2MQTT 设备。

## 技术栈

- iOS：Swift、SwiftUI、URLSession、Keychain
- Android：Kotlin、Jetpack Compose、HttpURLConnection、DataStore/Keystore
- 不使用 Expo、React Native 或 MCP

## iOS

需要 macOS 和 Xcode。创建一个名为 `EjunzNode` 的 SwiftUI App，然后将 `ios/EjunzNode/` 下的 Swift 文件加入 Xcode target。

```text
ios/EjunzNode/EjunzNodeApp.swift
ios/EjunzNode/Models/NodeModels.swift
ios/EjunzNode/Services/NodeAPI.swift
ios/EjunzNode/Services/KeychainStore.swift
ios/EjunzNode/Services/AppModel.swift
ios/EjunzNode/Views/ConnectView.swift
ios/EjunzNode/Views/DashboardView.swift
```

在 Xcode 中选择 iPhone Simulator 或真机运行。

## Android

使用 Android Studio 打开 `android/`，等待 Gradle 同步后运行 `app`。

当前 Android 工程最低支持 Android API 26。需要允许手机访问局域网内的 HTTP 节点地址。

## 后端 API

客户端直接使用 REST API，不使用 MCP：

- `GET /zigbee2mqtt/status`
- `GET /zigbee2mqtt/devices`
- `POST /zigbee2mqtt/device/:deviceId`

当前 MVP 使用 HTTP Basic Auth。生产部署应在 `ejunz-node` 中增加正式的 `/api/mobile/*` token 认证和 HTTPS。

手机和节点在局域网时，地址应填写例如：

```text
http://192.168.1.100:5284
```
