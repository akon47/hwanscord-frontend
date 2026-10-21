<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { maskEmail } from '@/utils/account'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AuthLayout from './AuthLayout.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const phase = ref<'working' | 'done' | 'failed'>('working')
const email = ref('')
const message = ref('')

const continueTo = computed(() => (auth.isLoggedIn ? '/channels/@me' : '/login'))
const continueLabel = computed(() => (auth.isLoggedIn ? 'HWANSCORD 로 돌아가기' : '로그인하기'))

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  // strip the one-time token before any request goes out (it would otherwise leak via Referer and history)
  if (token) {
    window.history.replaceState(window.history.state, '', route.path)
    void router.replace({ path: route.path })
  }
  if (!token) {
    phase.value = 'failed'
    message.value = '링크에 인증 정보가 없어요. 메일의 링크를 그대로 열어 주세요.'
    return
  }
  try {
    const { user } = await authApi.verifyEmail(token)
    auth.applyVerifiedUser(user)
    email.value = user.email ? maskEmail(user.email) : ''
    phase.value = 'done'
  } catch (e) {
    phase.value = 'failed'
    message.value =
      e instanceof ApiError && e.code === 'BAD_REQUEST'
        ? '링크가 만료되었거나 이미 사용되었어요. 설정에서 인증 메일을 다시 보낼 수 있어요.'
        : errorMessage(e)
  }
})
</script>

<template>
  <div v-if="phase === 'working'" class="working" aria-live="polite">
    <LoadingSpinner />
    <span>이메일을 확인하는 중…</span>
  </div>
  <AuthLayout v-else :title="phase === 'done' ? '이메일을 인증했어요' : '인증하지 못했어요'">
    <div class="form" role="status">
      <p class="text">
        <template v-if="phase === 'done'">
          <strong>{{ email }}</strong> 주소가 확인됐어요. 이제 비밀번호를 잊어도 이 주소로 복구할 수 있어요.
        </template>
        <template v-else>{{ message }}</template>
      </p>
      <RouterLink :to="continueTo" class="btn btn-primary btn-lg submit">{{ continueLabel }}</RouterLink>
    </div>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 20px;
}

.submit {
  width: 100%;
  text-align: center;
}

.text {
  line-height: 1.6;
  color: var(--text-normal);
}

.working {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 100vh;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}
</style>
