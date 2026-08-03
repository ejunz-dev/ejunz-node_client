<script setup lang="ts">
const emit = defineEmits<{ (event: 'refresh'): void }>()
defineProps<{ title: string; refreshing?: boolean }>()
</script>
<template><view class="header"><text>{{ title }}</text><text class="refresh" @tap="emit('refresh')">{{ refreshing ? '加载中…' : '↻ 刷新' }}</text></view></template>
<style scoped>.header { display:flex; align-items:center; justify-content:space-between; margin:6rpx 0 24rpx; }.header > text:first-child { font-weight:800; font-size:34rpx; }.refresh { color:#55d6be; font-size:23rpx; }</style>
