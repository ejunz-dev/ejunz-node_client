<template>
    <div>
        <n-page-header title="节点" style="margin-bottom: 16px">
            <template #extra>
                <n-button size="small" :loading="loading" @click="refresh">刷新</n-button>
            </template>
        </n-page-header>
        <n-data-table :columns="columns" :data="nodes" :loading="loading" :pagination="{ pageSize: 15 }" />
    </div>
</template>

<script setup lang="ts">
import {
  NPageHeader, NButton, NDataTable, NTag, NSpace, NPopconfirm, useMessage,
} from 'naive-ui';
import { h, onMounted, onUnmounted, ref } from 'vue';
import {
  fetchNodes, authorizeNode, revokeNode, type EdgeNode,
} from '../api';

const message = useMessage();
const nodes = ref<EdgeNode[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

function statusTag(status: string) {
  const type = status === 'online' ? 'success'
    : status === 'pending' ? 'warning'
    : status === 'revoked' ? 'error' : 'default';
  return h(NTag, { size: 'small', type }, { default: () => status });
}

const columns = [
  { title: '节点 ID', key: 'nodeId' },
  {
    title: '状态',
    key: 'status',
    render: (row: EdgeNode) => statusTag(row.status),
  },
  {
    title: '地址',
    key: 'host',
    render: (row: EdgeNode) => `${row.host}:${row.port}`,
  },
  {
    title: '工具数',
    key: 'tools',
    render: (row: EdgeNode) => row.tools?.length ?? 0,
  },
  {
    title: '最后在线',
    key: 'lastSeen',
    render: (row: EdgeNode) => (row.lastSeen ? new Date(row.lastSeen).toLocaleString() : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: EdgeNode) => h(NSpace, null, {
      default: () => [
        row.status === 'pending' || row.status === 'revoked'
          ? h(NButton, {
            size: 'small', type: 'primary', onClick: () => onAuthorize(row.nodeId),
          }, { default: () => '授权' })
          : null,
        row.status !== 'revoked'
          ? h(NPopconfirm, {
            onPositiveClick: () => onRevoke(row.nodeId),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '吊销' }),
            default: () => `确认吊销节点 ${row.nodeId}？`,
          })
          : null,
      ],
    }),
  },
];

async function refresh() {
  loading.value = true;
  try {
    const res = await fetchNodes();
    nodes.value = res.nodes;
  } catch (e: any) {
    message.error(`获取节点失败：${e.message || e}`);
  } finally {
    loading.value = false;
  }
}

async function onAuthorize(nodeId: string) {
  try {
    await authorizeNode(nodeId);
    message.success(`已授权 ${nodeId}`);
    refresh();
  } catch (e: any) {
    message.error(`授权失败：${e.message || e}`);
  }
}

async function onRevoke(nodeId: string) {
  try {
    await revokeNode(nodeId);
    message.success(`已吊销 ${nodeId}`);
    refresh();
  } catch (e: any) {
    message.error(`吊销失败：${e.message || e}`);
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 5000);
});
onUnmounted(() => clearInterval(timer));
</script>
