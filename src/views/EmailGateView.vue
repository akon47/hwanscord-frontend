<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { stopSession } from '@/realtime/session'
import EmailCodeFlow from '@/components/auth/EmailCodeFlow.vue'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const hasPassword = computed(() => auth.user?.hasPassword !== false)

async function done() {
  ui.toast('이메일을 인증했어요. 환영해요!', 'success')
  await router.replace('/channels/@me')
}

async function logout() {
  stopSession()
  auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <AuthLayout title="이메일 인증이 필요해요" subtitle="계정 보호와 비밀번호 찾기를 위해 이메일 인증이 필요해요.">
    <div class="gate">
      <p v-if="auth.user" class="who">
        <strong>{{ auth.user.displayName }}</strong> (@{{ auth.user.username }}) 계정으로 로그인했어요. 인증을 마치면 이
        이메일로도 로그인할 수 있어요.
      </p>
      <EmailCodeFlow :require-password="hasPassword" @done="done">
        <template #secondary>
          <button type="button" class="btn btn-ghost" @click="logout">로그아웃</button>
        </template>
      </EmailCodeFlow>
    </div>
  </AuthLayout>
</template>

<style scoped>
.gate {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 20px;
}

.who {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-normal);
}
</style>
