import * as SecureStore from 'expo-secure-store';
import type { NodeCredentials } from './types';

const CREDENTIALS_KEY = 'ejunz-node-credentials';

export async function loadCredentials(): Promise<NodeCredentials | null> {
  const value = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as NodeCredentials;
  } catch {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return null;
  }
}

export async function saveCredentials(credentials: NodeCredentials): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}
