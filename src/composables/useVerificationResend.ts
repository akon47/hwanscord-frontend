import { computed, onBeforeUnmount, ref } from 'vue'
import { ApiError, errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { cooldownLeft } from '@/utils/account'

const COOLDOWN_S = 60
const KEY = 'hwanscord.verifyResentAt'

function readStartedAt(): number | null {
  try {
    const v = Number(sessionStorage.getItem(KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

// shared by the banner and the settings row so both show the same countdown
const startedAt = ref<number | null>(readStartedAt())
const now = ref(Date.now())

/** "인증 메일 다시 보내기" with the server's 60 s cooldown mirrored in the UI. */
export function useVerificationResend() {
  const auth = useAuthStore()
  const ui = useUiStore()
  const sending = ref(false)
  const timer = setInterval(() => (now.value = Date.now()), 1000)
  onBeforeUnmount(() => clearInterval(timer))

  const secondsLeft = computed(() => cooldownLeft(startedAt.value, COOLDOWN_S, now.value))

  function start() {
    startedAt.value = Date.now()
    now.value = startedAt.value
    try {
      sessionStorage.setItem(KEY, String(startedAt.value))
    } catch {
      /* private mode: the cooldown just resets on reload */
    }
  }

  async function resend() {
    if (sending.value || secondsLeft.value > 0) return
    sending.value = true
    try {
      await auth.resendVerification()
      start()
      ui.toast('인증 메일을 보냈어요. 받은편지함을 확인해 주세요.', 'success')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') start()
      ui.toast(errorMessage(error), 'error')
    } finally {
      sending.value = false
    }
  }

  return { secondsLeft, sending, resend }
}
