<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ApiError, errorMessage } from '@/api/client'
import type { User } from '@/api/types'
import { useAuthStore } from '@/stores/auth'
import { useCooldown } from '@/composables/useCooldown'
import { codeErrorMessage, emailError as describeEmail, isValidEmail, remainingAttempts } from '@/utils/account'
import CodeInput from './CodeInput.vue'

/**
 * Sets or changes the account email with a 6-digit code (POST /users/me/email → /users/me/email/verify).
 * Used by the email gate and by Settings → 내 계정.
 */
const props = withDefaults(
  defineProps<{
    /** ask for the current password (accounts that have one) */
    requirePassword: boolean
    submitLabel?: string
  }>(),
  { submitLabel: '인증 코드 받기' },
)

const emit = defineEmits<{ done: [user: User]; cancel: [] }>()

const auth = useAuthStore()
const { secondsLeft, start: startCooldown } = useCooldown(60)

const step = ref<'email' | 'code'>('email')
const email = ref('')
const password = ref('')
const code = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const codeInvalid = ref(false)
const codeInput = ref<InstanceType<typeof CodeInput> | null>(null)

const emailHint = computed(() => (email.value ? describeEmail(email.value) : null))
const canSend = computed(() => isValidEmail(email.value) && (!props.requirePassword || password.value.length > 0))

async function sendCode() {
  if (!canSend.value || busy.value) return
  busy.value = true
  error.value = null
  try {
    await auth.requestEmailCode(email.value.trim().toLowerCase(), props.requirePassword ? password.value : null)
    startCooldown()
    step.value = 'code'
    code.value = ''
    codeInvalid.value = false
  } catch (e) {
    if (e instanceof ApiError && e.fieldErrors.currentPassword) error.value = '현재 비밀번호가 올바르지 않아요.'
    else if (e instanceof ApiError && e.code === 'CONFLICT') error.value = '이미 다른 계정에서 쓰고 있는 이메일이에요.'
    else if (e instanceof ApiError && e.code === 'RATE_LIMITED') {
      startCooldown()
      step.value = 'code'
      error.value = '코드를 이미 보냈어요. 잠시 후에 다시 받을 수 있어요.'
    } else error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

async function resend() {
  if (secondsLeft.value > 0 || busy.value) return
  step.value = 'email'
  await nextTick()
  await sendCode()
}

async function submitCode(value = code.value) {
  if (!/^\d{6}$/.test(value) || busy.value) return
  busy.value = true
  error.value = null
  try {
    const user = await auth.verifyEmailCode(value)
    emit('done', user)
  } catch (e) {
    codeInvalid.value = true
    error.value = codeErrorMessage(e, errorMessage(e))
    if (remainingAttempts(e) !== 0) codeInput.value?.clear()
  } finally {
    busy.value = false
  }
}

function changeEmail() {
  step.value = 'email'
  error.value = null
  code.value = ''
}
</script>

<template>
  <form v-if="step === 'email'" class="flow" novalidate @submit.prevent="sendCode">
    <label class="field">
      <span class="label">이메일</span>
      <input v-model="email" class="input" type="email" autocomplete="email" inputmode="email" autocapitalize="off" autofocus />
      <span v-if="emailHint" class="field-error">{{ emailHint }}</span>
    </label>
    <label v-if="requirePassword" class="field">
      <span class="label">현재 비밀번호</span>
      <input v-model="password" class="input" type="password" autocomplete="current-password" />
      <span class="field-hint">본인 확인을 위해 지금 쓰는 비밀번호를 입력해 주세요.</span>
    </label>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <div class="actions">
      <slot name="secondary" />
      <button type="submit" class="btn btn-primary" :disabled="!canSend || busy">
        {{ busy ? '보내는 중…' : submitLabel }}
      </button>
    </div>
  </form>

  <form v-else class="flow" novalidate @submit.prevent="submitCode()">
    <p class="sent">
      <strong>{{ email }}</strong> 로 보낸 6자리 코드를 입력해 주세요. 코드는 10분 동안 쓸 수 있어요.
    </p>
    <CodeInput ref="codeInput" v-model="code" :invalid="codeInvalid" :disabled="busy" @complete="submitCode" />
    <p v-if="error" class="field-error center" role="alert">{{ error }}</p>
    <div class="links">
      <button type="button" class="link-btn" :disabled="secondsLeft > 0 || busy" @click="resend">
        {{ secondsLeft > 0 ? `재전송 (${secondsLeft}초)` : '코드 재전송' }}
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" class="link-btn" @click="changeEmail">이메일 변경</button>
    </div>
    <div class="actions">
      <slot name="secondary" />
      <button type="submit" class="btn btn-primary" :disabled="code.length !== 6 || busy">
        {{ busy ? '확인 중…' : '확인' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.flow {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: block;
}

.sent {
  line-height: 1.6;
  color: var(--text-normal);
}

.center {
  text-align: center;
}

.links {
  display: flex;
  justify-content: center;
  gap: 8px;
  color: var(--text-faint);
  font-size: var(--font-size-sm);
}

.link-btn {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-link, var(--brand));
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.link-btn:disabled {
  color: var(--text-faint);
  cursor: default;
}

.link-btn:hover:not(:disabled) {
  text-decoration: underline;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
