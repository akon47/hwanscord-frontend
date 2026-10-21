<script setup lang="ts">
import { computed } from 'vue'
import type { Presence } from '@/api'
import { avatarColor, initialOf } from '@/utils/color'

const props = withDefaults(
  defineProps<{
    userId: string
    displayName: string
    avatarUrl?: string | null
    presence?: Presence | null
    size?: number
    /** green ring while speaking (voice) */
    speaking?: boolean
    typing?: boolean
  }>(),
  { avatarUrl: null, presence: null, size: 32, speaking: false, typing: false },
)

const PRESENCE_LABEL: Record<Presence, string> = {
  online: '온라인',
  idle: '자리 비움',
  dnd: '다른 용무 중',
  offline: '오프라인',
}

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(10, props.size * 0.42)}px`,
  background: props.avatarUrl ? 'transparent' : avatarColor(props.userId),
}))

const dotSize = computed(() => Math.max(8, Math.round(props.size * 0.3)))
</script>

<template>
  <span
    class="avatar"
    :class="{ 'is-speaking': speaking }"
    :style="style"
    :title="presence ? PRESENCE_LABEL[presence] : undefined"
    role="img"
    :aria-label="displayName"
  >
    <img v-if="avatarUrl" :src="avatarUrl" alt="" class="avatar-img" loading="lazy" draggable="false" />
    <span v-else class="avatar-initial" aria-hidden="true">{{ initialOf(displayName) }}</span>
    <span
      v-if="presence"
      class="status"
      :class="`is-${presence}`"
      :style="{ width: `${dotSize}px`, height: `${dotSize}px` }"
      aria-hidden="true"
    >
      <span v-if="typing" class="typing-dots"><i /><i /><i /></span>
    </span>
  </span>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
  user-select: none;
  transition: box-shadow var(--transition-fast);
}

.is-speaking {
  box-shadow: 0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--green);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initial {
  line-height: 1;
}

.status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
  box-sizing: content-box;
  transform: translate(-10%, -10%);
}

.status.is-online {
  background: var(--green);
}

.status.is-idle {
  background: var(--yellow);
  /* crescent: mask a smaller circle out of the top-left */
  -webkit-mask: radial-gradient(circle at 30% 30%, transparent 0 38%, #000 40%);
  mask: radial-gradient(circle at 30% 30%, transparent 0 38%, #000 40%);
}

.status.is-dnd {
  background: var(--red);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
}

.status.is-dnd::after {
  content: '';
  width: 60%;
  height: 22%;
  min-height: 2px;
  border-radius: 1px;
  background: var(--bg-secondary);
}

.status.is-offline {
  background: var(--text-faint);
}

.status.is-offline::after {
  content: '';
  width: 42%;
  height: 42%;
  border-radius: 50%;
  background: var(--bg-secondary);
}

.typing-dots {
  display: flex;
  gap: 1px;
}

.typing-dots i {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1s infinite;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.3s;
}
</style>
