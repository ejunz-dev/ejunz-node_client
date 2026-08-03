export type NodeStatus = 'pending' | 'online' | 'offline' | 'revoked' | string
export type DeviceState = 'ON' | 'OFF' | string

export interface EdgeNode {
  nodeId: string
  status: NodeStatus
  host: string
  port: number
  tools?: unknown[]
  lastSeen: number
  tokenConfigured?: boolean
  requestId?: string
}

export interface EdgeStatus {
  mode: 'edge' | string
  nodes: number
  broker: boolean
  nodeEndpoint?: string
  upstream?: { enabled: boolean; configured: boolean; connected: boolean; endpoint?: string }
}

export interface Device {
  deviceId: string
  friendlyName: string
  model?: string
  vendor?: string
  type?: string
  supportsOnOff?: boolean
  currentState?: DeviceState
  online?: boolean
}

export interface AuthConfig { enabled: boolean; username: string; passwordConfigured: boolean }
export interface UpstreamConfig { enabled: boolean; endpoint: string; connected: boolean }
export interface DeviceStateMessage {
  type: 'device_state'
  topic: string
  payload: unknown
  nodeId?: string
  deviceId?: string
  updatedAt?: number
}

export interface DeviceSnapshotMessage {
  type: 'device_snapshot' | 'snapshot'
  requestId?: string
  generatedAt: number
  nodes: Array<{
    nodeId: string
    deviceStates?: Record<string, unknown>
    deviceStateUpdatedAt?: Record<string, number>
  }>
}
