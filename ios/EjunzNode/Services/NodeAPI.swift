import Foundation

struct NodeAPI {
    let credentials: NodeCredentials

    private var baseURL: String {
        let value = credentials.baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.hasSuffix("/") { return String(value.dropLast()) }
        if value.hasPrefix("http://") || value.hasPrefix("https://") { return value }
        return "http://\(value)"
    }

    private var authorization: String {
        let raw = "\(credentials.username):\(credentials.password)"
        let encoded = Data(raw.utf8).base64EncodedString()
        return "Basic \(encoded)"
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else { throw NodeAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(authorization, forHTTPHeaderField: "Authorization")
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NodeAPIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw NodeAPIError.http(statusCode: http.statusCode, body: String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func status() async throws -> ZigbeeStatus {
        try await request("/zigbee2mqtt/status")
    }

    func devices() async throws -> DevicesResponse {
        try await request("/zigbee2mqtt/devices")
    }

    func setDeviceState(deviceId: String, state: String) async throws {
        guard let data = try? JSONEncoder().encode(["state": state]) else { throw NodeAPIError.invalidBody }
        let _: EmptyResponse = try await request("/zigbee2mqtt/device/\(deviceId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? deviceId)", method: "POST", body: data)
    }
}

struct EmptyResponse: Decodable {}

enum NodeAPIError: LocalizedError {
    case invalidURL
    case invalidBody
    case invalidResponse
    case http(statusCode: Int, body: String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "节点地址无效"
        case .invalidBody: return "请求数据无效"
        case .invalidResponse: return "节点返回了无效响应"
        case let .http(statusCode, body): return body.isEmpty ? "节点返回 HTTP \(statusCode)" : body
        }
    }
}
