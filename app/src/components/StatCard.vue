<script setup lang="ts">
defineProps<{ label: string; value: string | number; accent?: string }>()
</script>
<template><view class="stat"><text class="label">{{ label }}</text><text class="value" :style="accent ? { color: accent } : undefined">{{ value }}</text></view></template>
<style scoped>.stat { background:#101a2d; border:1rpx solid #1a2a43; border-radius:24rpx; padding:26rpx; min-height:120rpx; display:flex; flex-direction:column; justify-content:space-between; }.label { color:#75809a; font-size:21rpx; }.value { color:#edf5ff; font-size:42rpx; font-weight:800; margin-top:14rpx; }</style>
