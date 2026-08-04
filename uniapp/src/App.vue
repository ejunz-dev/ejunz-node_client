<script setup lang="ts">
import { onHide, onShow, onLaunch, onError } from '@dcloudio/uni-app'
import { edgeWs } from '@/services/edge-ws'
import { getPlatform } from '@/utils/platform'

onLaunch(() => {
  const platform = getPlatform()
  console.log(`[Ejunz Edge] App launched on platform: ${platform}`)
})

onShow(() => edgeWs.onAppShow())
onHide(() => edgeWs.onAppHide())

onError((error) => {
  console.error('[Ejunz Edge] Unhandled error:', error)
})
</script>

<template><view /></template>
