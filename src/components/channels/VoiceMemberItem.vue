<script setup lang="ts">
import { computed } from 'vue'
import { HeadphoneOff, MicOff, MonitorUp } from '@lucide/vue'
import type { Channel, VoiceMember } from '@/api'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import { useUserMenu } from '@/composables/useUserMenu'
import UserAvatar from '@/components/users/UserAvatar.vue'

const props = defineProps<{ member: VoiceMember; channel: Channel }>()

const users = useUsersStore()
const voice = useVoiceStore()
const ui = useUiStore()
const userMenu = useUserMenu()

const user = computed(() => users.get(props.member.userId))
const name = computed(() => user.value?.displayName ?? '알 수 없는 사용자')
const speaking = computed(() => voice.isSpeaking(props.member.socketId))
const isMe = computed(() => props.member.socketId === voice.mySocketId)

function onContextMenu(event: MouseEvent) {
  ui.openContextMenu(event, userMenu.itemsFor(props.member.userId, { voiceMember: props.member }))
}

function onClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  ui.openProfile(props.member.userId, { x: rect.right + 8, y: rect.top }, 'right')
}
</script>

<template>
  <li>
    <button type="button" class="member" :class="{ 'is-me': isMe }" @click="onClick" @contextmenu="onContextMenu">
      <UserAvatar
        :user-id="member.userId"
        :display-name="name"
        :avatar-url="user?.avatarUrl"
        :size="24"
        :speaking="speaking"
      />
      <span class="name truncate">{{ name }}</span>
      <span class="icons">
        <span v-if="member.streaming" class="live" aria-label="화면 공유 중">LIVE</span>
        <MonitorUp v-if="member.streaming" :size="14" aria-hidden="true" />
        <HeadphoneOff v-if="member.deafened" :size="14" aria-label="헤드셋 음소거" />
        <MicOff v-else-if="member.muted" :size="14" aria-label="마이크 음소거" />
      </span>
    </button>
  </li>
</template>

<style scoped>
.member {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
  transition: background-color var(--transition-fast);
}

.member:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
}

.member.is-me {
  color: var(--text-normal);
}

.name {
  flex: 1;
  min-width: 0;
}

.icons {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-faint);
}

.live {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 14px;
}
</style>
