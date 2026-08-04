import { reactive } from 'vue'
import { getEdgeWsUrl } from './api'
import { isMiniProgram, isApp } from '@/utils/platform'
import type { DeviceSnapshotMessage, DeviceStateMessage } from '@/types/edge'

export type EdgeWsStatus = 'connecting' | 'connected' | 'disconnected'
export type DeviceStateListener = (message: DeviceStateMessage) => void
export type EdgeWsMessage = Record<string, unknown> & { protocol?: string; type?: string; requestId?: string }
export type EdgeWsSubscription = { nodeIds?: string[]; deviceIds?: string[]; topics?: string[] }

type PendingRequest = {
  resolve: (value: EdgeWsMessage) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const EDGE_WS_PROTOCOL = 'edge-ws/v1'

// Platform-specific timeouts and delays
// Mini-programs often have stricter WebSocket timeout limits
const CONNECT_TIMEOUT = isMiniProgram() ? 8000 : 10000
const REQUEST_TIMEOUT = isMiniProgram() ? 8000 : 10000
// Native apps may have more stable connections, use longer initial delay
const INITIAL_RECONNECT_DELAY = isApp() ? 5000 : 3000
const MAX_RECONNECT_DELAY = 30000

export const edgeWsState = reactive({
  status: 'disconnected' as EdgeWsStatus,
  lastError: '',
  reconnectAttempt: 0,
  lastMessageAt: 0,
})

class EdgeWsSingleton {
  private socket: UniApp.SocketTask | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<DeviceStateListener>()
  private snapshotListeners = new Set<(message: DeviceSnapshotMessage) => void>()
  private pending = new Map<string, PendingRequest>()
  private disposed = false
  private delay = INITIAL_RECONNECT_DELAY
  private sequence = 0
  private subscription: EdgeWsSubscription = {}

  subscribe(listener: DeviceStateListener, options: EdgeWsSubscription = {}): () => void {
    this.listeners.add(listener)
    this.subscription = options
    this.disposed = false
    if (!this.socket && !this.reconnectTimer) this.connect()
    return () => {
      this.listeners.delete(listener)
      if (!this.listeners.size) this.stop()
    }
  }

  setSubscription(options: EdgeWsSubscription): void {
    this.subscription = options
    if (this.socket) void this.request('subscribe', options).catch(() => undefined)
  }

  subscribeSnapshots(listener: (message: DeviceSnapshotMessage) => void): () => void {
    this.snapshotListeners.add(listener)
    return () => this.snapshotListeners.delete(listener)
  }

  connect(): void {
    if (this.socket || this.reconnectTimer || !this.listeners.size) return
    this.disposed = false
    edgeWsState.status = 'connecting'
    let opened = false
    try {
      const socket = uni.connectSocket({ url: getEdgeWsUrl(), timeout: CONNECT_TIMEOUT, complete: () => undefined })
      this.socket = socket
      this.connectTimer = setTimeout(() => {
        if (!opened && this.socket === socket) {
          edgeWsState.lastError = 'WebSocket 连接超时'
          socket.close({ code: 4000, reason: 'connect timeout' })
          this.scheduleReconnect()
        }
      }, CONNECT_TIMEOUT)
      socket.onOpen(() => {
        if (this.socket !== socket) return
        opened = true
        this.clearConnectTimer()
        this.delay = INITIAL_RECONNECT_DELAY
        edgeWsState.reconnectAttempt = 0
        edgeWsState.lastError = ''
        edgeWsState.status = 'connected'
        void this.request('hello', { clientId: 'ejunz-uniapp' }).then(() => this.request('subscribe', this.subscription)).then(() => this.request('snapshot_request', this.subscription)).catch((error: Error) => { edgeWsState.lastError = error.message })
      })
      socket.onMessage((event) => this.handleMessage(event.data))
      socket.onError((error) => {
        edgeWsState.lastError = error.errMsg || 'WebSocket 连接错误'
        if (this.socket === socket) socket.close({ code: 4001, reason: 'socket error' })
      })
      socket.onClose(() => {
        if (this.socket !== socket) return
        this.clearConnectTimer()
        this.socket = null
        edgeWsState.status = 'disconnected'
        if (!this.disposed && this.listeners.size) this.scheduleReconnect()
      })
    } catch (error) {
      edgeWsState.lastError = error instanceof Error ? error.message : 'WebSocket 创建失败'
      this.socket = null
      this.scheduleReconnect()
    }
  }

  request(type: 'hello' | 'subscribe' | 'snapshot_request' | 'control' | 'ping', payload: EdgeWsSubscription & Record<string, unknown> = {}, timeout = REQUEST_TIMEOUT): Promise<EdgeWsMessage> {
    const requestId = `uni-${Date.now().toString(36)}-${(++this.sequence).toString(36)}`
    const message = { protocol: EDGE_WS_PROTOCOL, type, requestId, ...payload }
    return new Promise<EdgeWsMessage>((resolve, reject) => {
      if (!this.socket || edgeWsState.status !== 'connected') {
        reject(new Error('WebSocket 未连接'))
        return
      }
      const timer = setTimeout(() => {
        this.pending.delete(requestId)
        reject(new Error(`${type} 请求超时`))
      }, timeout)
      this.pending.set(requestId, { resolve, reject, timer })
      try {
        this.socket.send({ data: JSON.stringify(message), fail: (error) => {
          clearTimeout(timer)
          this.pending.delete(requestId)
          reject(new Error(error.errMsg || `${type} 请求发送失败`))
        } })
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(requestId)
        reject(error instanceof Error ? error : new Error('WebSocket 请求发送失败'))
      }
    })
  }

  control(nodeId: string, deviceId: string, state: 'ON' | 'OFF' | 'TOGGLE', timeout = REQUEST_TIMEOUT): Promise<EdgeWsMessage> {
    return this.request('control', { nodeId, deviceId, state }, timeout)
  }

  ping(timeout = REQUEST_TIMEOUT): Promise<EdgeWsMessage> {
    return this.request('ping', { timestamp: Date.now() }, timeout)
  }

  private handleMessage(data: string | ArrayBuffer): void {
    let message: EdgeWsMessage
    try {
      const text = typeof data === 'string' ? data : this.decode(data)
      message = JSON.parse(text) as EdgeWsMessage
    } catch { return }
    edgeWsState.lastMessageAt = Date.now()
    const requestId = typeof message.requestId === 'string' ? message.requestId : undefined
    if (requestId && this.pending.has(requestId)) {
      const pending = this.pending.get(requestId)!
      this.pending.delete(requestId)
      clearTimeout(pending.timer)
      if (message.type === 'error' || (message.type === 'control_result' && message.ok === false) || (message.type === 'control_ack' && message.ok === false)) pending.reject(new Error(String(message.message || message.error || 'Edge WebSocket 请求失败')))
      else pending.resolve(message)
    }
    if (message.type === 'ping' && this.socket) void this.request('ping', { timestamp: Date.now() }).catch(() => undefined)
    if (message.type === 'device_state') this.listeners.forEach((listener) => listener(message as unknown as DeviceStateMessage))
    if (message.type === 'device_snapshot' || message.type === 'snapshot') {
      this.snapshotListeners.forEach((listener) => listener(message as unknown as DeviceSnapshotMessage))
    }
  }

  private decode(data: ArrayBuffer): string {
    try { return new TextDecoder().decode(data) } catch { return String(data) }
  }

  private scheduleReconnect(): void {
    if (this.disposed || !this.listeners.size || this.reconnectTimer) return
    edgeWsState.reconnectAttempt += 1
    const wait = this.delay
    this.delay = Math.min(this.delay * 2, MAX_RECONNECT_DELAY)
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connect() }, wait)
  }

  private clearConnectTimer(): void { if (this.connectTimer) clearTimeout(this.connectTimer); this.connectTimer = null }

  stop(): void {
    this.disposed = true
    this.clearConnectTimer()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    this.pending.forEach(({ reject, timer }) => { clearTimeout(timer); reject(new Error('WebSocket 已停止')) })
    this.pending.clear()
    const socket = this.socket
    this.socket = null
    edgeWsState.status = 'disconnected'
    socket?.close({ code: 1000, reason: 'client stopped' })
  }

  onAppHide(): void { if (this.listeners.size) this.stop() }
  onAppShow(): void { if (this.listeners.size && !this.socket) { this.disposed = false; this.connect() } }
}

export const edgeWs = new EdgeWsSingleton()
export function subscribeDeviceStates(listener: DeviceStateListener, options?: EdgeWsSubscription): () => void { return edgeWs.subscribe(listener, options) }
export function startEdgeWsLifecycle(): void { /* App.vue binds uni onShow/onHide to the singleton. */ }
