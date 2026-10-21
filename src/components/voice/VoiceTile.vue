<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Expand, HeadphoneOff, MicOff, Volume2 } from '@lucide/vue'
import type { VoiceMember } from '@/api'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import { avatarColor } from '@/utils/color'
import UserAvatar from '@/components/users/UserAvatar.vue'
import VideoStream from './VideoStream.vue'

const props = defineProps<{ member: VoiceMember; focused: boolean; small?: boolean }>()
const emit = defineEmits<{ focus: [] }>()

const users = useUsersStore()
const voice = useVoiceStore()
const videoRef = ref<InstanceType<typeof VideoStream> | null>(null)

const user = computed(() => users.get(props.member.userId))
const name = computed(() => user.value?.displayName ?? '알 수 없는 사용자')
const isMe = computed(() => props.member.socketId === voice.mySocketId)
const speaking = computed(() => voice.isSpeaking(props.member.socketId))

const stream = computed<MediaStream | null>(() => {
  if (!props.member.streaming) return null
  if (isMe.value) return voice.localScreenStream
  return voice.screenStreams[props.member.socketId] ?? null
})

const watching = computed(() => voice.watching === props.member.socketId)
const canWatch = computed(() => props.member.streaming && !isMe.value && !watching.value)

const volume = computed({
  get: () => Math.round(voice.volumeFor(props.member.userId) * 100),
  set: (value: number) => voice.setVolume(props.member.userId, value / 100),
})

function watch() {
  voice.watch(props.member.socketId)
  emit('focus')
}
</script>

<template>
  <div
    class="tile"
    :class="{ 'is-speaking': speaking, 'is-focused': focused, 'is-small': small, 'has-video': !!stream }"
    :style="{ '--tile-bg': avatarColor(member.userId) }"
    @click="emit('focus')"
  >
    <VideoStream v-if="stream" ref="videoRef" :stream="stream" class="tile-video" />
    <div v-else class="tile-avatar">
      <UserAvatar
        :user-id="member.userId"
        :display-name="name"
        :avatar-url="user?.avatarUrl"
        :size="small ? 48 : 80"
        :speaking="speaking"
      />
    </div>

    <button v-if="canWatch" type="button" class="watch" @click.stop="watch">
      <Eye :size="18" /> 시청하기
    </button>
    <p v-else-if="member.streaming && !stream && !isMe" class="waiting">화면을 불러오는 중…</p>

    <div class="label">
      <span v-if="member.streaming" class="live">LIVE</span>
      <span class="name truncate">{{ name }}{{ isMe ? ' (나)' : '' }}</span>
      <HeadphoneOff v-if="member.deafened" :size="14" aria-label="헤드셋 음소거" />
      <MicOff v-else-if="member.muted" :size="14" aria-label="마이크 음소거" />
    </div>

    <div class="controls" @click.stop>
      <label v-if="!isMe" class="volume" :title="`음량 ${volume}%`">
        <Volume2 :size="14" />
        <input v-model.number="volume" type="range" min="0" max="200" step="5" aria-label="사용자 음량" />
      </label>
      <button v-if="stream" type="button" class="icon-btn" aria-label="전체 화면" @click="videoRef?.fullscreen()">
        <Expand :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--tile-bg) 35%, var(--bg-tertiary));
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}

.tile.has-video {
  background: #000;
}

.tile.is-speaking {
  box-shadow: inset 0 0 0 3px var(--green);
}

.tile-video {
  position: absolute;
  inset: 0;
}

.tile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.watch {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 600;
}

.watch:hover {
  background: rgba(0, 0, 0, 0.8);
}

.waiting {
  position: absolute;
  bottom: 44px;
  color: #fff;
  font-size: var(--font-size-sm);
  text-shadow: 0 1px 2px #000;
}

.label {
  position: absolute;
  left: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 16px);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.live {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--red);
  font-size: 10px;
  font-weight: 800;
}

.controls {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: none;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}

.controls .icon-btn {
  color: #fff;
}

.tile:hover .controls,
.tile:focus-within .controls {
  display: flex;
}

.volume {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.volume input {
  width: 90px;
  accent-color: var(--brand);
}

.is-small .label {
  font-size: var(--font-size-xs);
}

.is-small .controls {
  display: none !important;
}
</style>
