export type DeviceState = Record<string, unknown>;

export interface NodeDevice {
  deviceId: string;
  friendlyName: string;
  model?: string;
  vendor?: string;
  type?: string;
  powerSource?: string;
  lastSeen?: string | null;
  state?: DeviceState;
  currentState?: string;
  online?: boolean;
  supportsOnOff?: boolean;
  endpoint?: string;
  originalDeviceId?: string;
  isEndpointDevice?: boolean;
}

export interface ZigbeeStatus {
  connected: boolean;
  error?: string;
  devicesCached?: number;
}

export interface DevicesResponse {
  devices: NodeDevice[];
}

export interface NodeCredentials {
  baseUrl: string;
  username: string;
  password: string;
}
