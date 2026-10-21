<script setup lang="ts">
import { computed, ref } from 'vue'
import { MessageSquare, Search, Users } from '@lucide/vue'
import type { User } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useUserMenu } from '@/composables/useUserMenu'
import ChannelHeader from '@/components/layout/ChannelHeader.vue'
import UserAvatar from '@/components/users/UserAvatar.vue'

const users = useUsersStore()
const auth = useAuthStore()
const ui = useUiStore()
const userMenu = useUserMenu()

const tab = ref<'online' | 'all'>('online')
const query = ref('')

const PRESENCE_LABEL = { online: '온라인', idle: '자리 비움', dnd: '다른 용무 중', offline: '오프라인' } as const

const list = computed(() => {
  const base = (tab.value === 'online' ? users.online : users.all).filter((u) => u.id !== auth.userId)
  const q = query.value.trim().toLowerCase()
  if (!q) return base
  return base.filter((u) => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
})

function openProfile(event: MouseEvent, user: User) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  ui.openProfile(user.id, { x: rect.left + 60, y: rect.top }, 'right')
}
</script>

<template>
  <section class="home">
    <ChannelHeader :channel="null" title="친구" :show-search="false">
      <template #actions>
        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tab" :class="{ 'is-active': tab === 'online' }" :aria-selected="tab === 'online'" @click="tab = 'online'">
            온라인
          </button>
          <button type="button" role="tab" class="tab" :class="{ 'is-active': tab === 'all' }" :aria-selected="tab === 'all'" @click="tab = 'all'">
            모두
          </button>
        </div>
      </template>
    </ChannelHeader>
    <div class="body scroller-thin">
      <label class="search">
        <input v-model="query" type="search" class="search-input" placeholder="검색하기" aria-label="멤버 검색" />
        <Search :size="18" class="search-icon" />
      </label>
      <h3 class="count">{{ tab === 'online' ? '온라인' : '모든 멤버' }} — {{ list.length }}명</h3>
      <div v-if="list.length === 0" class="empty">
        <Users :size="48" />
        <p>{{ tab === 'online' ? '지금은 온라인인 친구가 없어요.' : '아직 다른 멤버가 없어요.' }}</p>
      </div>
      <ul class="people">
        <li v-for="user in list" :key="user.id" class="person" @click="openProfile($event, user)">
          <UserAvatar
            :user-id="user.id"
            :display-name="user.displayName"
            :avatar-url="user.avatarUrl"
            :presence="user.presence"
            :size="36"
          />
          <span class="person-text">
            <strong class="truncate">{{ user.displayName }} <small class="text-muted">@{{ user.username }}</small></strong>
            <span class="text-muted truncate">{{ user.customStatus || PRESENCE_LABEL[user.presence] }}</span>
          </span>
          <button
            v-tooltip="'메시지 보내기'"
            type="button"
            class="round"
            aria-label="메시지 보내기"
            @click.stop="userMenu.openDm(user.id)"
          >
            <MessageSquare :size="18" />
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--bg-primary);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-right: 8px;
}

.tab {
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  color: var(--interactive-normal);
  font-weight: 500;
}

.tab:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
}

.tab.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.search {
  position: relative;
  display: block;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-normal);
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 9px;
  color: var(--text-muted);
}

.count {
  margin: 20px 0 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--text-muted);
}

.person {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 62px;
  padding: 0 10px;
  border-top: 1px solid var(--divider);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.person:hover {
  background: var(--bg-modifier-hover);
  border-top-color: transparent;
}

.person-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.person-text strong {
  color: var(--header-primary);
}

.person-text small {
  font-weight: 400;
}

.person-text .text-muted {
  font-size: var(--font-size-sm);
}

.round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--interactive-normal);
}

.round:hover {
  color: var(--interactive-hover);
}
</style>
