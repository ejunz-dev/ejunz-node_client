<template>
    <div>
        <n-page-header title="设备控制" style="margin-bottom: 16px">
            <template #extra>
                <n-space align="center" :size="8">
                    <n-tag :type="wsTagType" size="small" round>
                        ● {{ wsStatusText }}
                    </n-tag>
                    <n-button size="small" :loading="loadingDevices" :disabled="!selectedNode" @click="refreshDevices">↻ 刷新</n-button>
                </n-space>
            </template>
        </n-page-header>
        <n-select
            v-model:value="selectedNode"
            :options="nodeOptions"
            placeholder="选择节点"
            style="margin-bottom: 16px"
            :loading="loadingNodes"
        />
        <n-empty v-if="!selectedNode" description="请先选择一个节点" style="padding: 32px 0" />
        <n-spin v-else :show="loadingDevices && !devices.length">
            <n-empty v-if="!devices.length && !loadingDevices" description="该节点暂无设备" style="padding: 32px 0" />
            <n-space vertical :size="8">
                <n-card v-for="d in devices" :key="d.deviceId" size="small">
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                            <span style="font-size: 15px; font-weight: 600">{{ d.friendlyName }}</span>
                            <n-space :size="6">
                                <n-tag size="tiny" :bordered="false">{{ d.deviceId.slice(0, 16) }}</n-tag>
                                <n-tag v-if="d.model" size="tiny" :bordered="false">{{ d.model }}</n-tag>
                                <n-tag v-if="d.type" size="tiny" :bordered="false">{{ d.type }}</n-tag>
                            </n-space>
                        </div>
                        <n-switch
                            v-if="d.supportsOnOff !== false"
                            :value="d.currentState === 'ON'"
                            :loading="toggling.has(d.deviceId)"
                            :disabled="toggling.has(d.deviceId)"
                            @update:value="onToggle(d)"
                        />
                    </div>
                </n-card>
            </n-space>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import {
  NPageHeader, NSpace, NSelect, NButton, NEmpty, NCard, NTag, NSwitch, NSpin, useMessage,
} from 'naive-ui';
import {
  computed, onMounted, onUnmounted, reactive, ref, watch,
} from 'vue';
import {
  fetchNodes, fetchNodeDevices, controlDevice, type EdgeNode, type Device,
} from '../api';
import { subscribeDeviceStates, wsState } from '../ws';

const message = useMessage();
const nodes = ref<EdgeNode[]>([]);
const selectedNode = ref<string | null>(null);
const devices = ref<Device[]>([]);
const loadingNodes = ref(false);
const loadingDevices = ref(false);
const toggling = reactive(new Set<string>());
let unsubscribe: (() => void) | undefined;

const nodeOptions = computed(() => nodes.value.map((n) => ({
  label: `${n.nodeId} (${n.host}:${n.port})`,
  value: n.nodeId,
})));

const wsTagType = computed(() => (wsState.status === 'connected' ? 'success'
  : wsState.status === 'connecting' ? 'warning' : 'error'));
const wsStatusText = computed(() => (wsState.status === 'connected' ? '实时'
  : wsState.status === 'connecting' ? '连接中' : '未连接'));

async function refreshNodes() {
  loadingNodes.value = true;
  try {
    const res = await fetchNodes();
    nodes.value = res.nodes.filter((n) => n.status === 'online');
    if (!selectedNode.value && nodes.value.length) {
      selectedNode.value = nodes.value[0].nodeId;
    }
  } catch (e: any) {
    message.error(`获取节点失败：${e.message || e}`);
  } finally {
    loadingNodes.value = false;
  }
}

async function refreshDevices() {
  if (!selectedNode.value) return;
  loadingDevices.value = true;
  try {
    const res = await fetchNodeDevices(selectedNode.value);
    devices.value = res.devices;
  } catch (e: any) {
    message.error(`获取设备失败：${e.message || e}`);
  } finally {
    loadingDevices.value = false;
  }
}

async function onToggle(device: Device) {
  if (!selectedNode.value || toggling.has(device.deviceId)) return;
  toggling.add(device.deviceId);
  const newState = device.currentState === 'ON' ? 'OFF' : 'ON';
  try {
    await controlDevice(selectedNode.value, device.deviceId, newState);
    device.currentState = newState; // 乐观更新，WS 推送会再确认
  } catch (e: any) {
    message.error(`控制失败：${e.message || e}`);
  } finally {
    toggling.delete(device.deviceId);
  }
}

function onDeviceState(topic: string, payload: unknown) {
  const match = topic.match(/^node\/([^/]+)\/devices\/([^/]+)\/state$/);
  if (!match || match[1] !== selectedNode.value) return;
  const device = devices.value.find((d) => d.deviceId === match[2]);
  if (!device) return;
  let state: any = payload;
  if (typeof state === 'string') {
    try { state = JSON.parse(state); } catch { state = {}; }
  }
  const newState = state?.state === 'ON' ? 'ON' : state?.state === 'OFF' ? 'OFF' : undefined;
  if (newState) device.currentState = newState;
}

watch(selectedNode, () => {
  devices.value = [];
  refreshDevices();
});

onMounted(() => {
  refreshNodes();
  unsubscribe = subscribeDeviceStates((msg) => onDeviceState(msg.topic, msg.payload));
});
onUnmounted(() => unsubscribe?.());
</script>
