import Foundation

struct NodeCredentials: Codable {
    let baseURL: String
    let username: String
    let password: String
}

struct ZigbeeStatus: Codable {
    let connected: Bool
    let error: String?
    let devicesCached: Int?
}

struct DevicesResponse: Codable {
    let devices: [NodeDevice]
}

struct NodeDevice: Decodable, Identifiable {
    let deviceId: String
    let friendlyName: String
    let model: String?
    let vendor: String?
    let type: String?
    let lastSeen: String?
    let state: [String: String]
    let currentState: String?
    let online: Bool?
    let supportsOnOff: Bool?

    var id: String { deviceId }

    var powerState: String? {
        currentState ?? state["state"] ?? state["state_l1"]
    }

    private enum CodingKeys: String, CodingKey {
        case deviceId, friendlyName, model, vendor, type, lastSeen, state, currentState, online, supportsOnOff
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        deviceId = try container.decodeIfPresent(String.self, forKey: .deviceId) ?? ""
        friendlyName = try container.decodeIfPresent(String.self, forKey: .friendlyName) ?? deviceId
        model = try container.decodeIfPresent(String.self, forKey: .model)
        vendor = try container.decodeIfPresent(String.self, forKey: .vendor)
        type = try container.decodeIfPresent(String.self, forKey: .type)
        lastSeen = try container.decodeIfPresent(String.self, forKey: .lastSeen)
        currentState = try container.decodeIfPresent(String.self, forKey: .currentState)
        online = try container.decodeIfPresent(Bool.self, forKey: .online)
        supportsOnOff = try container.decodeIfPresent(Bool.self, forKey: .supportsOnOff)
        state = (try? container.decode([String: String].self, forKey: .state)) ?? [:]
    }
}
