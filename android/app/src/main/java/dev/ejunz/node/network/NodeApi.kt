package dev.ejunz.node.network

import android.util.Base64
import dev.ejunz.node.model.NodeCredentials
import dev.ejunz.node.model.NodeDevice
import dev.ejunz.node.model.ZigbeeStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class NodeApi(private val credentials: NodeCredentials) {
    private val baseUrl = credentials.baseUrl.trimEnd('/').let {
        if (it.startsWith("http://") || it.startsWith("https://")) it else "http://$it"
    }
    private val authorization = "Basic " + Base64.encodeToString(
        "${credentials.username}:${credentials.password}".toByteArray(),
        Base64.NO_WRAP,
    )

    suspend fun status(): ZigbeeStatus = withContext(Dispatchers.IO) {
        val json = request("/zigbee2mqtt/status")
        ZigbeeStatus(
            connected = json.optBoolean("connected"),
            error = json.optString("error").ifBlank { null },
            devicesCached = json.optInt("devicesCached").takeIf { json.has("devicesCached") },
        )
    }

    suspend fun devices(): List<NodeDevice> = withContext(Dispatchers.IO) {
        val array = request("/zigbee2mqtt/devices").optJSONArray("devices") ?: return@withContext emptyList()
        List(array.length()) { index ->
            val item = array.getJSONObject(index)
            val state = mutableMapOf<String, String>()
            item.optJSONObject("state")?.keys()?.forEach { key -> state[key] = item.optJSONObject("state")?.optString(key).orEmpty() }
            NodeDevice(
                deviceId = item.optString("deviceId"),
                friendlyName = item.optString("friendlyName", item.optString("deviceId")),
                model = item.optString("model").ifBlank { null },
                vendor = item.optString("vendor").ifBlank { null },
                online = if (item.has("online")) item.optBoolean("online") else null,
                supportsOnOff = if (item.has("supportsOnOff")) item.optBoolean("supportsOnOff") else null,
                currentState = item.optString("currentState").ifBlank { null },
                state = state,
            )
        }
    }

    suspend fun setDeviceState(deviceId: String, state: String) = withContext(Dispatchers.IO) {
        request("/zigbee2mqtt/device/${URLEncoder.encode(deviceId, "UTF-8")}", "POST", JSONObject().put("state", state))
    }

    private fun request(path: String, method: String = "GET", body: JSONObject? = null): JSONObject {
        val connection = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 10_000
            readTimeout = 10_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Authorization", authorization)
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        body?.toString()?.toByteArray()?.let { connection.outputStream.use { stream -> stream.write(it) } }
        val response = (if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream)
            ?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (connection.responseCode !in 200..299) error("Node HTTP ${connection.responseCode}: $response")
        return JSONObject(response.ifBlank { "{}" })
    }
}
