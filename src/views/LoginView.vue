<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { readJson } from '@/utils/storage'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const valid = computed(() => username.value.trim().length > 0 && password.value.length > 0)

async function submit() {
  if (!valid.value || loading.value) return
  loading.value = true
  error.value = null
  try {
    await auth.login(username.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.replace(redirect ?? readJson<string>('lastPath', '/channels/@me'))
  } catch (e) {
    error.value = errorMessage(e)
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="돌아오신 걸 환영해요!" subtitle="다시 만나다니 너무 반가워요!">
    <form class="form" novalidate @submit.prevent="submit">
      <label class="field">
        <span class="label">아이디 <span class="required">*</span></span>
        <input v-model="username" class="input" type="text" autocomplete="username" autocapitalize="off" autofocus required />
      </label>
      <label class="field">
        <span class="label">비밀번호 <span class="required">*</span></span>
        <input v-model="password" class="input" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!valid || loading">
        {{ loading ? '로그인 중…' : '로그인' }}
      </button>
      <p class="switch">
        계정이 필요한가요? <RouterLink to="/register">가입하기</RouterLink>
      </p>
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
  color: var(--text-muted);
}
</style>
