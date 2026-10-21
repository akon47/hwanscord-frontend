<script setup lang="ts">
import { readLinkToken } from '@/utils/linkToken'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { stopSession } from '@/realtime/session'
import { passwordError as describePassword, repeatError as describeRepeat } from '@/utils/account'
import AuthLayout from './AuthLayout.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const token = ref('')
const password = ref('')
const repeat = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const expired = ref(false)

onMounted(() => {
  token.value = readLinkToken(route)
  // keep the one-time token out of the history entry
  if (token.value) {
    // strip the one-time token before any request goes out (Referer, history)
    window.history.replaceState(window.history.state, '', route.path)
    void router.replace({ path: route.path })
  }
  else expired.value = true
})

const passwordError = computed(() => (password.value ? describePassword(password.value) : null))
const repeatError = computed(() => describeRepeat(password.value, repeat.value))
const valid = computed(() => !describePassword(password.value) && password.value === repeat.value)

async function submit() {
  if (!valid.value || loading.value) return
  loading.value = true
  error.value = null
  try {
    await authApi.resetPassword(token.value, password.value)
    // every session (including one in this browser) was signed out by the reset
    if (auth.token) {
      stopSession()
      auth.logout()
    }
    ui.toast('비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.', 'success', 6000)
    await router.replace('/login')
  } catch (e) {
    if (e instanceof ApiError && e.status === 400 && e.code === 'BAD_REQUEST') expired.value = true
    else error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout v-if="expired" title="링크를 쓸 수 없어요">
    <div class="form">
      <p class="text">재설정 링크가 만료되었거나 이미 사용되었어요. 링크는 30분 동안 한 번만 쓸 수 있어요.</p>
      <RouterLink to="/forgot-password" class="btn btn-primary btn-lg submit">메일 다시 받기</RouterLink>
    </div>
  </AuthLayout>
  <AuthLayout v-else title="새 비밀번호 정하기" subtitle="바꾸면 다른 기기의 로그인은 모두 해제돼요.">
    <form class="form" novalidate @submit.prevent="submit">
      <label class="field">
        <span class="label">새 비밀번호 <span class="required">*</span></span>
        <input v-model="password" class="input" type="password" autocomplete="new-password" autofocus required />
        <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
      </label>
      <label class="field">
        <span class="label">새 비밀번호 확인 <span class="required">*</span></span>
        <input v-model="repeat" class="input" type="password" autocomplete="new-password" required />
        <span v-if="repeatError" class="field-error">{{ repeatError }}</span>
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!valid || loading">
        {{ loading ? '바꾸는 중…' : '비밀번호 바꾸기' }}
      </button>
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
  text-align: center;
}

.text {
  line-height: 1.6;
  color: var(--text-normal);
}
</style>
