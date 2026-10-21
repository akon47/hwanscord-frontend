<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Volume2 } from '@lucide/vue'
import type { Channel } from '@/api'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import { useVoiceStore } from '@/stores/voice'
import { useChannelMenu } from '@/composables/useChannelMenu'
import VoiceMemberItem from './VoiceMemberItem.vue'

const props = defineProps<{ channel: Channel; active: boolean }>()

const channels = useChannelsStore()
const voice = useVoiceStore()
const ui = useUiStore()
const router = useRouter()
const menu = useChannelMenu()

const members = computed(() => voice.membersOf(props.channel.id))
const joined = computed(() => voice.currentChannelId === props.channel.id)
const canManage = computed(() => channels.canManage(props.channel))

async function onClick() {
  ui.setMobileTab('chat')
  await router.push(`/channels/${props.channel.id}`)
  if (!joined.value && !voice.connecting) {
    try {
      await voice.join(props.channel.id)
    } catch {
      // toast shown by the store
    }
  }
}
</script>

<template>
  <div class="voice-channel">
    <a
      href="#"
      class="channel-item"
      :class="{ 'is-active': active || joined }"
      @click.prevent="onClick"
      @contextmenu="ui.openContextMenu($event, menu.itemsFor(channel))"
    >
      <Volume2 :size="20" class="channel-icon" />
      <span class="channel-name truncate">{{ channel.name }}</span>
      <span v-if="members.length" class="count" :aria-label="`${members.length}명 참여 중`">{{ members.length }}</span>
      <button
        v-if="canManage"
        v-tooltip="'채널 편집'"
        type="button"
        class="channel-action"
        aria-label="채널 편집"
        @click.prevent.stop="ui.openEditChannel(channel.id)"
      >
        <Settings :size="16" />
      </button>
    </a>
    <ul v-if="members.length" class="members">
      <VoiceMemberItem v-for="member in members" :key="member.socketId" :member="member" :channel="channel" />
    </ul>
  </div>
</template>

<style scoped>
.channel-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  margin-left: 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.channel-item:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
  text-decoration: none;
}

.channel-item.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.channel-icon {
  flex-shrink: 0;
  color: var(--text-faint);
}

.channel-name {
  flex: 1;
  min-width: 0;
}

.count {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

.channel-action {
  display: none;
  color: var(--interactive-normal);
}

.channel-item:hover .channel-action {
  display: inline-flex;
}

.members {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 1px 0 2px 28px;
}
</style>
