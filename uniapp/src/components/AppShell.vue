<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { displayServerUrl } from '@/utils/url'
const session = useSessionStore()
const server = computed(() => displayServerUrl(session.serverUrl))
function logout() { session.logout(); uni.reLaunch({ url: '/pages/login/index' }) }
</script>
<template>
  <view class="shell safe-area">
    <view class="topbar"><view><text class="eyebrow">EJUNZ EDGE</text><text class="title"><slot name="title">管理控制台</slot></text></view><view class="online-dot" /></view>
    <view class="server-line"><text>{{ server }}</text><text class="link" @tap="logout">断开</text></view>
    <slot />
  </view>
</template>
<style scoped>
.shell { min-height: 100vh; padding: 42rpx 32rpx 56rpx; }
.topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 22rpx; }
.eyebrow { display:block; color:#55d6be; font-size:20rpx; font-weight:700; letter-spacing:4rpx; }
.title { display:block; color:#edf5ff; font-size:42rpx; font-weight:800; margin-top:8rpx; }
.online-dot { width:18rpx; height:18rpx; border-radius:50%; background:#55d6be; box-shadow:0 0 0 8rpx rgba(85,214,190,.12); margin:12rpx 10rpx 0 0; }
.server-line { display:flex; justify-content:space-between; color:#75809a; font-size:22rpx; border-bottom:1rpx solid #1a2a43; padding-bottom:24rpx; margin-bottom:30rpx; }
.link { color:#55d6be; }
</style>
