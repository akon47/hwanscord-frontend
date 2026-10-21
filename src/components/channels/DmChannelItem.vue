<script setup lang="ts">
import { computed } from 'vue'
import type { Channel } from '@/api'
import { useChannelsStore } from '@/stores/channels'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useChannelMenu } from '@/composables/useChannelMenu'
import UserAvatar from '@/components/users/UserAvatar.vue'

const props = defineProps<{ channel: Channel; active: boolean }>()

const channels = useChannelsStore()
const users = useUsersStore()
const readStates = useReadStatesStore()
const ui = useUiStore()
const menu = useChannelMenu()

const partnerId = computed(() => channels.dmPartnerId(props.channel))
const partner = computed(() => (partnerId.value ? users.get(partnerId.value) : undefined))
const name = computed(() => channels.displayName(props.channel))
const mentions = computed(() => readStates.get(props.channel.id).mentionCount)
</script>

<template>
  <RouterLink
    :to="`/channels/@me/${channel.id}`"
    class="dm-item"
    :class="{ 'is-active': active, 'is-unread': mentions > 0 && !active }"
    @click="ui.setMobileTab('chat')"
    @contextmenu="ui.openContextMenu($event, menu.itemsFor(channel))"
  >
    <UserAvatar
      :user-id="partnerId ?? channel.id"
      :display-name="name"
      :avatar-url="partner?.avatarUrl"
      :presence="partner?.presence ?? 'offline'"
      :size="32"
    />
    <span class="dm-text">
      <span class="dm-name truncate">{{ name }}</span>
      <span v-if="partner?.customStatus" class="dm-status truncate">{{ partner.customStatus }}</span>
    </span>
    <span v-if="mentions > 0" class="mention-badge">{{ mentions > 99 ? '99+' : mentions }}</span>
  </RouterLink>
</template>

<style scoped>
.dm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
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

.dm-item:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
  text-decoration: none;
}

.dm-item.is-unread {
  color: var(--header-primary);
}

.dm-item.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.dm-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.dm-status {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
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
</style>
