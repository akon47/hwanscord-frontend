<script setup lang="ts">
import { computed, ref } from 'vue'
import { Headphones, HeadphoneOff, Mic, MicOff, Settings } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useVoiceStore } from '@/stores/voice'
import UserAvatar from '@/components/users/UserAvatar.vue'
import StatusPicker from './StatusPicker.vue'

const auth = useAuthStore()
const voice = useVoiceStore()
const ui = useUiStore()

const pickerOpen = ref(false)
const anchor = ref<HTMLElement | null>(null)

const presence = computed(() => {
  const status = auth.user?.status ?? 'online'
  return status === 'invisible' ? 'offline' : status
})

const subtitle = computed(() => auth.user?.customStatus || `@${auth.user?.username ?? ''}`)
</script>

<template>
  <footer class="user-panel">
    <button
      ref="anchor"
      type="button"
      class="me"
      aria-haspopup="menu"
      :aria-expanded="pickerOpen"
      @click="pickerOpen = !pickerOpen"
    >
      <UserAvatar
        v-if="auth.user"
        :user-id="auth.user.id"
        :display-name="auth.user.displayName"
        :avatar-url="auth.user.avatarUrl"
        :presence="presence"
        :size="32"
        :speaking="voice.mySocketId ? voice.isSpeaking(voice.mySocketId) : false"
      />
      <span class="me-text">
        <span class="me-name truncate">{{ auth.user?.displayName }}</span>
        <span class="me-sub truncate">{{ subtitle }}</span>
      </span>
    </button>
    <div class="controls">
      <button
        v-tooltip="voice.muted ? '마이크 음소거 해제' : '마이크 음소거'"
        type="button"
        class="icon-btn"
        :class="{ 'is-danger': voice.muted }"
        :aria-pressed="voice.muted"
        aria-label="마이크 음소거"
        @click="voice.toggleMute()"
      >
        <component :is="voice.muted ? MicOff : Mic" :size="20" />
      </button>
      <button
        v-tooltip="voice.deafened ? '헤드셋 음소거 해제' : '헤드셋 음소거'"
        type="button"
        class="icon-btn"
        :class="{ 'is-danger': voice.deafened }"
        :aria-pressed="voice.deafened"
        aria-label="헤드셋 음소거"
        @click="voice.toggleDeafen()"
      >
        <component :is="voice.deafened ? HeadphoneOff : Headphones" :size="20" />
      </button>
      <button v-tooltip="'사용자 설정'" type="button" class="icon-btn" aria-label="사용자 설정" @click="ui.openSettings()">
        <Settings :size="20" />
      </button>
    </div>
    <StatusPicker v-if="pickerOpen" :anchor="anchor" @close="pickerOpen = false" />
  </footer>
</template>

<style scoped>
.user-panel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--user-panel-h);
  padding: 0 8px;
  background: var(--bg-secondary-alt);
  flex-shrink: 0;
}

.me {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 40px;
  padding: 0 4px;
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.me:hover {
  background: var(--bg-modifier-hover);
}

.me-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.me-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--header-primary);
}

.me-sub {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.controls {
  display: flex;
  gap: 0;
}
</style>
