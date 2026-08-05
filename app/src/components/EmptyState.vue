<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: '暂无数据' })
</script>
<template><view class="empty"><text class="icon">—</text><text>{{ text }}</text></view></template>
<style scoped>.empty { color:#75809a; text-align:center; padding:90rpx 0; display:flex; flex-direction:column; gap:14rpx; }.icon { color:#55d6be; font-size:42rpx; }</style>
