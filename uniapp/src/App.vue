<script setup lang="ts">
import { onHide, onShow } from '@dcloudio/uni-app'
import { edgeWs } from '@/services/edge-ws'

onShow(() => edgeWs.onAppShow())
onHide(() => edgeWs.onAppHide())
</script>

<template><view /></template>
