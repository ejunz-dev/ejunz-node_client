import { defineStore } from 'pinia'
import { computed } from 'vue'
import { edgeWsState } from '@/services/edge-ws'

export const useWsStore = defineStore('ws', () => ({ status: computed(() => edgeWsState.status), lastError: computed(() => edgeWsState.lastError), reconnectAttempt: computed(() => edgeWsState.reconnectAttempt) }))
