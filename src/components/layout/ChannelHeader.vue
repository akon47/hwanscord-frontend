<script setup lang="ts">
import { computed, ref } from 'vue'
import { AtSign, Hash, Menu, Pin, Search, Users, Volume2, X } from '@lucide/vue'
import type { Channel } from '@/api'
import { useUiStore } from '@/stores/ui'
import PinnedPopover from '@/components/chat/PinnedPopover.vue'

const props = withDefaults(
  defineProps<{ channel: Channel | null; title?: string; subtitle?: string; showSearch?: boolean }>(),
  { title: undefined, subtitle: undefined, showSearch: true },
)

const ui = useUiStore()
const query = ref(ui.searchQuery)

const icon = computed(() => {
  if (!props.channel) return AtSign
  if (props.channel.type === 'voice') return Volume2
  if (props.channel.type === 'dm') return AtSign
  return Hash
})

function submitSearch() {
  const q = query.value.trim()
  if (!q) return
  ui.openSearch(q)
}

function clearSearch() {
  query.value = ''
  ui.searchQuery = ''
  ui.closeSearch()
}
</script>

<template>
  <header class="channel-header">
    <button type="button" class="icon-btn mobile-only" aria-label="채널 목록" @click="ui.setMobileTab('channels')">
      <Menu :size="22" />
    </button>
    <component :is="icon" :size="22" class="header-icon" />
    <div class="header-text">
      <h2 class="header-title truncate">{{ title ?? channel?.name ?? '' }}</h2>
      <template v-if="subtitle ?? channel?.topic">
        <span class="header-divider" aria-hidden="true" />
        <p class="header-topic truncate" :title="subtitle ?? channel?.topic ?? ''">{{ subtitle ?? channel?.topic }}</p>
      </template>
    </div>
    <div class="header-actions">
      <slot name="actions" />
      <div v-if="channel && channel.type !== 'voice'" class="pins-wrap">
        <button
          v-tooltip.bottom="'고정된 메시지'"
          type="button"
          class="icon-btn"
          :class="{ 'is-active': ui.pinsOpen }"
          aria-label="고정된 메시지"
          @click="ui.pinsOpen = !ui.pinsOpen"
        >
          <Pin :size="20" />
        </button>
        <PinnedPopover v-if="ui.pinsOpen" :channel-id="channel.id" @close="ui.pinsOpen = false" />
      </div>
      <button
        v-if="channel?.type !== 'voice'"
        v-tooltip.bottom="ui.memberListVisible ? '멤버 목록 숨기기' : '멤버 목록 표시'"
        type="button"
        class="icon-btn desktop-only"
        :class="{ 'is-active': ui.memberListVisible }"
        aria-label="멤버 목록 전환"
        @click="ui.toggleMemberList()"
      >
        <Users :size="20" />
      </button>
      <form v-if="showSearch" class="search desktop-only" role="search" @submit.prevent="submitSearch">
        <input
          v-model="query"
          type="search"
          class="search-input"
          placeholder="검색"
          aria-label="메시지 검색"
          @focus="query || (query = ui.searchQuery)"
        />
        <button v-if="query" type="button" class="search-clear" aria-label="검색 지우기" @click="clearSearch">
          <X :size="14" />
        </button>
        <Search v-else :size="16" class="search-icon" />
      </form>
    </div>
  </header>
</template>

<style scoped>
.channel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--header-h);
  padding: 0 8px 0 16px;
  box-shadow: var(--shadow-low);
  flex-shrink: 0;
  z-index: 1;
}

.header-icon {
  flex-shrink: 0;
  color: var(--text-faint);
}

.header-text {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
  flex-shrink: 0;
  max-width: 50%;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--divider);
}

.header-topic {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pins-wrap {
  position: relative;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.search-input {
  width: 144px;
  height: 28px;
  padding: 0 28px 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-normal);
  font-size: var(--font-size-sm);
  transition: width var(--transition-normal);
}

.search-input:focus {
  width: 240px;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.search-icon,
.search-clear {
  position: absolute;
  right: 8px;
  color: var(--text-muted);
  display: inline-flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 899px) {
  .mobile-only {
    display: inline-flex;
  }

  .desktop-only {
    display: none;
  }

  .channel-header {
    padding-left: 8px;
  }
}
</style>
