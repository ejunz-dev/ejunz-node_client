package dev.ejunz.node.model

data class NodeCredentials(val baseUrl: String, val username: String, val password: String)
data class ZigbeeStatus(val connected: Boolean, val error: String? = null, val devicesCached: Int? = null)
data class NodeDevice(
    val deviceId: String,
    val friendlyName: String,
    val model: String? = null,
    val vendor: String? = null,
    val online: Boolean? = null,
    val supportsOnOff: Boolean? = null,
    val currentState: String? = null,
    val state: Map<String, String> = emptyMap(),
) {
    val powerState: String? get() = currentState ?: state["state"] ?: state["state_l1"]
}
