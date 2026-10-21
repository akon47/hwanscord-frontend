<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useCooldown } from '@/composables/useCooldown'
import { useUsernameAvailability } from '@/composables/useUsernameAvailability'
import {
  codeErrorMessage,
  emailError as describeEmail,
  isValidEmail,
  passwordError as describePassword,
  remainingAttempts,
  repeatError as describeRepeat,
  usernameFromEmail,
} from '@/utils/account'
import CodeInput from '@/components/auth/CodeInput.vue'
import GithubButton from '@/components/auth/GithubButton.vue'
import AuthLayout from './AuthLayout.vue'

const auth = useAuthStore()
const router = useRouter()
const { secondsLeft, start: startCooldown } = useCooldown(60)

type Step = 'email' | 'code' | 'details'
const step = ref<Step>('email')
const busy = ref(false)
const error = ref<string | null>(null)

// step 1
const email = ref('')
const emailHint = computed(() => (email.value ? describeEmail(email.value) : null))
const normalizedEmail = computed(() => email.value.trim().toLowerCase())

// step 2
const code = ref('')
const codeInvalid = ref(false)
const codeInput = ref<InstanceType<typeof CodeInput> | null>(null)
const signupToken = ref('')

// step 3
const password = ref('')
const passwordRepeat = ref('')
const displayName = ref('')
const username = ref('')
const { state: availability, suggestion } = useUsernameAvailability(username)
const passwordHint = computed(() => (password.value ? describePassword(password.value) : null))
const repeatHint = computed(() => describeRepeat(password.value, passwordRepeat.value))
const detailsValid = computed(
  () =>
    !describePassword(password.value) &&
    password.value === passwordRepeat.value &&
    displayName.value.trim().length <= 32 &&
    availability.value === 'available',
)

const titles: Record<Step, { title: string; subtitle: string }> = {
  email: { title: '계정 만들기', subtitle: '이메일 주소로 가입해요. 먼저 주소를 확인할게요.' },
  code: { title: '이메일 확인', subtitle: '메일로 받은 6자리 코드를 입력해 주세요.' },
  details: { title: '거의 다 됐어요', subtitle: '비밀번호와 프로필을 정해 주세요.' },
}

async function sendCode() {
  if (!isValidEmail(email.value) || busy.value) return
  busy.value = true
  error.value = null
  try {
    await authApi.registerStart(normalizedEmail.value)
    startCooldown()
    step.value = 'code'
    code.value = ''
    codeInvalid.value = false
  } catch (e) {
    if (e instanceof ApiError && e.code === 'RATE_LIMITED') {
      // a code is already on its way: let the user type it
      startCooldown()
      step.value = 'code'
      error.value = '코드를 이미 보냈어요. 잠시 후에 다시 받을 수 있어요.'
    } else error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

async function verifyCode(value = code.value) {
  if (!/^\d{6}$/.test(value) || busy.value) return
  busy.value = true
  error.value = null
  try {
    const res = await authApi.registerVerify(normalizedEmail.value, value)
    signupToken.value = res.signupToken
    username.value = usernameFromEmail(normalizedEmail.value)
    step.value = 'details'
  } catch (e) {
    codeInvalid.value = true
    error.value = codeErrorMessage(e, errorMessage(e))
    if (remainingAttempts(e) !== 0) codeInput.value?.clear()
  } finally {
    busy.value = false
  }
}

async function resend() {
  if (secondsLeft.value > 0) return
  await sendCode()
}

function changeEmail() {
  step.value = 'email'
  error.value = null
  code.value = ''
}

async function createAccount() {
  if (!detailsValid.value || busy.value) return
  busy.value = true
  error.value = null
  try {
    await auth.register({
      signupToken: signupToken.value,
      password: password.value,
      displayName: displayName.value.trim() || undefined,
      username: username.value.trim(),
    })
    await router.replace('/channels/@me')
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      step.value = 'email'
      error.value = '인증이 만료되었어요. 이메일 확인부터 다시 해 주세요.'
    } else if (e instanceof ApiError && e.code === 'CONFLICT') {
      error.value = e.message.includes('이메일') ? '이미 가입된 이메일이에요. 로그인해 주세요.' : '이미 사용 중인 사용자명이에요.'
    } else error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout :title="titles[step].title" :subtitle="titles[step].subtitle">
    <ol class="steps" aria-label="가입 단계">
      <li :class="{ 'is-active': step === 'email', 'is-done': step !== 'email' }">이메일</li>
      <li :class="{ 'is-active': step === 'code', 'is-done': step === 'details' }">코드 확인</li>
      <li :class="{ 'is-active': step === 'details' }">계정 정보</li>
    </ol>

    <form v-if="step === 'email'" class="form" novalidate @submit.prevent="sendCode">
      <label class="field">
        <span class="label">이메일 <span class="required">*</span></span>
        <input v-model="email" class="input" type="email" autocomplete="email" autocapitalize="off" inputmode="email" autofocus required />
        <span v-if="emailHint" class="field-error">{{ emailHint }}</span>
        <span v-else class="field-hint">로그인 아이디로 쓰여요. 이 주소로 6자리 코드를 보내 드려요.</span>
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!isValidEmail(email) || busy">
        {{ busy ? '보내는 중…' : '인증 코드 받기' }}
      </button>
      <GithubButton next="/channels/@me" />
      <p class="switch"><RouterLink to="/login">이미 계정이 있으신가요?</RouterLink></p>
    </form>

    <form v-else-if="step === 'code'" class="form" novalidate @submit.prevent="verifyCode()">
      <p class="sent"><strong>{{ normalizedEmail }}</strong> 로 보낸 코드를 입력해 주세요. 10분 동안 쓸 수 있어요.</p>
      <CodeInput ref="codeInput" v-model="code" :invalid="codeInvalid" :disabled="busy" @complete="verifyCode" />
      <p v-if="error" class="field-error center" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="code.length !== 6 || busy">
        {{ busy ? '확인 중…' : '확인' }}
      </button>
      <div class="links">
        <button type="button" class="link-btn" :disabled="secondsLeft > 0 || busy" @click="resend">
          {{ secondsLeft > 0 ? `재전송 (${secondsLeft}초)` : '코드 재전송' }}
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" class="link-btn" @click="changeEmail">이메일 변경</button>
      </div>
      <p class="hint">메일이 안 보이면 스팸함을 확인해 주세요. 이미 가입된 주소라면 코드 대신 안내 메일이 가요.</p>
    </form>

    <form v-else class="form" novalidate @submit.prevent="createAccount">
      <p class="verified">✓ {{ normalizedEmail }}</p>
      <label class="field">
        <span class="label">비밀번호 <span class="required">*</span></span>
        <input v-model="password" class="input" type="password" autocomplete="new-password" autofocus required />
        <span v-if="passwordHint" class="field-error">{{ passwordHint }}</span>
      </label>
      <label class="field">
        <span class="label">비밀번호 확인 <span class="required">*</span></span>
        <input v-model="passwordRepeat" class="input" type="password" autocomplete="new-password" required />
        <span v-if="repeatHint" class="field-error">{{ repeatHint }}</span>
      </label>
      <label class="field">
        <span class="label">표시 이름</span>
        <input v-model="displayName" class="input" type="text" maxlength="32" placeholder="다른 사람에게 보이는 이름 (선택)" />
      </label>
      <label class="field">
        <span class="label">사용자명 <span class="required">*</span></span>
        <input v-model="username" class="input" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" />
        <span v-if="availability === 'invalid'" class="field-error">영문 소문자, 숫자, 밑줄(_), 마침표(.)로 2~32자여야 해요.</span>
        <span v-else-if="availability === 'taken'" class="field-error">
          이미 사용 중이에요.
          <button v-if="suggestion" type="button" class="link-btn" @click="username = suggestion">{{ suggestion }} 사용</button>
        </span>
        <span v-else-if="availability === 'checking'" class="field-hint">확인 중…</span>
        <span v-else-if="availability === 'available'" class="field-hint ok">사용할 수 있어요 · 멘션과 프로필에 @{{ username }} 로 보여요</span>
        <span v-else-if="availability === 'error'" class="field-error">확인하지 못했어요. 잠시 후 다시 시도해 주세요.</span>
      </label>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="!detailsValid || busy">
        {{ busy ? '만드는 중…' : '가입하기' }}
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
  margin-top: 4px;
}

.switch,
.hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.steps {
  display: flex;
  gap: 6px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.steps li {
  flex: 1;
  padding-top: 8px;
  border-top: 3px solid var(--bg-modifier-accent, rgba(128, 128, 128, 0.3));
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-faint);
}

.steps li.is-active {
  border-top-color: var(--brand);
  color: var(--header-primary);
}

.steps li.is-done {
  border-top-color: var(--green);
  color: var(--text-muted);
}

.sent {
  line-height: 1.6;
  color: var(--text-normal);
}

.verified {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--green);
  font-size: var(--font-size-sm);
  font-weight: 600;
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

.field-hint.ok {
  color: var(--green);
}
</style>
