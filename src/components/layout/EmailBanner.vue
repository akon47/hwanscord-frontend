<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mail, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useVerificationResend } from '@/composables/useVerificationResend'
import { emailBannerState } from '@/utils/account'

const DISMISS_KEY = 'hwanscord.emailBannerDismissed'

const auth = useAuthStore()
const ui = useUiStore()
const { secondsLeft, sending, resend } = useVerificationResend()

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

const dismissed = ref(readDismissed())
const state = computed(() => emailBannerState(auth.user, dismissed.value))

function dismiss() {
  dismissed.value = true
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div v-if="state !== 'none'" class="banner" role="status" :data-state="state">
    <Mail :size="16" aria-hidden="true" />
    <template v-if="state === 'missing'">
      <span class="text">이메일을 등록하면 비밀번호를 잊어도 복구할 수 있어요.</span>
      <button type="button" class="action" @click="ui.openSettings('account')">이메일 등록</button>
    </template>
    <template v-else>
      <span class="text">인증 메일을 확인해 주세요.</span>
      <button type="button" class="action" :disabled="sending || secondsLeft > 0" @click="resend">
        {{ secondsLeft > 0 ? `다시 보내기 (${secondsLeft}초)` : '다시 보내기' }}
      </button>
    </template>
    <button type="button" class="close" aria-label="이 안내 닫기" @click="dismiss">
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 34px;
  padding: 4px 44px;
  position: relative;
  background: var(--brand);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: center;
}

.action {
  padding: 3px 10px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
  background: transparent;
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.action:disabled {
  opacity: 0.6;
  cursor: default;
}

.close {
  position: absolute;
  right: 10px;
  display: inline-flex;
  padding: 4px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: #fff;
}

.close:hover {
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 599px) {
  .banner {
    justify-content: flex-start;
    padding-left: 12px;
    text-align: left;
  }
}
</style>
