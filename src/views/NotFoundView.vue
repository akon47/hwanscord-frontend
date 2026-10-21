<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
</script>

<template>
  <AuthLayout title="페이지를 찾을 수 없어요" subtitle="주소가 바뀌었거나 삭제된 페이지예요.">
    <RouterLink :to="auth.isLoggedIn ? '/channels/@me' : '/login'" class="btn btn-primary btn-lg back">
      {{ auth.isLoggedIn ? '홈으로 돌아가기' : '로그인하러 가기' }}
    </RouterLink>
  </AuthLayout>
</template>

<style scoped>
.back {
  width: 100%;
  margin-top: 24px;
  text-decoration: none;
}

.back:hover {
  text-decoration: none;
}
</style>
