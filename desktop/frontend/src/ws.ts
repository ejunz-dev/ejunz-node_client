import { reactive } from 'vue';
import { getEdgeWsUrl } from './api';

export interface DeviceStateMessage {
  type: 'device_state';
  topic: string; // node/<nodeId>/devices/<deviceId>/state
  payload: unknown; // zigbee2mqtt state object (or its JSON string)
}

type Listener = (msg: DeviceStateMessage) => void;

export const wsState = reactive({
  status: 'disconnected' as 'connecting' | 'connected' | 'disconnected',
});

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

function connect() {
  if (socket) return;
  wsState.status = 'connecting';
  const ws = new WebSocket(getEdgeWsUrl());
  socket = ws;
  ws.onopen = () => {
    if (socket === ws) wsState.status = 'connected';
  };
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data));
      if (msg?.type !== 'device_state') return;
      listeners.forEach((fn) => fn(msg));
    } catch {}
  };
  ws.onclose = () => {
    if (socket === ws) {
      socket = null;
      wsState.status = 'disconnected';
    }
    if (listeners.size) {
      reconnectTimer = setTimeout(connect, 3000);
    }
  };
  ws.onerror = () => ws.close();
}

// Subscribe to real-time device state pushes. Returns an unsubscribe function;
// the socket is opened lazily and closed once the last subscriber leaves.
export function subscribeDeviceStates(fn: Listener): () => void {
  listeners.add(fn);
  if (!socket) connect();
  return () => {
    listeners.delete(fn);
    if (!listeners.size) {
      clearTimeout(reconnectTimer);
      const ws = socket;
      socket = null;
      wsState.status = 'disconnected';
      ws?.close();
    }
  };
}
