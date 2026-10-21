<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Hash, Home, Plus, Volume2 } from '@lucide/vue'
import { useChannelsStore } from '@/stores/channels'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import ChannelCategory from '@/components/channels/ChannelCategory.vue'
import TextChannelItem from '@/components/channels/TextChannelItem.vue'
import VoiceChannelItem from '@/components/channels/VoiceChannelItem.vue'
import DmChannelItem from '@/components/channels/DmChannelItem.vue'
import VoicePanel from './VoicePanel.vue'
import UserPanel from './UserPanel.vue'

const channels = useChannelsStore()
const readStates = useReadStatesStore()
const users = useUsersStore()
const voice = useVoiceStore()
const ui = useUiStore()
const route = useRoute()

const activeChannelId = computed(() => (typeof route.params.channelId === 'string' ? route.params.channelId : null))
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <aside class="sidebar" aria-label="채널 목록">
    <header class="sidebar-header">
      <h1 class="brand">HWANSCORD</h1>
      <span class="online-count" :title="`온라인 ${users.onlineCount}명`">
        <span class="dot" />{{ users.onlineCount }}
      </span>
    </header>

    <nav class="sidebar-scroll scroller-thin">
      <RouterLink
        to="/channels/@me"
        class="home-link"
        :class="{ 'is-active': isHome }"
        @click="ui.setMobileTab('chat')"
      >
        <Home :size="20" />
        <span>홈</span>
        <span v-if="readStates.dmUnreadTotal > 0" class="badge">{{ readStates.dmUnreadTotal }}</span>
      </RouterLink>

      <ChannelCategory
        v-if="channels.dmChannels.length"
        label="다이렉트 메시지"
        storage-key="dm"
        :count="channels.dmChannels.length"
      >
        <DmChannelItem
          v-for="channel in channels.dmChannels"
          :key="channel.id"
          :channel="channel"
          :active="activeChannelId === channel.id"
        />
      </ChannelCategory>

      <ChannelCategory label="채팅 채널" storage-key="text" :count="channels.textChannels.length">
        <template #action>
          <button
            v-tooltip="'채널 만들기'"
            type="button"
            class="category-action"
            aria-label="채팅 채널 만들기"
            @click.stop="ui.openCreateChannel('text')"
          >
            <Plus :size="18" />
          </button>
        </template>
        <TextChannelItem
          v-for="channel in channels.textChannels"
          :key="channel.id"
          :channel="channel"
          :active="activeChannelId === channel.id"
        />
        <p v-if="channels.textChannels.length === 0" class="empty">
          <Hash :size="14" /> 아직 채널이 없어요
        </p>
      </ChannelCategory>

      <ChannelCategory label="음성 채널" storage-key="voice" :count="channels.voiceChannels.length">
        <template #action>
          <button
            v-tooltip="'채널 만들기'"
            type="button"
            class="category-action"
            aria-label="음성 채널 만들기"
            @click.stop="ui.openCreateChannel('voice')"
          >
            <Plus :size="18" />
          </button>
        </template>
        <VoiceChannelItem
          v-for="channel in channels.voiceChannels"
          :key="channel.id"
          :channel="channel"
          :active="activeChannelId === channel.id"
        />
        <p v-if="channels.voiceChannels.length === 0" class="empty">
          <Volume2 :size="14" /> 아직 채널이 없어요
        </p>
      </ChannelCategory>
    </nav>

    <VoicePanel v-if="voice.isConnected || voice.connecting" />
    <UserPanel />
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  height: 100%;
  background: var(--bg-secondary);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 16px;
  box-shadow: var(--shadow-low);
  flex-shrink: 0;
}

.brand {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--header-primary);
}

.online-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 8px 12px;
}

.home-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  margin-bottom: 4px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  color: var(--interactive-normal);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.home-link:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
  text-decoration: none;
}

.home-link.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.badge {
  margin-left: auto;
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--red);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.category-action {
  display: inline-flex;
  color: var(--interactive-normal);
  border-radius: var(--radius-sm);
}

.category-action:hover {
  color: var(--interactive-hover);
}

.empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  color: var(--text-faint);
  font-size: var(--font-size-sm);
}
</style>
