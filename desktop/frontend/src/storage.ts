// Credential persistence: Neutralino storage when running inside the desktop
// shell, localStorage when running in a plain browser (vite dev).

const CONN_KEY = 'ejunz_edge_conn';
const PASS_KEY = 'ejunz_edge_pass';

function neutralinoAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Neutralino?.storage;
}

async function neuStorage() {
  const { storage } = await import('@neutralinojs/lib');
  return storage;
}

export async function saveCredentials(serverUrl: string, username: string, password: string) {
  const conn = JSON.stringify({ serverUrl, username });
  if (neutralinoAvailable()) {
    try {
      const storage = await neuStorage();
      await storage.setData(CONN_KEY, conn);
      await storage.setData(PASS_KEY, password);
      return;
    } catch {}
  }
  try {
    localStorage.setItem(CONN_KEY, conn);
    localStorage.setItem(PASS_KEY, password);
  } catch {}
}

export async function loadCredentials(): Promise<{ serverUrl: string; username: string; password: string } | null> {
  let raw: string | null = null;
  let password = '';
  if (neutralinoAvailable()) {
    try {
      const storage = await neuStorage();
      raw = await storage.getData(CONN_KEY);
      password = await storage.getData(PASS_KEY).catch(() => '');
    } catch {
      raw = null;
    }
  }
  if (!raw) {
    try {
      raw = localStorage.getItem(CONN_KEY);
      password = localStorage.getItem(PASS_KEY) || '';
    } catch {}
  }
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data.serverUrl) return null;
    return { serverUrl: data.serverUrl, username: data.username || '', password };
  } catch {
    return null;
  }
}

export async function clearCredentials() {
  if (neutralinoAvailable()) {
    try {
      const storage = await neuStorage();
      await storage.remove(CONN_KEY).catch(() => {});
      await storage.remove(PASS_KEY).catch(() => {});
    } catch {}
  }
  try {
    localStorage.removeItem(CONN_KEY);
    localStorage.removeItem(PASS_KEY);
  } catch {}
}
