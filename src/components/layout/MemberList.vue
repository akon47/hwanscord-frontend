<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/api'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useUserMenu } from '@/composables/useUserMenu'
import UserAvatar from '@/components/users/UserAvatar.vue'

const props = defineProps<{
  /** restrict to these user ids (DM channel) */
  only?: string[]
}>()

const users = useUsersStore()
const ui = useUiStore()
const userMenu = useUserMenu()

const filter = (list: User[]) => (props.only ? list.filter((u) => props.only!.includes(u.id)) : list)
const online = computed(() => filter(users.online))
const offline = computed(() => filter(users.offline))

function openProfile(event: MouseEvent, user: User) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  ui.openProfile(user.id, { x: rect.left - 8, y: rect.top }, 'left')
}

function onContextMenu(event: MouseEvent, user: User) {
  ui.openContextMenu(event, userMenu.itemsFor(user.id, { anchor: { x: event.clientX - 300, y: event.clientY } }))
}
</script>

<template>
  <aside class="members scroller-thin" aria-label="멤버 목록">
    <template v-if="online.length">
      <h3 class="group-title">온라인 — {{ online.length }}</h3>
      <button
        v-for="user in online"
        :key="user.id"
        type="button"
        class="member"
        @click="openProfile($event, user)"
        @contextmenu="onContextMenu($event, user)"
      >
        <UserAvatar
          :user-id="user.id"
          :display-name="user.displayName"
          :avatar-url="user.avatarUrl"
          :presence="user.presence"
          :size="32"
        />
        <span class="member-text">
          <span class="member-name truncate">
            {{ user.displayName }}
            <span v-if="user.role === 'admin'" class="role">관리자</span>
          </span>
          <span v-if="user.customStatus" class="member-status truncate">{{ user.customStatus }}</span>
        </span>
      </button>
    </template>
    <template v-if="offline.length">
      <h3 class="group-title">오프라인 — {{ offline.length }}</h3>
      <button
        v-for="user in offline"
        :key="user.id"
        type="button"
        class="member is-offline"
        @click="openProfile($event, user)"
        @contextmenu="onContextMenu($event, user)"
      >
        <UserAvatar
          :user-id="user.id"
          :display-name="user.displayName"
          :avatar-url="user.avatarUrl"
          presence="offline"
          :size="32"
        />
        <span class="member-text">
          <span class="member-name truncate">
            {{ user.displayName }}
            <span v-if="user.role === 'admin'" class="role">관리자</span>
          </span>
        </span>
      </button>
    </template>
  </aside>
</template>

<style scoped>
.members {
  width: var(--members-w);
  min-width: var(--members-w);
  height: 100%;
  padding: 16px 8px;
  overflow-y: auto;
  background: var(--bg-secondary);
}

.group-title {
  padding: 16px 8px 4px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.group-title:first-child {
  padding-top: 0;
}

.member {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 42px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.member:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
}

.member.is-offline {
  opacity: 0.45;
}

.member.is-offline:hover {
  opacity: 1;
}

.member-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.member-name {
  font-weight: 500;
}

.role {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--brand);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  vertical-align: middle;
}

.member-status {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}
</style>
