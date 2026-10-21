import { ref, watch, type Ref } from 'vue'
import { authApi } from '@/api'
import { USERNAME_RE } from '@/utils/account'

export type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

/**
 * Debounced live check of a handle against GET /auth/username-available.
 * `skip` (e.g. the user's current handle) is reported as available without asking.
 */
export function useUsernameAvailability(username: Ref<string>, options: { skip?: () => string | null; delay?: number } = {}) {
  const state = ref<Availability>('idle')
  const suggestion = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  let seq = 0

  watch(
    username,
    (raw) => {
      const value = raw.trim()
      if (timer) clearTimeout(timer)
      suggestion.value = null
      if (!value) {
        state.value = 'idle'
        return
      }
      if (!USERNAME_RE.test(value)) {
        state.value = 'invalid'
        return
      }
      if (options.skip?.() === value) {
        state.value = 'available'
        return
      }
      state.value = 'checking'
      const mine = ++seq
      timer = setTimeout(async () => {
        try {
          const res = await authApi.usernameAvailable(value)
          if (mine !== seq) return // a newer keystroke won
          state.value = res.available ? 'available' : 'taken'
          suggestion.value = res.available ? null : res.suggestion
        } catch {
          if (mine === seq) state.value = 'error'
        }
      }, options.delay ?? 350)
    },
    { immediate: true },
  )

  return { state, suggestion }
}
