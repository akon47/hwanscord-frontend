<script setup lang="ts">
import { computed } from 'vue'
import { Hash, Settings } from '@lucide/vue'
import type { Channel } from '@/api'
import { useChannelsStore } from '@/stores/channels'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { useChannelMenu } from '@/composables/useChannelMenu'

const props = defineProps<{ channel: Channel; active: boolean }>()

const channels = useChannelsStore()
const readStates = useReadStatesStore()
const ui = useUiStore()
const menu = useChannelMenu()

const readState = computed(() => readStates.get(props.channel.id))
const unread = computed(() => readState.value.unreadCount > 0 && !props.active)
const mentions = computed(() => readState.value.mentionCount)
const canManage = computed(() => channels.canManage(props.channel))
</script>

<template>
  <RouterLink
    :to="`/channels/${channel.id}`"
    class="channel-item"
    :class="{ 'is-active': active, 'is-unread': unread }"
    @click="ui.setMobileTab('chat')"
    @contextmenu="ui.openContextMenu($event, menu.itemsFor(channel))"
  >
    <span v-if="unread" class="unread-pill" aria-hidden="true" />
    <Hash :size="20" class="channel-icon" />
    <span class="channel-name truncate">{{ channel.name }}</span>
    <span v-if="mentions > 0" class="mention-badge" :aria-label="`멘션 ${mentions}개`">{{ mentions > 99 ? '99+' : mentions }}</span>
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
  </RouterLink>
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
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.channel-item:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
  text-decoration: none;
}

.channel-item.is-unread {
  color: var(--header-primary);
}

.channel-item.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.unread-pill {
  position: absolute;
  left: -12px;
  top: 50%;
  width: 4px;
  height: 8px;
  border-radius: 0 4px 4px 0;
  background: var(--header-primary);
  transform: translateY(-50%);
}

.channel-icon {
  flex-shrink: 0;
  color: var(--text-faint);
}

.channel-name {
  flex: 1;
  min-width: 0;
}

.mention-badge {
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.channel-action {
  display: none;
  color: var(--interactive-normal);
  border-radius: var(--radius-sm);
}

.channel-item:hover .channel-action,
.channel-item.is-active .channel-action {
  display: inline-flex;
}

.channel-action:hover {
  color: var(--interactive-hover);
}
</style>
