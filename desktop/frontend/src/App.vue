<template>
    <n-config-provider :theme="osTheme === 'dark' ? darkTheme : undefined" :locale="zhCN" :date-locale="dateZhCN">
        <n-notification-provider>
            <n-message-provider>
                <n-global-style />
                <connect-view v-if="session.ready && !session.connected" />
                <n-layout v-else-if="session.connected" has-sider style="height: 100vh">
                    <n-layout-sider bordered :width="200">
                        <div style="padding: 16px; font-weight: 600; font-size: 16px">Ejunz Edge</div>
                        <n-menu :value="String(route.name)" :options="menuOptions" @update:value="onMenu" />
                        <div style="position: absolute; bottom: 16px; left: 16px; right: 16px">
                            <div style="font-size: 12px; color: #888; margin-bottom: 8px; word-break: break-all">
                                {{ serverUrl }}
                            </div>
                            <n-button size="small" block @click="onLogout">断开连接</n-button>
                        </div>
                    </n-layout-sider>
                    <n-layout-content content-style="padding: 20px; overflow: auto">
                        <router-view />
                    </n-layout-content>
                </n-layout>
            </n-message-provider>
        </n-notification-provider>
    </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider, NNotificationProvider, NMessageProvider, NGlobalStyle,
  NLayout, NLayoutSider, NLayoutContent, NMenu, NButton,
  darkTheme, useOsTheme, zhCN, dateZhCN,
} from 'naive-ui';
import { computed, h, onMounted } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import ConnectView from './views/Connect.vue';
import { session, initSession, logout } from './session';
import { getServerUrl } from './api';

const osTheme = useOsTheme();
const route = useRoute();
const router = useRouter();

const menuOptions = [
  { label: '概览', key: 'dashboard' },
  { label: '节点', key: 'nodes' },
  { label: '设备', key: 'devices' },
  { label: '设置', key: 'settings' },
];

const serverUrl = computed(() => getServerUrl());

function onMenu(key: string) {
  router.push({ name: key });
}

async function onLogout() {
  await logout();
  router.push({ name: 'dashboard' });
}

onMounted(initSession);
</script>
