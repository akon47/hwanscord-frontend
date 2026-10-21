import { ref, type Ref } from 'vue'
import { authApi, type AuthProviders } from '@/api'

const providers = ref<AuthProviders>({ github: false })
let loading: Promise<void> | null = null

/** Which OAuth providers the server has configured. Fetched once per page load. */
export function useAuthProviders(): Ref<AuthProviders> {
  loading ??= authApi
    .fetchProviders()
    .then((p) => {
      providers.value = p
    })
    .catch(() => undefined)
  return providers
}
