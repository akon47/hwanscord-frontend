<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { avatarColor } from '@/utils/color'
import { formatDate } from '@/utils/time'
import UserAvatar from '@/components/users/UserAvatar.vue'

const auth = useAuthStore()
const ui = useUiStore()

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
  () => displayName.value.trim() !== (auth.user?.displayName ?? '') || aboutMe.value !== (auth.user?.aboutMe ?? ''),
)
const displayNameValid = computed(() => {
  const len = displayName.value.trim().length
  return len >= 1 && len <= 32
})
const passwordValid = computed(
  () =>
    currentPassword.value.length > 0 &&
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
    await auth.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordRepeat.value = ''
    ui.toast('비밀번호를 변경했습니다.', 'success')
  } catch (error) {
    passwordError.value =
      error instanceof ApiError && error.status === 401 ? '현재 비밀번호가 올바르지 않습니다.' : errorMessage(error)
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
          <span v-if="avatarProgress !== null" class="avatar-progress">{{ Math.round(avatarProgress * 100) }}%</span>
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
          <button type="button" class="btn btn-primary btn-sm" :disabled="avatarProgress !== null" @click="fileInput?.click()">
            아바타 변경
          </button>
          <button v-if="auth.user.avatarUrl" type="button" class="btn btn-ghost btn-sm" @click="removeAvatar">제거</button>
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
          <textarea v-model="aboutMe" class="input" rows="3" maxlength="190" placeholder="자신을 소개해 주세요" />
          <span class="counter">{{ 190 - aboutMe.length }}</span>
        </label>
        <p class="text-muted since">가입일: {{ formatDate(auth.user.createdAt) }}</p>
        <div v-if="dirty" class="save-bar">
          <span>저장하지 않은 변경 사항이 있어요!</span>
          <button type="button" class="btn btn-ghost btn-sm" @click="resetProfile">재설정</button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="savingProfile || !displayNameValid">변경 사항 저장</button>
        </div>
      </form>
    </div>

    <h3 class="subtitle">비밀번호 변경</h3>
    <form class="fields password" @submit.prevent="changePassword">
      <label class="field">
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
        <span v-if="newPasswordRepeat && newPassword !== newPasswordRepeat" class="field-error">비밀번호가 일치하지 않아요.</span>
      </label>
      <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
      <div>
        <button type="submit" class="btn btn-primary" :disabled="!passwordValid || savingPassword">비밀번호 변경</button>
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

@media (max-width: 599px) {
  .profile-row {
    flex-wrap: wrap;
  }
}
</style>
