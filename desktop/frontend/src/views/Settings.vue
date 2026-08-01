<template>
    <div>
        <n-page-header title="设置" style="margin-bottom: 16px" />
        <n-grid :cols="2" x-gap="12" y-gap="12">
            <n-gi>
                <n-card title="Edge 认证">
                    <n-form v-if="auth">
                        <n-form-item label="启用认证">
                            <n-switch v-model:value="auth.enabled" />
                        </n-form-item>
                        <n-form-item label="用户名">
                            <n-input v-model:value="auth.username" />
                        </n-form-item>
                        <n-form-item :label="auth.passwordConfigured ? '新密码（留空不变）' : '密码'">
                            <n-input v-model:value="authPassword" type="password" show-password-on="click" />
                        </n-form-item>
                        <n-button type="primary" :loading="savingAuth" @click="onSaveAuth">保存</n-button>
                    </n-form>
                    <n-spin v-else />
                </n-card>
            </n-gi>
            <n-gi>
                <n-card title="Upstream 级联">
                    <n-form v-if="upstream">
                        <n-form-item label="启用">
                            <n-switch v-model:value="upstream.enabled" />
                        </n-form-item>
                        <n-form-item label="上游地址">
                            <n-input v-model:value="upstream.endpoint" placeholder="ws://upstream:5283/node/conn" />
                        </n-form-item>
                        <n-form-item label="Token（留空不变）">
                            <n-input v-model:value="upstreamToken" type="password" show-password-on="click" />
                        </n-form-item>
                        <n-form-item label="当前连接">
                            <n-tag :type="upstream.connected ? 'success' : 'warning'" size="small">
                                {{ upstream.connected ? '已连接' : '未连接' }}
                            </n-tag>
                        </n-form-item>
                        <n-space>
                            <n-button type="primary" :loading="savingUpstream" @click="onSaveUpstream">保存</n-button>
                            <n-popconfirm @positive-click="onRestartUpstream">
                                <template #trigger>
                                    <n-button :loading="restarting">重启连接</n-button>
                                </template>
                                确认重启 upstream 连接？
                            </n-popconfirm>
                        </n-space>
                    </n-form>
                    <n-spin v-else />
                </n-card>
            </n-gi>
        </n-grid>
    </div>
</template>

<script setup lang="ts">
import {
  NPageHeader, NGrid, NGi, NCard, NForm, NFormItem, NSwitch, NInput, NButton,
  NSpace, NTag, NSpin, NPopconfirm, useMessage,
} from 'naive-ui';
import { onMounted, ref } from 'vue';
import {
  fetchAuthConfig, updateAuthConfig,
  fetchUpstreamConfig, updateUpstreamConfig, restartUpstream,
  type AuthConfig, type UpstreamConfig,
} from '../api';

const message = useMessage();
const auth = ref<AuthConfig | null>(null);
const authPassword = ref('');
const savingAuth = ref(false);
const upstream = ref<UpstreamConfig | null>(null);
const upstreamToken = ref('');
const savingUpstream = ref(false);
const restarting = ref(false);

async function refresh() {
  try {
    [auth.value, upstream.value] = await Promise.all([fetchAuthConfig(), fetchUpstreamConfig()]);
  } catch (e: any) {
    message.error(`加载配置失败：${e.message || e}`);
  }
}

async function onSaveAuth() {
  if (!auth.value) return;
  savingAuth.value = true;
  try {
    await updateAuthConfig({
      enabled: auth.value.enabled,
      username: auth.value.username,
      ...(authPassword.value ? { password: authPassword.value } : {}),
    });
    authPassword.value = '';
    message.success('认证配置已保存');
    await refresh();
  } catch (e: any) {
    message.error(`保存失败：${e.message || e}`);
  } finally {
    savingAuth.value = false;
  }
}

async function onSaveUpstream() {
  if (!upstream.value) return;
  savingUpstream.value = true;
  try {
    await updateUpstreamConfig({
      enabled: upstream.value.enabled,
      endpoint: upstream.value.endpoint,
      ...(upstreamToken.value ? { token: upstreamToken.value } : {}),
    });
    upstreamToken.value = '';
    message.success('Upstream 配置已保存');
    await refresh();
  } catch (e: any) {
    message.error(`保存失败：${e.message || e}`);
  } finally {
    savingUpstream.value = false;
  }
}

async function onRestartUpstream() {
  restarting.value = true;
  try {
    await restartUpstream();
    message.success('Upstream 已重启');
    setTimeout(refresh, 1500);
  } catch (e: any) {
    message.error(`重启失败：${e.message || e}`);
  } finally {
    restarting.value = false;
  }
}

onMounted(refresh);
</script>
