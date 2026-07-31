import SwiftUI

@main
struct EjunzNodeApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if model.isConnected { DashboardView() }
                else { ConnectView() }
            }
            .environment(model)
        }
    }
}
