<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Hash, Pencil, Trash2, Volume2 } from '@lucide/vue'
import { rtcApi, type RtcUsage } from '@/api'
import { errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useChannelMenu } from '@/composables/useChannelMenu'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const channels = useChannelsStore()
const users = useUsersStore()
const ui = useUiStore()
const channelMenu = useChannelMenu()

const usage = ref<RtcUsage | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function loadUsage() {
  loading.value = true
  error.value = null
  try {
    usage.value = await rtcApi.fetchRtcUsage()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadUsage)

const ratio = computed(() => (usage.value && usage.value.budgetGB > 0 ? Math.min(1, usage.value.egressGB / usage.value.budgetGB) : 0))
const managed = computed(() => [...channels.textChannels, ...channels.voiceChannels])

function editChannel(id: string) {
  ui.closeSettings()
  ui.openEditChannel(id)
}
</script>

<template>
  <section>
    <h2 class="title">관리</h2>

    <h3 class="subtitle">TURN 릴레이 사용량 (Cloudflare Realtime)</h3>
    <div class="card">
      <LoadingSpinner v-if="loading" :size="24" />
      <p v-else-if="error" class="field-error">{{ error }}</p>
      <template v-else-if="usage">
        <div class="usage-row">
          <strong>{{ usage.month }}</strong>
          <span>{{ usage.egressGB.toFixed(2) }} GB / {{ usage.budgetGB }} GB</span>
        </div>
        <div class="bar" :class="{ 'is-warn': ratio > 0.75, 'is-over': ratio >= 1 }">
          <div class="bar-fill" :style="{ width: `${Math.round(ratio * 100)}%` }" />
        </div>
        <p class="hint">
          릴레이 상태:
          <strong :class="usage.relayEnabled ? 'ok' : 'off'">{{ usage.relayEnabled ? '사용 중' : '중지됨 (STUN만 사용)' }}</strong>
          — 무료 한도 1,000 GB를 넘지 않도록 예산({{ usage.budgetGB }} GB)을 넘으면 자동으로 릴레이 자격 증명 발급을 멈춥니다.
        </p>
        <button type="button" class="btn btn-secondary btn-sm" @click="loadUsage">새로 고침</button>
      </template>
    </div>

    <h3 class="subtitle">채널 ({{ managed.length }})</h3>
    <ul class="list">
      <li v-for="channel in managed" :key="channel.id" class="row">
        <component :is="channel.type === 'voice' ? Volume2 : Hash" :size="18" class="row-icon" />
        <span class="row-name truncate">{{ channel.name }}</span>
        <span class="row-meta text-muted">{{ channel.createdBy ? users.displayName(channel.createdBy) : '시스템' }}</span>
        <button type="button" class="icon-btn" aria-label="채널 편집" @click="editChannel(channel.id)"><Pencil :size="16" /></button>
        <button type="button" class="icon-btn is-danger" aria-label="채널 삭제" @click="channelMenu.remove(channel)">
          <Trash2 :size="16" />
        </button>
      </li>
    </ul>

    <h3 class="subtitle">멤버 ({{ users.all.length }})</h3>
    <p class="hint">처음 가입한 계정이 관리자입니다. 관리자는 모든 채널과 메시지를 삭제할 수 있어요.</p>
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
  margin: 28px 0 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.card {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.usage-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--header-primary);
}

.bar {
  height: 10px;
  border-radius: 5px;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--green);
}

.bar.is-warn .bar-fill {
  background: var(--yellow);
}

.bar.is-over .bar-fill {
  background: var(--red);
}

.hint {
  margin: 10px 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.5;
}

.ok {
  color: var(--green);
}

.off {
  color: var(--red);
}

.list {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--divider-strong);
}

.row:last-child {
  border-bottom: 0;
}

.row-icon {
  color: var(--text-faint);
}

.row-name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.row-meta {
  font-size: var(--font-size-sm);
}
</style>
