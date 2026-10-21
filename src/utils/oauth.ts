/** Result of the GitHub OAuth round trip, delivered by the server in the URL fragment of /oauth/callback. */
export type OAuthResult =
  | { kind: 'token'; token: string; next: string }
  | { kind: 'signup'; signupToken: string; next: string }
  | { kind: 'linked'; provider: 'github'; next: string }
  | { kind: 'error'; code: string }

/** Same rule as the server: relative same-site paths only. */
export function safeNext(raw: string | null | undefined, fallback = '/channels/@me'): string {
  if (!raw || raw.length > 512) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\') || /[\r\n]/.test(raw))
    return fallback
  return raw === '/' ? fallback : raw
}

export function parseOAuthFragment(hash: string): OAuthResult {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const next = safeNext(params.get('next'))
  const error = params.get('error')
  if (error) return { kind: 'error', code: error }
  const token = params.get('token')
  if (token) return { kind: 'token', token, next }
  const signupToken = params.get('signup')
  if (signupToken) return { kind: 'signup', signupToken, next }
  if (params.get('linked') === 'github') return { kind: 'linked', provider: 'github', next }
  return { kind: 'error', code: 'invalid' }
}

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: '로그인 요청이 만료되었거나 다른 창에서 시작되었어요. 다시 시도해 주세요.',
  denied: 'GitHub 에서 권한 요청을 취소했어요.',
  exchange_failed: 'GitHub 와 통신하지 못했어요. 잠시 후 다시 시도해 주세요.',
  disabled: '지금은 GitHub 로그인을 사용할 수 없어요.',
  already_linked: '이 GitHub 계정은 이미 다른 HWANSCORD 계정에 연결되어 있어요.',
}

export function oauthErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? 'GitHub 로그인 중 문제가 생겼어요. 다시 시도해 주세요.'
}

/**
 * Turns a GitHub login into a HWANSCORD username candidate (`^[a-z0-9_.]{2,32}$`):
 * lowercase, `-` and other separators → `_`, other characters dropped, collapsed, trimmed, padded.
 */
export function sanitizeUsername(login: string): string {
  let name = login
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[_.]+|[_.]+$/g, '')
    .slice(0, 32)
  if (name.length < 2) name = (name + 'user').slice(0, Math.max(2, name.length + 4))
  return name
}

/** Reads the provisional profile out of the signup token (display only; the server verifies it). */
export function decodeSignupProfile(token: string): { login: string; name: string | null } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    const data = JSON.parse(json) as { login?: unknown; name?: unknown }
    if (typeof data.login !== 'string') return null
    return { login: data.login, name: typeof data.name === 'string' ? data.name : null }
  } catch {
    return null
  }
}
