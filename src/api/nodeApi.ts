import type { DevicesResponse, NodeCredentials, ZigbeeStatus } from '../types';

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

function basicAuth(credentials: NodeCredentials): string {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
}

export class NodeApi {
  readonly baseUrl: string;

  constructor(private readonly credentials: NodeCredentials) {
    this.baseUrl = normalizeBaseUrl(credentials.baseUrl);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: basicAuth(this.credentials),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      const message = typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : `Node returned HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }

  async testConnection(): Promise<ZigbeeStatus> {
    return this.request<ZigbeeStatus>('/zigbee2mqtt/status');
  }

  async getStatus(): Promise<ZigbeeStatus> {
    return this.request<ZigbeeStatus>('/zigbee2mqtt/status');
  }

  async listDevices(): Promise<DevicesResponse> {
    return this.request<DevicesResponse>('/zigbee2mqtt/devices');
  }

  async setDeviceState(deviceId: string, state: 'ON' | 'OFF' | 'TOGGLE') {
    return this.request<{ ok?: number; error?: string }>(
      `/zigbee2mqtt/device/${encodeURIComponent(deviceId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ state }),
      },
    );
  }
}

export { normalizeBaseUrl };
