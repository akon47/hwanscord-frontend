<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, Hash, KeyRound, Pencil, Trash2, Volume2 } from '@lucide/vue'
import { adminApi, rtcApi, type AdminUser, type RtcUsage } from '@/api'
import { errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useChannelMenu } from '@/composables/useChannelMenu'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UserAvatar from '@/components/users/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { maskEmail } from '@/utils/account'

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

const auth = useAuthStore()
const members = ref<AdminUser[]>([])
const membersLoading = ref(true)
const membersError = ref<string | null>(null)
/** shown once, until closed; never stored */
const issued = ref<{ user: AdminUser; password: string } | null>(null)
const issuingId = ref<string | null>(null)

async function loadMembers() {
  membersLoading.value = true
  membersError.value = null
  try {
    members.value = (await adminApi.fetchAdminUsers()).users
  } catch (e) {
    membersError.value = errorMessage(e)
  } finally {
    membersLoading.value = false
  }
}

async function issueTemporaryPassword(user: AdminUser) {
  const ok = await ui.askConfirm({
    title: '임시 비밀번호 발급',
    message: `${user.displayName}(@${user.username})의 비밀번호를 임시 비밀번호로 바꿀까요? 그 사용자의 모든 로그인이 해제돼요.`,
    confirmLabel: '발급',
    danger: true,
  })
  if (!ok) return
  issuingId.value = user.id
  try {
    const { temporaryPassword } = await adminApi.issueTemporaryPassword(user.id)
    issued.value = { user, password: temporaryPassword }
    await loadMembers()
  } catch (e) {
    ui.toast(errorMessage(e), 'error')
  } finally {
    issuingId.value = null
  }
}

async function copyIssued() {
  if (!issued.value) return
  try {
    await navigator.clipboard.writeText(issued.value.password)
    ui.toast('임시 비밀번호를 복사했어요.', 'success', 2000)
  } catch {
    ui.toast('복사하지 못했어요. 직접 선택해서 복사해 주세요.', 'error')
  }
}

onMounted(() => {
  void loadUsage()
  void loadMembers()
})

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

    <h3 class="subtitle">멤버 ({{ members.length || users.all.length }})</h3>
    <p class="hint">
      관리자는 모든 채널과 메시지를 삭제할 수 있어요. 이메일이 없어 비밀번호를 찾을 수 없는 멤버에게는 임시 비밀번호를
      발급해 주세요. 발급하면 그 멤버의 모든 로그인이 해제돼요.
    </p>

    <div v-if="issued" class="issued" role="status">
      <p>
        <strong>{{ issued.user.displayName }}</strong>(@{{ issued.user.username }})의 임시 비밀번호예요. 이 창을 닫으면 다시 볼 수
        없어요.
      </p>
      <div class="issued-row">
        <code class="issued-password" data-testid="temporary-password">{{ issued.password }}</code>
        <button type="button" class="btn btn-secondary btn-sm" @click="copyIssued"><Copy :size="14" /> 복사</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="issued = null">닫기</button>
      </div>
      <p class="hint">로그인한 뒤 설정 → 내 계정에서 비밀번호를 바꾸라고 알려 주세요.</p>
    </div>

    <LoadingSpinner v-if="membersLoading" :size="24" />
    <p v-else-if="membersError" class="field-error">{{ membersError }}</p>
    <ul v-else class="list">
      <li v-for="member in members" :key="member.id" class="row member-row">
        <UserAvatar :user-id="member.id" :display-name="member.displayName" :avatar-url="member.avatarUrl" :size="28" />
        <span class="member-name truncate">
          <strong>{{ member.displayName }}</strong>
          <span class="text-muted">@{{ member.username }}</span>
          <span v-if="member.role === 'admin'" class="pill">관리자</span>
        </span>
        <span class="member-email truncate text-muted">
          <template v-if="member.email">
            {{ maskEmail(member.email) }}
            <span class="pill" :class="member.emailVerified ? 'is-ok' : 'is-pending'">{{ member.emailVerified ? '인증' : '미인증' }}</span>
          </template>
          <template v-else>이메일 없음</template>
          <span v-if="member.connections.length" class="pill">GitHub</span>
        </span>
        <button
          v-if="member.id !== auth.userId"
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="issuingId === member.id"
          @click="issueTemporaryPassword(member)"
        >
          <KeyRound :size="14" /> 임시 비밀번호 발급
        </button>
      </li>
    </ul>
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

.member-row {
  gap: 10px;
  padding: 8px 12px;
}

.member-name {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.member-email {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  font-size: var(--font-size-sm);
}

.pill {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.pill.is-ok {
  color: var(--green);
}

.pill.is-pending {
  color: var(--yellow);
}

.issued {
  margin-bottom: 12px;
  padding: 12px 16px;
  border: 1px solid var(--brand);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.issued-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.issued-password {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  user-select: all;
  color: var(--header-primary);
}

@media (max-width: 599px) {
  .member-row {
    flex-wrap: wrap;
  }

  .member-email {
    max-width: none;
    width: 100%;
  }
}
</style>
