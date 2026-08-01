import { saveCredentials, loadCredentials, clearCredentials } from './storage';

/* ===== Edge Mode API Types ===== */

export interface EdgeNode {
  nodeId: string;
  status: 'pending' | 'online' | 'offline' | 'revoked' | string;
  host: string;
  port: number;
  tools?: any[];
  lastSeen: number;
  tokenConfigured?: boolean;
  requestId?: string;
}

export interface EdgeStatus {
  mode: 'edge';
  nodes: number;
  broker: boolean;
  nodeEndpoint?: string;
  upstream?: {
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    endpoint?: string;
  };
}

export interface Device {
  deviceId: string;
  friendlyName: string;
  model?: string;
  vendor?: string;
  type?: string;
  supportsOnOff?: boolean;
  currentState?: string;
  online?: boolean;
}

export interface AuthConfig {
  enabled: boolean;
  username: string;
  passwordConfigured: boolean;
}

export interface UpstreamConfig {
  enabled: boolean;
  endpoint: string;
  connected: boolean;
}

/* ===== Credentials Management ===== */

let _serverUrl = '';
let _username = '';
let _password = '';

export function setCredentials(url: string, user: string, pass: string) {
  _serverUrl = url.replace(/\/+$/, '');
  _username = user;
  _password = pass;
}

export function getServerUrl() {
  return _serverUrl;
}

// WebSocket endpoint for real-time device state pushes (`/api/edge/ws`).
export function getEdgeWsUrl() {
  const url = new URL(_serverUrl + '/api/edge/ws', window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (_password) url.searchParams.set('token', _password);
  return url.toString();
}

export function getUsername() {
  return _username;
}

export async function persistCredentials() {
  await saveCredentials(_serverUrl, _username, _password);
}

export async function restoreCredentials(): Promise<boolean> {
  const saved = await loadCredentials();
  if (!saved) return false;
  _serverUrl = saved.serverUrl.replace(/\/+$/, '');
  _username = saved.username;
  _password = saved.password;
  return true;
}

export async function disconnect() {
  _serverUrl = '';
  _username = '';
  _password = '';
  await clearCredentials();
}

/* ===== API Helper ===== */

// The Edge server allows CORS from any origin and accepts the password as a
// `token` query parameter, so plain fetch works both in the Neutralino webview
// and in a browser during development (via the vite proxy).
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody = options?.body !== undefined;
  const extraHeaders = options?.headers instanceof Headers
    ? Object.fromEntries(options.headers.entries())
    : (options?.headers as Record<string, string> | undefined);
  const url = new URL(_serverUrl + path, window.location.href);
  if (_password) url.searchParams.set('token', _password);
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/* ===== Edge API Convenience Methods ===== */

export function fetchStatus() {
  return api<EdgeStatus>('/api/edge/status');
}

export function fetchNodes() {
  return api<{ nodes: EdgeNode[] }>('/api/edge/nodes');
}

export function fetchNodeDevices(nodeId: string) {
  return api<{ devices: Device[]; count: number }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/devices`);
}

export function controlDevice(nodeId: string, deviceId: string, state: 'ON' | 'OFF' | 'TOGGLE') {
  return api<{ result: any }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/devices/control`, {
    method: 'POST',
    body: JSON.stringify({ deviceId, state }),
  });
}

export function authorizeNode(nodeId: string) {
  return api<{ ok: number; nodeId: string }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/authorize`, {
    method: 'POST',
  });
}

export function revokeNode(nodeId: string) {
  return api<{ ok: number }>(`/api/edge/nodes/${encodeURIComponent(nodeId)}/revoke`, {
    method: 'POST',
  });
}

export function fetchAuthConfig() {
  return api<AuthConfig>('/api/edge/auth-config');
}

export function updateAuthConfig(config: { enabled?: boolean; username?: string; password?: string }) {
  return api<{ ok: number; enabled: boolean; username: string }>('/api/edge/auth-config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export function fetchUpstreamConfig() {
  return api<UpstreamConfig>('/api/edge/upstream');
}

export function updateUpstreamConfig(config: { enabled?: boolean; endpoint?: string; token?: string }) {
  return api<{ ok: number; endpoint: string }>('/api/edge/upstream', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export function restartUpstream() {
  return api<{ ok: number }>('/api/edge/upstream/restart', { method: 'POST' });
}
