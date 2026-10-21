<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MonitorUp, MonitorX, PhoneOff, Signal, SignalLow } from '@lucide/vue'
import { errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import { useVoiceStore } from '@/stores/voice'
import { screenShareSupported } from '@/rtc/devices'

const voice = useVoiceStore()
const channels = useChannelsStore()
const ui = useUiStore()
const router = useRouter()

const channel = computed(() => (voice.currentChannelId ? channels.get(voice.currentChannelId) : undefined))
const states = computed(() => Object.values(voice.connections))
const degraded = computed(() => states.value.some((s) => s === 'connecting' || s === 'disconnected' || s === 'failed'))
const canShare = screenShareSupported()

async function toggleShare() {
  try {
    if (voice.streaming) await voice.stopScreenShare()
    else await voice.startScreenShare()
  } catch (error) {
    // user cancelled the picker → NotAllowedError, stay quiet
    if (error instanceof DOMException && error.name === 'NotAllowedError') return
    ui.toast(errorMessage(error, '화면 공유를 시작할 수 없습니다.'), 'error')
  }
}

function goToChannel() {
  if (voice.currentChannelId) void router.push(`/channels/${voice.currentChannelId}`)
}
</script>

<template>
  <section class="voice-panel" aria-label="음성 연결 상태">
    <div class="status-row">
      <button type="button" class="status" @click="goToChannel">
        <span class="status-title" :class="{ 'is-connecting': voice.connecting, 'is-degraded': degraded }">
          <component :is="degraded ? SignalLow : Signal" :size="16" />
          {{ voice.connecting ? '연결 중…' : degraded ? '연결 상태 불안정' : '음성 연결됨' }}
        </span>
        <span class="status-channel truncate">{{ channel?.name ?? '' }}{{ voice.relay ? '' : '' }}</span>
      </button>
      <button
        v-tooltip="'연결 끊기'"
        type="button"
        class="icon-btn"
        aria-label="음성 채널 연결 끊기"
        @click="voice.leave()"
      >
        <PhoneOff :size="20" />
      </button>
    </div>
    <div class="actions">
      <button
        type="button"
        class="action"
        :class="{ 'is-on': voice.streaming }"
        :disabled="!canShare || voice.connecting"
        @click="toggleShare"
      >
        <component :is="voice.streaming ? MonitorX : MonitorUp" :size="18" />
        {{ voice.streaming ? '공유 중지' : '화면 공유' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.voice-panel {
  padding: 8px;
  background: var(--bg-secondary-alt);
  border-bottom: 1px solid var(--divider-strong);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.status {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  text-align: left;
}

.status:hover {
  background: var(--bg-modifier-hover);
}

.status-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--green);
}

.status-title.is-connecting {
  color: var(--yellow);
}

.status-title.is-degraded {
  color: var(--yellow);
}

.status-channel {
  max-width: 100%;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-modifier-active);
  color: var(--text-normal);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: background-color var(--transition-fast);
}

.action:hover:not(:disabled) {
  background: var(--bg-modifier-selected);
}

.action.is-on {
  background: var(--red);
  color: #fff;
}
</style>
