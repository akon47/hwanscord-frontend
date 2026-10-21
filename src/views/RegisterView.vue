<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import GithubButton from '@/components/auth/GithubButton.vue'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const displayName = ref('')
const password = ref('')
const passwordRepeat = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})

const USERNAME_RE = /^[a-z0-9_.]{2,32}$/

const usernameValue = computed(() => username.value.trim().toLowerCase())
const usernameError = computed(() =>
  usernameValue.value && !USERNAME_RE.test(usernameValue.value)
    ? '영문 소문자, 숫자, 밑줄(_), 마침표(.)로 2~32자여야 해요.'
    : (fieldErrors.value.username?.[0] ?? null),
)
const passwordError = computed(() =>
  password.value && (password.value.length < 8 || password.value.length > 72)
    ? '비밀번호는 8~72자여야 해요.'
    : (fieldErrors.value.password?.[0] ?? null),
)
const repeatError = computed(() =>
  passwordRepeat.value && passwordRepeat.value !== password.value ? '비밀번호가 일치하지 않아요.' : null,
)
const valid = computed(
  () =>
    USERNAME_RE.test(usernameValue.value) &&
    password.value.length >= 8 &&
    password.value.length <= 72 &&
    password.value === passwordRepeat.value &&
    displayName.value.trim().length <= 32,
)

async function submit() {
  if (!valid.value || loading.value) return
  loading.value = true
  error.value = null
  fieldErrors.value = {}
  try {
    await auth.register(usernameValue.value, password.value, displayName.value.trim() || undefined)
    await router.replace('/channels/@me')
  } catch (e) {
    if (e instanceof ApiError && e.code === 'CONFLICT') error.value = '이미 사용 중인 아이디예요.'
    else if (e instanceof ApiError && e.code === 'VALIDATION_ERROR') fieldErrors.value = e.fieldErrors
    else error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="계정 만들기">
    <form class="form" novalidate @submit.prevent="submit">
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
      <label class="field">
        <span class="label">비밀번호 <span class="required">*</span></span>
        <input v-model="password" class="input" type="password" autocomplete="new-password" required />
        <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
      </label>
      <label class="field">
        <span class="label">비밀번호 확인 <span class="required">*</span></span>
        <input v-model="passwordRepeat" class="input" type="password" autocomplete="new-password" required />
        <span v-if="repeatError" class="field-error">{{ repeatError }}</span>
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!valid || loading">
        {{ loading ? '가입 중…' : '계속하기' }}
      </button>
      <GithubButton next="/channels/@me" />
      <p class="switch"><RouterLink to="/login">이미 계정이 있으신가요?</RouterLink></p>
    </form>
  </AuthLayout>
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
}

.switch {
  font-size: var(--font-size-sm);
}
</style>
