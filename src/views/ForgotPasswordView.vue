<script setup lang="ts">
import { computed, ref } from 'vue'
import { authApi } from '@/api'
import { ApiError, errorMessage } from '@/api/client'
import AuthLayout from './AuthLayout.vue'

const login = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

const valid = computed(() => login.value.trim().length > 0)

async function submit() {
  if (!valid.value || loading.value) return
  loading.value = true
  error.value = null
  try {
    await authApi.forgotPassword(login.value.trim())
    sent.value = true
  } catch (e) {
    // the server answers 204 for every account; only rate limits / outages land here
    error.value = e instanceof ApiError && e.code === 'RATE_LIMITED' ? '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' : errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="비밀번호 찾기" subtitle="가입할 때 쓴 아이디나 이메일을 입력해 주세요.">
    <div v-if="sent" class="form" role="status">
      <p class="sent">
        메일을 보냈어요(등록·인증된 이메일이 있다면). 받은편지함과 스팸함을 확인하고, 메일의 링크로 30분 안에 새 비밀번호를
        정해 주세요.
      </p>
      <p class="hint">이메일을 등록하지 않았거나 인증하지 않았다면 메일이 가지 않아요. 관리자에게 임시 비밀번호를 요청해 주세요.</p>
      <RouterLink to="/login" class="btn btn-primary btn-lg submit">로그인으로 돌아가기</RouterLink>
    </div>
    <form v-else class="form" novalidate @submit.prevent="submit">
      <label class="field">
        <span class="label">아이디 또는 이메일 <span class="required">*</span></span>
        <input v-model="login" class="input" type="text" autocomplete="username" autocapitalize="off" autofocus required />
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!valid || loading">
        {{ loading ? '보내는 중…' : '재설정 메일 보내기' }}
      </button>
      <p class="switch"><RouterLink to="/login">로그인으로 돌아가기</RouterLink></p>
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

.sent {
  line-height: 1.6;
  color: var(--text-normal);
}

.hint,
.switch {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
