# iOS native client

This directory contains the SwiftUI source for the Ejunz Node client.

On macOS:

1. Open Xcode and create an **iOS App** project named `EjunzNode` using SwiftUI.
2. Set the bundle identifier to `dev.ejunz.node`.
3. Add all Swift files under `ios/EjunzNode/` to the app target.
4. Build and run on an iOS simulator or a connected iPhone.

The app uses `URLSession` for REST calls and Keychain for saved credentials.
