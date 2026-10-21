<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Headphones, HeadphoneOff, Mic, MicOff, MonitorUp, MonitorX, PhoneOff, Volume2 } from '@lucide/vue'
import type { Channel } from '@/api'
import { errorMessage } from '@/api/client'
import { useUiStore } from '@/stores/ui'
import { useVoiceStore } from '@/stores/voice'
import { screenShareSupported } from '@/rtc/devices'
import ChannelHeader from '@/components/layout/ChannelHeader.vue'
import VoiceTile from './VoiceTile.vue'

const props = defineProps<{ channel: Channel }>()

const voice = useVoiceStore()
const ui = useUiStore()

const members = computed(() => voice.membersOf(props.channel.id))
const joined = computed(() => voice.currentChannelId === props.channel.id)
const focusedSocket = ref<string | null>(null)
const canShare = screenShareSupported()

const focused = computed(() => members.value.find((m) => m.socketId === focusedSocket.value) ?? null)
const others = computed(() => members.value.filter((m) => m.socketId !== focusedSocket.value))

// auto-focus a newly started stream I am watching
watch(
  () => voice.watching,
  (socketId) => {
    if (socketId) focusedSocket.value = socketId
  },
)

// drop focus when that member leaves
watch(members, (list) => {
  if (focusedSocket.value && !list.some((m) => m.socketId === focusedSocket.value)) focusedSocket.value = null
})

function toggleFocus(socketId: string) {
  focusedSocket.value = focusedSocket.value === socketId ? null : socketId
}

async function join() {
  try {
    await voice.join(props.channel.id)
  } catch {
    // toast shown by the store
  }
}

async function toggleShare() {
  try {
    if (voice.streaming) await voice.stopScreenShare()
    else {
      await voice.startScreenShare()
      focusedSocket.value = voice.mySocketId
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') return
    ui.toast(errorMessage(error, '화면 공유를 시작할 수 없습니다.'), 'error')
  }
}
</script>

<template>
  <section class="voice-view">
    <ChannelHeader :channel="channel" :show-search="false" />

    <div v-if="members.length === 0 && !joined" class="empty">
      <div class="empty-icon"><Volume2 :size="48" /></div>
      <h2>{{ channel.name }}</h2>
      <p>아직 아무도 없어요. 먼저 들어가서 친구들을 기다려 보세요.</p>
      <button type="button" class="btn btn-primary btn-lg" :disabled="voice.connecting" @click="join">
        {{ voice.connecting ? '연결 중…' : '음성 채널 참가' }}
      </button>
    </div>

    <div v-else class="stage" :class="{ 'has-focus': !!focused }">
      <div v-if="focused" class="focus">
        <VoiceTile :member="focused" focused @focus="toggleFocus(focused.socketId)" />
      </div>
      <div class="grid" :class="{ 'is-strip': !!focused }">
        <VoiceTile
          v-for="member in others"
          :key="member.socketId"
          :member="member"
          :focused="false"
          :small="!!focused"
          @focus="toggleFocus(member.socketId)"
        />
      </div>
    </div>

    <footer class="controls">
      <template v-if="joined">
        <button
          v-tooltip="voice.muted ? '마이크 음소거 해제' : '마이크 음소거'"
          type="button"
          class="control"
          :class="{ 'is-off': voice.muted }"
          aria-label="마이크 음소거"
          @click="voice.toggleMute()"
        >
          <component :is="voice.muted ? MicOff : Mic" :size="22" />
        </button>
        <button
          v-tooltip="voice.deafened ? '헤드셋 음소거 해제' : '헤드셋 음소거'"
          type="button"
          class="control"
          :class="{ 'is-off': voice.deafened }"
          aria-label="헤드셋 음소거"
          @click="voice.toggleDeafen()"
        >
          <component :is="voice.deafened ? HeadphoneOff : Headphones" :size="22" />
        </button>
        <button
          v-tooltip="voice.streaming ? '공유 중지' : '화면 공유'"
          type="button"
          class="control"
          :class="{ 'is-live': voice.streaming }"
          :disabled="!canShare"
          aria-label="화면 공유"
          @click="toggleShare"
        >
          <component :is="voice.streaming ? MonitorX : MonitorUp" :size="22" />
        </button>
        <button v-tooltip="'음성 채널 나가기'" type="button" class="control is-leave" aria-label="음성 채널 나가기" @click="voice.leave()">
          <PhoneOff :size="22" />
        </button>
      </template>
      <button v-else-if="members.length" type="button" class="btn btn-primary btn-lg" :disabled="voice.connecting" @click="join">
        {{ voice.connecting ? '연결 중…' : '음성 채널 참가' }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.voice-view {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--bg-tertiary);
}

.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

.empty h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--header-primary);
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--header-primary);
}

.stage {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.focus {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
}

.focus :deep(.tile) {
  width: 100%;
  max-height: 100%;
  aspect-ratio: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-content: center;
  flex: 1;
}

.grid.is-strip {
  flex: none;
  display: flex;
  overflow-x: auto;
  gap: 8px;
}

.grid.is-strip :deep(.tile) {
  width: 180px;
  flex-shrink: 0;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px 20px;
}

.control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--interactive-active);
  transition: background-color var(--transition-fast);
}

.control:hover:not(:disabled) {
  background: var(--bg-modifier-selected);
}

.control.is-off {
  color: var(--red);
}

.control.is-live {
  background: var(--green);
  color: #fff;
}

.control.is-leave {
  background: var(--red);
  color: #fff;
}

.control.is-leave:hover {
  background: var(--red-hover);
}
</style>
