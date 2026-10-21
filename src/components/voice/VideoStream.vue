<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ stream: MediaStream | null; muted?: boolean; contain?: boolean }>(), {
  muted: true,
  contain: true,
})

const video = ref<HTMLVideoElement | null>(null)

function attach() {
  const el = video.value
  if (!el) return
  if (el.srcObject !== props.stream) el.srcObject = props.stream
  if (props.stream) void el.play().catch(() => undefined)
}

onMounted(attach)
watch(() => props.stream, attach)

function fullscreen() {
  void video.value?.requestFullscreen?.()
}

defineExpose({ fullscreen })
</script>

<template>
  <video ref="video" class="video" :class="{ 'is-contain': contain }" autoplay playsinline :muted="muted" />
</template>

<style scoped>
.video {
  width: 100%;
  height: 100%;
  background: #000;
  object-fit: cover;
}

.video.is-contain {
  object-fit: contain;
}
</style>
