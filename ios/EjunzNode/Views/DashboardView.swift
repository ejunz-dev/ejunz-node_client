import SwiftUI

struct DashboardView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Label("Zigbee2MQTT", systemImage: "dot.radiowaves.left.and.right")
                        Spacer()
                        Text(model.status?.connected == true ? "已连接" : "未连接")
                            .foregroundStyle(model.status?.connected == true ? .green : .red)
                    }
                    HStack {
                        Label("设备", systemImage: "lightbulb.2")
                        Spacer()
                        Text("\(model.devices.count)")
                    }
                }

                Section("设备") {
                    ForEach(model.devices) { device in
                        DeviceRow(device: device) {
                            Task { await model.toggle(device) }
                        }
                    }
                }

                if let error = model.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .refreshable { await model.refresh() }
            .overlay {
                if model.isLoading && model.devices.isEmpty { ProgressView() }
                else if model.devices.isEmpty { ContentUnavailableView("没有设备", systemImage: "lightbulb.slash") }
            }
            .navigationTitle("Ejunz Node")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("断开") { model.disconnect() }
                }
            }
        }
    }
}

private struct DeviceRow: View {
    let device: NodeDevice
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: device.powerState == "ON" ? "lightbulb.fill" : "lightbulb")
                .foregroundStyle(device.powerState == "ON" ? .yellow : .secondary)
                .frame(width: 26)
            VStack(alignment: .leading) {
                Text(device.friendlyName)
                    .font(.headline)
                Text([device.vendor, device.model].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if device.supportsOnOff != false {
                Toggle("", isOn: Binding(
                    get: { device.powerState == "ON" },
                    set: { _ in onToggle() }
                ))
                .labelsHidden()
                .disabled(device.online == false)
            }
        }
        .padding(.vertical, 4)
    }
}
