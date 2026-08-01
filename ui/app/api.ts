import { Capacitor, CapacitorHttp } from '@capacitor/core';

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

export function clearCredentials() {
  _serverUrl = '';
  _username = '';
  _password = '';
  try {
    localStorage.removeItem('ejunz_edge_conn');
    localStorage.removeItem('ejunz_edge_pass');
  } catch {}
}

export function saveCredentials() {
  try {
    localStorage.setItem(
      'ejunz_edge_conn',
      JSON.stringify({ serverUrl: _serverUrl, username: _username })
    );
    localStorage.setItem('ejunz_edge_pass', _password);
  } catch {}
}

export function loadCredentials(): boolean {
  try {
    const raw = localStorage.getItem('ejunz_edge_conn');
    if (raw) {
      const data = JSON.parse(raw);
      _serverUrl = data.serverUrl || '';
      _username = data.username || '';
    }
    _password = localStorage.getItem('ejunz_edge_pass') || '';
    return !!_serverUrl;
  } catch {
    return false;
  }
}

export function getSavedUsername() {
  return _username;
}
export function getSavedPassword() {
  return _password;
}

/* ===== API Helper ===== */

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody = options?.body !== undefined;
  const extraHeaders = options?.headers instanceof Headers
    ? Object.fromEntries(options.headers.entries())
    : (options?.headers as Record<string, string> | undefined);
  const url = _serverUrl + path;

  if (!Capacitor.isNativePlatform()) {
    // Browser CORS requests use the query token instead of an Authorization header.
    // This keeps GET requests simple and avoids an unnecessary preflight.
    const browserUrl = new URL(url);
    if (_password) browserUrl.searchParams.set('token', _password);
    const browserHeaders = {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    };
    const response = await fetch(browserUrl.toString(), {
      ...options,
      headers: browserHeaders,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_username || _password) {
    headers['Authorization'] = 'Basic ' + btoa(`${_username}:${_password}`);
  }
  const response = await CapacitorHttp.request({
    url,
    method: options?.method || 'GET',
    headers: { ...headers, ...extraHeaders },
    ...(hasBody ? { data: options.body } : {}),
    responseType: 'json',
  });
  if (response.status < 200 || response.status >= 300) {
    const body = response.data || {};
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return response.data as T;
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
