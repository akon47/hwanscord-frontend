<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore, type SettingsTab } from '@/stores/ui'
import { stopSession } from '@/realtime/session'
import BaseModal from '@/components/common/BaseModal.vue'
import AccountSettings from './AccountSettings.vue'
import ProfileSettings from './ProfileSettings.vue'
import VoiceSettings from './VoiceSettings.vue'
import NotificationSettings from './NotificationSettings.vue'
import AppearanceSettings from './AppearanceSettings.vue'
import AdminSettings from './AdminSettings.vue'

const ui = useUiStore()
const auth = useAuthStore()
const router = useRouter()

const version = import.meta.env.VITE_APP_VERSION ?? 'dev'

const tabs = computed(() => {
  const list: { id: SettingsTab; label: string; group: string }[] = [
    { id: 'account', label: '내 계정', group: '사용자 설정' },
    { id: 'profile', label: '프로필 상태', group: '사용자 설정' },
    { id: 'voice', label: '음성 및 비디오', group: '앱 설정' },
    { id: 'notifications', label: '알림', group: '앱 설정' },
    { id: 'appearance', label: '모양', group: '앱 설정' },
  ]
  if (auth.isAdmin) list.push({ id: 'admin', label: '관리', group: '서버 관리' })
  return list
})

const groups = computed(() => [...new Set(tabs.value.map((t) => t.group))])

const components = {
  account: AccountSettings,
  profile: ProfileSettings,
  voice: VoiceSettings,
  notifications: NotificationSettings,
  appearance: AppearanceSettings,
  admin: AdminSettings,
} as const

async function logout() {
  const ok = await ui.askConfirm({ title: '로그아웃', message: '정말 로그아웃할까요?', confirmLabel: '로그아웃', danger: true })
  if (!ok) return
  ui.closeSettings()
  stopSession()
  auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <BaseModal size="full" title="사용자 설정" @close="ui.closeSettings()">
    <div class="settings">
      <nav class="side scroller-thin" aria-label="설정 메뉴">
        <div class="side-inner">
          <template v-for="group in groups" :key="group">
            <h3 class="group">{{ group }}</h3>
            <button
              v-for="tab in tabs.filter((t) => t.group === group)"
              :key="tab.id"
              type="button"
              class="tab"
              :class="{ 'is-active': ui.settingsTab === tab.id }"
              @click="ui.settingsTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </template>
          <div class="sep" />
          <button type="button" class="tab is-danger" @click="logout">
            로그아웃 <LogOut :size="16" />
          </button>
          <p class="version">HWANSCORD {{ version }}</p>
        </div>
      </nav>
      <main class="content scroller-thin">
        <div class="content-inner">
          <component :is="components[ui.settingsTab]" />
        </div>
        <div class="close-col">
          <button type="button" class="close" aria-label="설정 닫기" @click="ui.closeSettings()">
            <X :size="20" />
          </button>
          <span class="esc">ESC</span>
        </div>
      </main>
    </div>
  </BaseModal>
</template>

<style scoped>
.settings {
  display: flex;
  height: 100%;
}

.side {
  display: flex;
  justify-content: flex-end;
  flex: 1 0 218px;
  background: var(--bg-secondary);
  overflow-y: auto;
}

.side-inner {
  width: 218px;
  padding: 60px 6px 60px 20px;
}

.group {
  padding: 6px 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.group:not(:first-child) {
  margin-top: 12px;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 2px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--interactive-normal);
  font-weight: 500;
  text-align: left;
}

.tab:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
}

.tab.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.tab.is-danger {
  color: var(--red);
}

.sep {
  height: 1px;
  margin: 8px 10px;
  background: var(--divider);
}

.version {
  padding: 8px 10px;
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

.content {
  display: flex;
  flex: 1 1 800px;
  background: var(--bg-primary);
  overflow-y: auto;
}

.content-inner {
  flex: 1;
  max-width: 740px;
  padding: 60px 40px 80px;
}

.close-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 60px;
  width: 72px;
  flex-shrink: 0;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--interactive-normal);
  color: var(--interactive-normal);
}

.close:hover {
  border-color: var(--interactive-hover);
  color: var(--interactive-hover);
}

.esc {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
}

@media (max-width: 899px) {
  .settings {
    flex-direction: column;
  }

  .side {
    flex: none;
    justify-content: flex-start;
    max-height: 40%;
  }

  .side-inner {
    width: 100%;
    padding: 16px;
  }

  .content-inner {
    padding: 16px;
  }

  .close-col {
    position: absolute;
    top: 8px;
    right: 0;
    padding-top: 0;
  }
}
</style>
