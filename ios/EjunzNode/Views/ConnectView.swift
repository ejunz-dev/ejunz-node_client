import SwiftUI
import UIKit

struct ConnectView: View {
    @Environment(AppModel.self) private var model
    @State private var baseURL = "http://192.168.1.100:5284"
    @State private var username = "admin"
    @State private var password = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Image(systemName: "house.fill")
                    .font(.system(size: 42))
                    .foregroundStyle(.blue)
                    .padding(.top, 50)

                Text("连接 Ejunz Node")
                    .font(.largeTitle.bold())
                Text("输入节点地址和登录信息，开始管理 Zigbee2MQTT 设备。")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Group {
                    field("节点地址", text: $baseURL, keyboard: .URL)
                    field("用户名", text: $username, keyboard: .default)
                    SecureField("密码", text: $password)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal)

                if let error = model.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.horizontal)
                }

                Button {
                    Task { await model.connect(baseURL: baseURL, username: username, password: password) }
                } label: {
                    Group {
                        if model.isLoading { ProgressView().tint(.white) }
                        else { Text("连接节点").fontWeight(.semibold) }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.isLoading || baseURL.isEmpty || username.isEmpty || password.isEmpty)
                .padding(.horizontal)
            }
            .padding(.bottom, 30)
        }
    }

    private func field(_ title: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        TextField(title, text: text)
            .textInputAutocapitalization(.never)
            .keyboardType(keyboard)
            .textFieldStyle(.roundedBorder)
    }
}
