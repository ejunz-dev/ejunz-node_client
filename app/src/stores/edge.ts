import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authorizeNode, controlDevice, fetchNodeDevices, fetchNodes, fetchStatus, revokeNode } from '@/services/api'
import type { Device, EdgeNode, EdgeStatus } from '@/types/edge'

export const useEdgeStore = defineStore('edge', () => {
  const status = ref<EdgeStatus | null>(null); const nodes = ref<EdgeNode[]>([]); const devices = ref<Device[]>([])
  const selectedNodeId = ref(''); const loading = ref(false); const devicesLoading = ref(false); const error = ref('')
  async function refresh(): Promise<void> { loading.value = true; error.value = ''; try { const [nextStatus, nextNodes] = await Promise.all([fetchStatus(), fetchNodes()]); status.value = nextStatus; nodes.value = nextNodes.nodes || [] } catch (cause) { error.value = cause instanceof Error ? cause.message : '加载失败'; throw cause } finally { loading.value = false } }
  async function selectNode(nodeId: string): Promise<void> { selectedNodeId.value = nodeId; await refreshDevices() }
  async function refreshDevices(): Promise<void> { if (!selectedNodeId.value) { devices.value = []; return }; devicesLoading.value = true; try { devices.value = (await fetchNodeDevices(selectedNodeId.value)).devices || [] } finally { devicesLoading.value = false } }
  async function toggleDevice(device: Device): Promise<void> { if (!selectedNodeId.value) return; const state = device.currentState === 'ON' ? 'OFF' : 'ON'; await controlDevice(selectedNodeId.value, device.deviceId, state); device.currentState = state }
  async function authorize(nodeId: string): Promise<void> { await authorizeNode(nodeId); await refresh() }
  async function revoke(nodeId: string): Promise<void> { await revokeNode(nodeId); await refresh() }
  function applyDeviceState(topic: string, payload: unknown, nodeId?: string, deviceId?: string): void {
    const parts = topic.split('/')
    const resolvedNodeId = nodeId || (parts[0] === 'node' ? parts[1] : '')
    const resolvedDeviceId = deviceId || (parts[0] === 'node' && parts[2] === 'devices' ? parts[3] : '')
    if (!resolvedDeviceId) return
    if (selectedNodeId.value && resolvedNodeId && selectedNodeId.value !== resolvedNodeId) return
    let value: Record<string, unknown> = {}
    if (typeof payload === 'string') { try { value = JSON.parse(payload) } catch { return } } else if (payload && typeof payload === 'object') value = payload as Record<string, unknown>
    const device = devices.value.find((item) => item.deviceId === resolvedDeviceId)
    if (!device) return
    const nextState = value.state ?? value.currentState
    if (nextState === 'ON' || nextState === 'OFF' || typeof nextState === 'string') device.currentState = String(nextState)
    if (typeof value.online === 'boolean') device.online = value.online
    if (typeof value.friendlyName === 'string') device.friendlyName = value.friendlyName
    if (typeof value.model === 'string') device.model = value.model
  }
  return { status, nodes, devices, selectedNodeId, loading, devicesLoading, error, refresh, selectNode, refreshDevices, toggleDevice, authorize, revoke, applyDeviceState }
})
