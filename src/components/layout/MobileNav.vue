<script setup lang="ts">
import { Hash, MessageSquare, Users } from '@lucide/vue'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore, type MobileTab } from '@/stores/ui'

const ui = useUiStore()
const readStates = useReadStatesStore()

const tabs: { id: MobileTab; label: string; icon: typeof Hash }[] = [
  { id: 'channels', label: '채널', icon: Hash },
  { id: 'chat', label: '채팅', icon: MessageSquare },
  { id: 'members', label: '멤버', icon: Users },
]
</script>

<template>
  <nav class="mobile-nav" aria-label="모바일 탐색">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="tab"
      :class="{ 'is-active': ui.mobileTab === tab.id }"
      :aria-current="ui.mobileTab === tab.id ? 'page' : undefined"
      @click="ui.setMobileTab(tab.id)"
    >
      <span class="tab-icon">
        <component :is="tab.icon" :size="22" />
        <span v-if="tab.id === 'channels' && readStates.totalMentions > 0" class="badge">{{ readStates.totalMentions }}</span>
      </span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.mobile-nav {
  display: flex;
  height: var(--mobile-nav-h);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--divider-strong);
}

.tab {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.tab.is-active {
  color: var(--header-primary);
}

.tab-icon {
  position: relative;
  display: inline-flex;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
</style>
