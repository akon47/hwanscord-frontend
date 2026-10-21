<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { avatarColor } from '@/utils/color'
import { formatDate } from '@/utils/time'
import UserAvatar from '@/components/users/UserAvatar.vue'
import { useAuthProviders } from '@/composables/useAuthProviders'
import { readJson } from '@/utils/storage'

const auth = useAuthStore()
const ui = useUiStore()
const providers = useAuthProviders()

/** accounts created through GitHub have no password until one is set */
const hasPassword = computed(() => auth.user?.hasPassword !== false)
const github = computed(() => auth.user?.connections?.find((c) => c.provider === 'github') ?? null)
const linking = ref(false)
const unlinking = ref(false)

async function linkGithub() {
  linking.value = true
  try {
    await auth.startGithubLink(readJson<string>('lastPath', '/channels/@me'))
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
    linking.value = false
  }
}

async function unlinkGithub() {
  if (!hasPassword.value) return
  unlinking.value = true
  try {
    await auth.unlinkGithub()
    ui.toast('GitHub 연결을 해제했습니다.', 'success')
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    unlinking.value = false
  }
}

const displayName = ref(auth.user?.displayName ?? '')
const aboutMe = ref(auth.user?.aboutMe ?? '')
const savingProfile = ref(false)
const avatarProgress = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordRepeat = ref('')
const savingPassword = ref(false)
const passwordError = ref<string | null>(null)

const dirty = computed(
  () =>
    displayName.value.trim() !== (auth.user?.displayName ?? '') ||
    aboutMe.value !== (auth.user?.aboutMe ?? ''),
)
const displayNameValid = computed(() => {
  const len = displayName.value.trim().length
  return len >= 1 && len <= 32
})
const passwordValid = computed(
  () =>
    (!hasPassword.value || currentPassword.value.length > 0) &&
    newPassword.value.length >= 8 &&
    newPassword.value.length <= 72 &&
    newPassword.value === newPasswordRepeat.value,
)

async function saveProfile() {
  if (!dirty.value || !displayNameValid.value) return
  savingProfile.value = true
  try {
    await auth.patchMe({ displayName: displayName.value.trim(), aboutMe: aboutMe.value.trim() || null })
    ui.toast('프로필을 저장했습니다.', 'success', 2000)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    savingProfile.value = false
  }
}

function resetProfile() {
  displayName.value = auth.user?.displayName ?? ''
  aboutMe.value = auth.user?.aboutMe ?? ''
}

async function onAvatarChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    ui.toast('PNG, JPG, GIF, WEBP 이미지만 올릴 수 있어요.', 'error')
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    ui.toast('아바타는 8 MB 이하만 올릴 수 있어요.', 'error')
    return
  }
  avatarProgress.value = 0
  try {
    await auth.uploadAvatar(file, (ratio) => (avatarProgress.value = ratio))
    ui.toast('아바타를 변경했습니다.', 'success', 2000)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    avatarProgress.value = null
  }
}

async function removeAvatar() {
  try {
    await auth.removeAvatar()
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function changePassword() {
  if (!passwordValid.value) return
  savingPassword.value = true
  passwordError.value = null
  try {
    const firstPassword = !hasPassword.value
    await auth.changePassword(firstPassword ? null : currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordRepeat.value = ''
    ui.toast(firstPassword ? '비밀번호를 설정했습니다.' : '비밀번호를 변경했습니다.', 'success')
  } catch (error) {
    passwordError.value =
      error instanceof ApiError && error.status === 401
        ? '현재 비밀번호가 올바르지 않습니다.'
        : errorMessage(error)
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <section v-if="auth.user">
    <h2 class="title">내 계정</h2>

    <div class="profile-card">
      <div class="banner" :style="{ background: avatarColor(auth.user.id) }" />
      <div class="profile-row">
        <div class="avatar-edit">
          <UserAvatar
            :user-id="auth.user.id"
            :display-name="auth.user.displayName"
            :avatar-url="auth.user.avatarUrl"
            :size="80"
          />
          <span v-if="avatarProgress !== null" class="avatar-progress"
            >{{ Math.round(avatarProgress * 100) }}%</span
          >
        </div>
        <div class="profile-name">
          <strong>{{ auth.user.displayName }}</strong>
          <span class="text-muted">@{{ auth.user.username }}</span>
        </div>
        <div class="avatar-actions">
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            class="visually-hidden"
            @change="onAvatarChosen"
          />
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="avatarProgress !== null"
            @click="fileInput?.click()"
          >
            아바타 변경
          </button>
          <button v-if="auth.user.avatarUrl" type="button" class="btn btn-ghost btn-sm" @click="removeAvatar">
            제거
          </button>
        </div>
      </div>

      <form class="fields" @submit.prevent="saveProfile">
        <label class="field">
          <span class="label">별명</span>
          <input v-model="displayName" class="input" type="text" maxlength="32" />
          <span v-if="!displayNameValid" class="field-error">별명은 1~32자여야 해요.</span>
        </label>
        <label class="field">
          <span class="label">사용자명</span>
          <input :value="auth.user.username" class="input" type="text" disabled />
        </label>
        <label class="field">
          <span class="label">내 소개</span>
          <textarea
            v-model="aboutMe"
            class="input"
            rows="3"
            maxlength="190"
            placeholder="자신을 소개해 주세요"
          />
          <span class="counter">{{ 190 - aboutMe.length }}</span>
        </label>
        <p class="text-muted since">가입일: {{ formatDate(auth.user.createdAt) }}</p>
        <div v-if="dirty" class="save-bar">
          <span>저장하지 않은 변경 사항이 있어요!</span>
          <button type="button" class="btn btn-ghost btn-sm" @click="resetProfile">재설정</button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="savingProfile || !displayNameValid">
            변경 사항 저장
          </button>
        </div>
      </form>
    </div>

    <h3 class="subtitle">연결된 계정</h3>
    <div class="connection">
      <svg class="gh-mark" viewBox="0 0 16 16" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
      <div class="connection-info">
        <strong>GitHub</strong>
        <span v-if="github" class="text-muted">{{ github.login }}</span>
        <span v-else class="text-muted">연결되지 않음</span>
      </div>
      <template v-if="github">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!hasPassword || unlinking"
          :title="hasPassword ? undefined : '비밀번호를 먼저 설정해야 해제할 수 있어요.'"
          @click="unlinkGithub"
        >
          연결 해제
        </button>
      </template>
      <button
        v-else-if="providers.github"
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="linking"
        @click="linkGithub"
      >
        {{ linking ? '이동 중…' : '연결' }}
      </button>
      <span v-else class="text-muted unavailable">사용할 수 없음</span>
    </div>
    <p v-if="github && !hasPassword" class="text-muted note">
      GitHub 가 유일한 로그인 수단이라 해제할 수 없어요. 아래에서 비밀번호를 설정하면 해제할 수 있어요.
    </p>

    <h3 class="subtitle">{{ hasPassword ? '비밀번호 변경' : '비밀번호 설정' }}</h3>
    <p v-if="!hasPassword" class="text-muted note">
      비밀번호를 설정하면 아이디와 비밀번호로도 로그인할 수 있어요.
    </p>
    <form class="fields password" @submit.prevent="changePassword">
      <label v-if="hasPassword" class="field">
        <span class="label">현재 비밀번호</span>
        <input v-model="currentPassword" class="input" type="password" autocomplete="current-password" />
      </label>
      <label class="field">
        <span class="label">새 비밀번호</span>
        <input v-model="newPassword" class="input" type="password" autocomplete="new-password" />
        <span v-if="newPassword && newPassword.length < 8" class="field-error">8자 이상 입력해 주세요.</span>
      </label>
      <label class="field">
        <span class="label">새 비밀번호 확인</span>
        <input v-model="newPasswordRepeat" class="input" type="password" autocomplete="new-password" />
        <span v-if="newPasswordRepeat && newPassword !== newPasswordRepeat" class="field-error"
          >비밀번호가 일치하지 않아요.</span
        >
      </label>
      <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
      <div>
        <button type="submit" class="btn btn-primary" :disabled="!passwordValid || savingPassword">
          {{ hasPassword ? '비밀번호 변경' : '비밀번호 설정' }}
        </button>
      </div>
    </form>
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
  margin: 40px 0 16px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.profile-card {
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  overflow: hidden;
}

.banner {
  height: 100px;
}

.profile-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 0 16px;
  margin-top: -36px;
}

.avatar-edit {
  position: relative;
  padding: 6px;
  border-radius: 50%;
  background: var(--bg-tertiary);
}

.avatar-progress {
  position: absolute;
  inset: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 700;
}

.profile-name {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-bottom: 8px;
  color: var(--header-primary);
}

.avatar-actions {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.password {
  padding: 0;
  max-width: 420px;
}

.field {
  position: relative;
  display: block;
}

.profile-card .input {
  background: var(--bg-secondary);
}

textarea.input {
  resize: vertical;
}

.counter {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

.since {
  font-size: var(--font-size-sm);
}

.save-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-floating);
  box-shadow: var(--shadow-high);
}

.save-bar span {
  flex: 1;
  font-weight: 500;
}

.connection {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 520px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
}

.gh-mark {
  flex-shrink: 0;
  color: var(--header-primary);
}

.connection-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  color: var(--header-primary);
}

.unavailable {
  font-size: var(--font-size-sm);
}

.note {
  max-width: 520px;
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: var(--font-size-sm);
}

@media (max-width: 599px) {
  .profile-row {
    flex-wrap: wrap;
  }
}
</style>
