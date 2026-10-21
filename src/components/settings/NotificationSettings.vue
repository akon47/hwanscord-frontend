<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { notificationPermission, requestNotificationPermission } from '@/utils/notify'
import { sounds } from '@/utils/sounds'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'

const settings = useSettingsStore()
const ui = useUiStore()
const permission = ref(notificationPermission())

const soundsOn = computed({
  get: () => settings.settings.sounds,
  set: (value: boolean) => settings.update({ sounds: value }),
})

const volume = computed({
  get: () => Math.round(settings.settings.soundVolume * 100),
  set: (value: number) => settings.update({ soundVolume: value / 100 }),
})

const desktop = computed({
  get: () => settings.settings.desktopNotifications && permission.value === 'granted',
  set: async (value: boolean) => {
    if (value) {
      permission.value = await requestNotificationPermission()
      if (permission.value !== 'granted') {
        ui.toast('브라우저에서 알림 권한을 허용해 주세요.', 'error')
        settings.update({ desktopNotifications: false })
        return
      }
    }
    settings.update({ desktopNotifications: value })
  },
})

const allMessages = computed({
  get: () => settings.settings.notifyAllMessages,
  set: (value: boolean) => settings.update({ notifyAllMessages: value }),
})

function preview() {
  sounds.mention(settings.effectiveSoundVolume)
}
</script>

<template>
  <section>
    <h2 class="title">알림</h2>
    <ToggleSwitch
      v-model="desktop"
      label="데스크톱 알림 사용"
      :description="
        permission === 'unsupported'
          ? '이 브라우저는 데스크톱 알림을 지원하지 않아요.'
          : permission === 'denied'
            ? '브라우저 설정에서 알림이 차단되어 있어요.'
            : '창을 보고 있지 않을 때 멘션과 DM을 알려 드려요.'
      "
      :disabled="permission === 'unsupported' || permission === 'denied'"
    />
    <ToggleSwitch v-model="allMessages" label="모든 메시지 알림" description="꺼 두면 멘션과 DM만 알려 드려요." />

    <h3 class="subtitle">소리</h3>
    <ToggleSwitch v-model="soundsOn" label="알림 소리" description="새 메시지, 멘션, 음소거 효과음을 재생합니다." />
    <label class="field">
      <span class="label">효과음 음량 — {{ volume }}%</span>
      <span class="volume-row">
        <input v-model.number="volume" type="range" min="0" max="100" step="5" class="range" :disabled="!soundsOn" />
        <button type="button" class="btn btn-secondary btn-sm" :disabled="!soundsOn" @click="preview">미리 듣기</button>
      </span>
    </label>
  </section>
</template>

<style scoped>
.title {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--header-primary);
}

.subtitle {
  margin: 32px 0 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.field {
  display: block;
  margin-top: 12px;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range {
  flex: 1;
  accent-color: var(--brand);
}
</style>
