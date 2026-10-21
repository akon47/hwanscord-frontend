<script setup lang="ts">
import { WifiOff } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <Transition name="fade">
    <div v-if="ui.connection === 'disconnected'" class="banner" role="alert">
      <WifiOff :size="16" />
      연결이 끊어졌습니다. 다시 연결 중…
    </div>
  </Transition>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 32px;
  background: var(--red);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
</style>
