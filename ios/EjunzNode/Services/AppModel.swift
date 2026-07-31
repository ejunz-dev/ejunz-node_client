import Foundation
import Observation

@MainActor
@Observable
final class AppModel {
    var credentials: NodeCredentials?
    var status: ZigbeeStatus?
    var devices: [NodeDevice] = []
    var isLoading = false
    var errorMessage: String?

    private let keychain = KeychainStore()
    private var api: NodeAPI?

    init() {
        credentials = keychain.load()
        if let credentials {
            api = NodeAPI(credentials: credentials)
            Task { await refresh() }
        }
    }

    var isConnected: Bool { credentials != nil }

    func connect(baseURL: String, username: String, password: String) async {
        let next = NodeCredentials(baseURL: baseURL, username: username, password: password)
        let nextAPI = NodeAPI(credentials: next)
        isLoading = true
        errorMessage = nil
        do {
            _ = try await nextAPI.status()
            credentials = next
            api = nextAPI
            try keychain.save(next)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func refresh() async {
        guard let api else { return }
        isLoading = true
        errorMessage = nil
        do {
            let nextStatus = try await api.status()
            let nextDevices = try await api.devices()
            status = nextStatus
            devices = nextDevices.devices
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func toggle(_ device: NodeDevice) async {
        guard let api, let current = device.powerState else { return }
        let next = current == "ON" ? "OFF" : "ON"
        do {
            try await api.setDeviceState(deviceId: device.deviceId, state: next)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func disconnect() {
        keychain.clear()
        credentials = nil
        api = nil
        status = nil
        devices = []
        errorMessage = nil
    }
}
