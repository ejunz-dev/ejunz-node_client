import { reactive } from 'vue';
import { restoreCredentials, disconnect as apiDisconnect, fetchStatus } from './api';

export const session = reactive({
  connected: false,
  ready: false, // credential restore attempted
});

export async function initSession() {
  if (await restoreCredentials()) {
    try {
      await fetchStatus();
      session.connected = true;
    } catch {
      // saved credentials no longer valid — fall back to the connect screen
    }
  }
  session.ready = true;
}

export async function logout() {
  await apiDisconnect();
  session.connected = false;
}
