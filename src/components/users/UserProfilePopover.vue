<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { MessageSquare, Pencil } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useClickOutside } from '@/composables/useClickOutside'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { useUserMenu } from '@/composables/useUserMenu'
import { avatarColor } from '@/utils/color'
import { formatDate } from '@/utils/time'
import UserAvatar from './UserAvatar.vue'

const ui = useUiStore()
const users = useUsersStore()
const auth = useAuthStore()
const userMenu = useUserMenu()

const root = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})

useClickOutside(root, () => ui.closeProfile())
useEscapeKey(() => ui.closeProfile())

const user = computed(() => (ui.profilePopover ? users.get(ui.profilePopover.userId) : undefined))
const isMe = computed(() => user.value?.id === auth.userId)
const banner = computed(() => (user.value ? avatarColor(user.value.id) : 'var(--brand)'))

const PRESENCE_LABEL = { online: '온라인', idle: '자리 비움', dnd: '다른 용무 중', offline: '오프라인' } as const

async function place() {
  await nextTick()
  const state = ui.profilePopover
  const el = root.value
  if (!state || !el) return
  const rect = el.getBoundingClientRect()
  let left = state.side === 'left' ? state.x - rect.width : state.x
  left = Math.max(8, Math.min(left, window.innerWidth - rect.width - 8))
  const top = Math.max(8, Math.min(state.y, window.innerHeight - rect.height - 8))
  style.value = { left: `${left}px`, top: `${top}px` }
}

onMounted(place)
watch(() => ui.profilePopover, place)

function message() {
  if (!user.value) return
  const id = user.value.id
  ui.closeProfile()
  void userMenu.openDm(id)
}

function editProfile() {
  ui.closeProfile()
  ui.openSettings('account')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.profilePopover && user" ref="root" class="profile" role="dialog" :aria-label="`${user.displayName} 프로필`" :style="style">
      <div class="banner" :style="{ background: banner }" />
      <div class="avatar-wrap">
        <UserAvatar
          :user-id="user.id"
          :display-name="user.displayName"
          :avatar-url="user.avatarUrl"
          :presence="user.presence"
          :size="80"
        />
      </div>
      <div class="card">
        <h3 class="name">{{ user.displayName }}</h3>
        <p class="username">
          @{{ user.username }}
          <span v-if="user.role === 'admin'" class="role">관리자</span>
        </p>
        <p class="presence">{{ PRESENCE_LABEL[user.presence] }}</p>
        <p v-if="user.customStatus" class="custom">{{ user.customStatus }}</p>
        <div class="divider" />
        <template v-if="user.aboutMe">
          <h4 class="section">내 소개</h4>
          <p class="about">{{ user.aboutMe }}</p>
        </template>
        <h4 class="section">가입일</h4>
        <p class="since">{{ formatDate(user.createdAt) }}</p>
        <button v-if="isMe" type="button" class="btn btn-secondary action" @click="editProfile">
          <Pencil :size="16" /> 프로필 편집
        </button>
        <button v-else type="button" class="btn btn-primary action" @click="message">
          <MessageSquare :size="16" /> 메시지 보내기
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.profile {
  position: fixed;
  z-index: 3800;
  width: 300px;
  border-radius: var(--radius-md);
  background: var(--bg-floating);
  box-shadow: var(--shadow-high);
  overflow: hidden;
  animation: pop-in var(--transition-fast);
}

.banner {
  height: 60px;
}

.avatar-wrap {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px;
  border-radius: 50%;
  background: var(--bg-floating);
}

.avatar-wrap :deep(.status) {
  border-color: var(--bg-floating);
}

.card {
  margin: 52px 12px 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--header-primary);
}

.username {
  font-size: var(--font-size-sm);
  color: var(--text-normal);
}

.role {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--brand);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.presence {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.custom {
  margin-top: 8px;
  font-size: var(--font-size-sm);
}

.divider {
  height: 1px;
  margin: 12px 0;
  background: var(--divider);
}

.section {
  margin-top: 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--header-secondary);
}

.about,
.since {
  margin-top: 4px;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

.action {
  width: 100%;
  margin-top: 16px;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
