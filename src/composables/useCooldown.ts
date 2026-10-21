import { computed, onBeforeUnmount, ref } from 'vue'
import { cooldownLeft } from '@/utils/account'

/** A countdown for "다시 보내기" buttons (the server allows one code per 60 s). */
export function useCooldown(seconds = 60) {
  const startedAt = ref<number | null>(null)
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), 1000)
  onBeforeUnmount(() => clearInterval(timer))

  const secondsLeft = computed(() => cooldownLeft(startedAt.value, seconds, now.value))

  function start() {
    startedAt.value = Date.now()
    now.value = startedAt.value
  }

  return { secondsLeft, start }
}
