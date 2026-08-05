<script setup lang="ts">
import { statusColor, statusLabel } from '@/utils/status'
defineProps<{ status: string }>()
</script>
<template><text class="badge" :style="{ color: statusColor(status), backgroundColor: statusColor(status) + '22' }">{{ statusLabel(status) }}</text></template>
<style scoped>.badge { border-radius:24rpx; padding:7rpx 16rpx; font-size:21rpx; font-weight:700; }</style>
