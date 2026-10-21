<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { decodeSignupProfile, oauthErrorMessage, parseOAuthFragment, sanitizeUsername } from '@/utils/oauth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

type Phase = 'working' | 'signup' | 'error'
const phase = ref<Phase>('working')
const errorText = ref('')

const signupToken = ref('')
const next = ref('/channels/@me')
const githubLogin = ref('')
const username = ref('')
const displayName = ref('')
const submitting = ref(false)
const formError = ref<string | null>(null)

const usernameValid = computed(() => /^[a-z0-9_.]{2,32}$/.test(username.value.trim()))
const usernameError = computed(() =>
  username.value && !usernameValid.value
    ? '2~32자의 영문 소문자, 숫자, 밑줄(_), 점(.)만 쓸 수 있어요.'
    : null,
)

function fail(message: string) {
  errorText.value = message
  phase.value = 'error'
}

onMounted(async () => {
  const result = parseOAuthFragment(window.location.hash)
  // tokens must not stay in the address bar or the history entry
  window.history.replaceState(window.history.state, '', window.location.pathname)

  switch (result.kind) {
    case 'error':
      fail(oauthErrorMessage(result.code))
      return
    case 'token':
      try {
        await auth.loginWithToken(result.token)
        await router.replace(result.next)
      } catch (error) {
        fail(errorMessage(error))
      }
      return
    case 'linked':
      if (!auth.isLoggedIn) {
        await router.replace('/login')
        return
      }
      try {
        await auth.refreshMe()
      } catch {
        /* the toast below is still true; the panel refreshes on next open */
      }
      ui.toast('GitHub 계정을 연결했습니다.', 'success')
      await router.replace(result.next)
      ui.openSettings('account')
      return
    case 'signup': {
      signupToken.value = result.signupToken
      next.value = result.next
      const profile = decodeSignupProfile(result.signupToken)
      githubLogin.value = profile?.login ?? ''
      username.value = sanitizeUsername(profile?.login ?? '')
      displayName.value = (profile?.name ?? profile?.login ?? '').slice(0, 32)
      phase.value = 'signup'
    }
  }
})

async function completeSignup() {
  if (!usernameValid.value || submitting.value) return
  submitting.value = true
  formError.value = null
  try {
    await auth.completeGithubSignup(signupToken.value, username.value.trim(), displayName.value.trim())
    await router.replace(next.value)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      fail('가입 정보가 만료되었어요. GitHub 로 다시 시도해 주세요.')
    } else {
      formError.value = errorMessage(error)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    v-if="phase === 'signup'"
    title="가입 마무리"
    subtitle="HWANSCORD 에서 쓸 아이디를 정해 주세요."
  >
    <form class="form" novalidate @submit.prevent="completeSignup">
      <p v-if="githubLogin" class="linked-as">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        <span
          ><strong>{{ githubLogin }}</strong> 로 GitHub 인증을 마쳤어요.</span
        >
      </p>
      <label class="field">
        <span class="label">아이디 <span class="required">*</span></span>
        <input
          v-model="username"
          class="input"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autofocus
          required
        />
        <span v-if="usernameError" class="field-error">{{ usernameError }}</span>
      </label>
      <label class="field">
        <span class="label">별명</span>
        <input
          v-model="displayName"
          class="input"
          type="text"
          maxlength="32"
          placeholder="다른 사람에게 표시되는 이름 (선택)"
        />
      </label>
      <p v-if="formError" class="field-error" role="alert">{{ formError }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!usernameValid || submitting">
        {{ submitting ? '가입 중…' : '가입하기' }}
      </button>
      <p class="hint">비밀번호 없이 GitHub 로만 로그인합니다. 비밀번호는 나중에 설정에서 추가할 수 있어요.</p>
    </form>
  </AuthLayout>

  <AuthLayout v-else-if="phase === 'error'" title="로그인하지 못했어요">
    <div class="form">
      <p class="error-text" role="alert">{{ errorText }}</p>
      <RouterLink to="/login" class="btn btn-primary btn-lg submit">로그인 화면으로</RouterLink>
    </div>
  </AuthLayout>

  <div v-else class="working" aria-live="polite">
    <LoadingSpinner />
    <span>GitHub 로그인 처리 중…</span>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 20px;
}

.field {
  display: block;
}

.required {
  color: var(--red);
}

.submit {
  width: 100%;
  margin-top: 4px;
  text-align: center;
}

.linked-as {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-normal);
  font-size: var(--font-size-sm);
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.error-text {
  color: var(--text-normal);
  line-height: 1.5;
}

.working {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  min-height: 100vh;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}
</style>
