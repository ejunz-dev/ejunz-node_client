import { defineStore } from 'pinia'
import { ref } from 'vue'
import { disconnect, fetchStatus, getCredentials, persistCredentials, restoreCredentials, setCredentials } from '@/services/api'
import { edgeWs } from '@/services/edge-ws'

export const useSessionStore = defineStore('session', () => {
  const ready = ref(false); const connected = ref(false); const loading = ref(false); const error = ref('')
  const serverUrl = ref(''); const username = ref('')
  async function hydrate(): Promise<void> { if (ready.value) return; if (restoreCredentials()) { const saved = getCredentials(); serverUrl.value = saved.serverUrl; username.value = saved.username; try { await fetchStatus(); connected.value = true } catch { disconnect() } }; ready.value = true }
  async function connectToServer(url: string, user: string, password: string): Promise<void> { loading.value = true; error.value = ''; setCredentials(url, user, password); try { await fetchStatus(); persistCredentials(); const saved = getCredentials(); serverUrl.value = saved.serverUrl; username.value = saved.username; connected.value = true } catch (cause) { disconnect(); connected.value = false; throw cause } finally { loading.value = false } }
  function logout(): void { edgeWs.stop(); disconnect(); connected.value = false; serverUrl.value = ''; username.value = '' }
  return { ready, connected, loading, error, serverUrl, username, hydrate, connectToServer, logout }
})
