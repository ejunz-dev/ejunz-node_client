<template>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
        <n-card title="连接 Edge 服务器" style="width: 420px">
            <n-form @submit.prevent="onConnect">
                <n-form-item label="服务器地址">
                    <n-input v-model:value="serverUrl" placeholder="http://edge-host:5283（留空走 dev 代理）" />
                </n-form-item>
                <n-form-item label="用户名">
                    <n-input v-model:value="username" placeholder="admin" />
                </n-form-item>
                <n-form-item label="密码 / Token">
                    <n-input v-model:value="password" type="password" show-password-on="click" placeholder="edge" @keyup.enter="onConnect" />
                </n-form-item>
                <n-button type="primary" block :loading="connecting" @click="onConnect">连接</n-button>
            </n-form>
        </n-card>
    </div>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import { ref } from 'vue';
import { setCredentials, persistCredentials, fetchStatus } from '../api';
import { session } from '../session';

const message = useMessage();
const serverUrl = ref('');
const username = ref('admin');
const password = ref('');
const connecting = ref(false);

async function onConnect() {
  if (connecting.value) return;
  connecting.value = true;
  try {
    setCredentials(serverUrl.value || window.location.origin, username.value, password.value);
    await fetchStatus();
    await persistCredentials();
    session.connected = true;
  } catch (e: any) {
    message.error(`连接失败：${e.message || e}`);
  } finally {
    connecting.value = false;
  }
}
</script>
