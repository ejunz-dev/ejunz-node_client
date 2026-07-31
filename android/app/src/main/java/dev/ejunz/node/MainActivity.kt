package dev.ejunz.node

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.ejunz.node.model.NodeCredentials
import dev.ejunz.node.model.NodeDevice
import dev.ejunz.node.model.ZigbeeStatus
import dev.ejunz.node.network.NodeApi
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { EjunzNodeApp() }
    }
}

@Composable
private fun EjunzNodeApp() {
    var connected by remember { mutableStateOf(false) }
    var credentials by remember { mutableStateOf<NodeCredentials?>(null) }
    var status by remember { mutableStateOf<ZigbeeStatus?>(null) }
    var devices by remember { mutableStateOf<List<NodeDevice>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    MaterialTheme {
        if (!connected) {
            ConnectScreen(loading = loading, error = error) { next ->
                scope.launch {
                    loading = true
                    error = null
                    try {
                        val api = NodeApi(next)
                        status = api.status()
                        devices = api.devices()
                        credentials = next
                        connected = true
                    } catch (e: Exception) { error = e.message ?: "连接失败" }
                    loading = false
                }
            }
        } else {
            DashboardScreen(
                status = status,
                devices = devices,
                loading = loading,
                error = error,
                onRefresh = {
                    credentials?.let { next ->
                        scope.launch {
                            loading = true
                            try { status = NodeApi(next).status(); devices = NodeApi(next).devices() }
                            catch (e: Exception) { error = e.message ?: "刷新失败" }
                            loading = false
                        }
                    }
                },
                onToggle = { device, state ->
                    credentials?.let { next ->
                        scope.launch {
                            try { NodeApi(next).setDeviceState(device.deviceId, state); devices = NodeApi(next).devices() }
                            catch (e: Exception) { error = e.message ?: "控制失败" }
                        }
                    }
                },
                onDisconnect = { connected = false; credentials = null; devices = emptyList() },
            )
        }
    }
}

@Composable
private fun ConnectScreen(loading: Boolean, error: String?, onConnect: (NodeCredentials) -> Unit) {
    var url by remember { mutableStateOf("http://192.168.1.100:5284") }
    var username by remember { mutableStateOf("admin") }
    var password by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Ejunz Node", style = MaterialTheme.typography.headlineLarge)
        Text("连接家庭控制节点", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(vertical = 12.dp))
        OutlinedTextField(url, { url = it }, label = { Text("节点地址") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(username, { username = it }, label = { Text("用户名") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        OutlinedTextField(password, { password = it }, label = { Text("密码") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
        Button(onClick = { onConnect(NodeCredentials(url, username, password)) }, enabled = !loading && password.isNotEmpty(), modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
            if (loading) CircularProgressIndicator() else Text("连接节点")
        }
    }
}

@Composable
private fun DashboardScreen(status: ZigbeeStatus?, devices: List<NodeDevice>, loading: Boolean, error: String?, onRefresh: () -> Unit, onToggle: (NodeDevice, String) -> Unit, onDisconnect: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text("Ejunz Node", style = MaterialTheme.typography.headlineMedium); Text("设备 ${devices.size} · Zigbee ${if (status?.connected == true) "已连接" else "未连接"}") }
            Button(onClick = onDisconnect) { Text("断开") }
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(vertical = 8.dp)) }
        Button(onClick = onRefresh, enabled = !loading, modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)) { Text(if (loading) "刷新中…" else "刷新设备") }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(devices) { device ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) { Text(device.friendlyName, style = MaterialTheme.typography.titleMedium); Text(listOfNotNull(device.vendor, device.model).joinToString(" · ") + " · " + if (device.online == false) "离线" else "在线") }
                        if (device.supportsOnOff != false) Switch(checked = device.powerState == "ON", onCheckedChange = { onToggle(device, if (it) "ON" else "OFF") }, enabled = device.online != false)
                    }
                }
            }
        }
    }
}
