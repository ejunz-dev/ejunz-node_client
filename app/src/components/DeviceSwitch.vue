<script setup lang="ts">
const props = defineProps<{ checked: boolean; disabled?: boolean }>()
const emit = defineEmits<{ (event: 'change'): void }>()
</script>
<template><view class="switch" :class="{ on: props.checked, disabled: props.disabled }" @tap="!props.disabled && emit('change')"><view class="thumb" /></view></template>
<style scoped>.switch { width:96rpx; height:56rpx; border-radius:56rpx; background:#30415d; padding:6rpx; transition:all .2s; }.switch.on { background:#55d6be; }.switch.disabled { opacity:.5; }.thumb { width:44rpx; height:44rpx; border-radius:50%; background:white; transition:transform .2s; }.switch.on .thumb { transform:translateX(40rpx); }</style>
