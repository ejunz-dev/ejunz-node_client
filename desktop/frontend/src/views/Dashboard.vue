<template>
    <div>
        <n-page-header title="概览" style="margin-bottom: 16px" />
        <n-grid :cols="2" x-gap="12" y-gap="12">
            <n-gi>
                <n-card title="Edge 状态">
                    <n-descriptions :column="1" bordered size="small">
                        <n-descriptions-item label="模式">{{ status?.mode || '-' }}</n-descriptions-item>
                        <n-descriptions-item label="节点数">{{ status?.nodes ?? '-' }}</n-descriptions-item>
                        <n-descriptions-item label="MQTT Broker">
                            <n-tag :type="status?.broker ? 'success' : 'default'" size="small">
                                {{ status?.broker ? '运行中' : '未运行' }}
                            </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="节点接入点">{{ status?.nodeEndpoint || '-' }}</n-descriptions-item>
                    </n-descriptions>
                </n-card>
            </n-gi>
            <n-gi>
                <n-card title="Upstream">
                    <n-descriptions v-if="status?.upstream" :column="1" bordered size="small">
                        <n-descriptions-item label="启用">
                            <n-tag :type="status.upstream.enabled ? 'success' : 'default'" size="small">
                                {{ status.upstream.enabled ? '是' : '否' }}
                            </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="已配置">
                            {{ status.upstream.configured ? '是' : '否' }}
                        </n-descriptions-item>
                        <n-descriptions-item label="连接">
                            <n-tag :type="status.upstream.connected ? 'success' : 'warning'" size="small">
                                {{ status.upstream.connected ? '已连接' : '未连接' }}
                            </n-tag>
                        </n-descriptions-item>
                        <n-descriptions-item label="地址">{{ status.upstream.endpoint || '-' }}</n-descriptions-item>
                    </n-descriptions>
                    <n-empty v-else description="无 upstream 信息" />
                </n-card>
            </n-gi>
        </n-grid>
    </div>
</template>

<script setup lang="ts">
import {
  NPageHeader, NGrid, NGi, NCard, NDescriptions, NDescriptionsItem, NTag, NEmpty, useMessage,
} from 'naive-ui';
import { onMounted, onUnmounted, ref } from 'vue';
import { fetchStatus, type EdgeStatus } from '../api';

const message = useMessage();
const status = ref<EdgeStatus | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

async function refresh() {
  try {
    status.value = await fetchStatus();
  } catch (e: any) {
    message.error(`获取状态失败：${e.message || e}`);
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 5000);
});
onUnmounted(() => clearInterval(timer));
</script>
