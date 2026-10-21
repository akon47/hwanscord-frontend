import type { User } from '@/api/types'
import { sanitizeUsername } from './oauth'

/** Pragmatic check matching what the server accepts (zod email, ≤ 254). */
export function isValidEmail(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export function emailError(value: string): string | null {
  if (!value.trim()) return '이메일을 입력해 주세요.'
  return isValidEmail(value) ? null : '올바른 이메일 주소를 입력해 주세요.'
}

export function passwordError(value: string): string | null {
  if (value.length < 8) return '8자 이상 입력해 주세요.'
  if (value.length > 72) return '72자 이하로 입력해 주세요.'
  return null
}

export function repeatError(password: string, repeat: string): string | null {
  return repeat && password !== repeat ? '비밀번호가 일치하지 않아요.' : null
}

/** a***e@example.com — enough to recognise your own address on a shared screen. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at <= 0) return email
  const local = email.slice(0, at)
  const domain = email.slice(at)
  if (local.length <= 2) return `${local[0]}*${domain}`
  return `${local[0]}${'*'.repeat(Math.min(6, local.length - 2))}${local[local.length - 1]}${domain}`
}

/** Default handle for a new account: the email local part, sanitized like a GitHub login. */
export function usernameFromEmail(email: string): string {
  return sanitizeUsername(email.trim().split('@')[0] ?? '')
}

export const USERNAME_RE = /^[a-z0-9_.]{2,32}$/

export function usernameError(value: string): string | null {
  if (!value) return '사용자명을 입력해 주세요.'
  return USERNAME_RE.test(value) ? null : '영문 소문자, 숫자, 밑줄(_), 마침표(.)로 2~32자여야 해요.'
}

/** Where the router must send a signed-in user: the email gate while emailRequired, back to the app afterwards. */
export function gateRedirect(
  user: Pick<User, 'emailRequired'> | null,
  route: { name?: string | symbol | null; requiresAuth: boolean },
): string | null {
  if (!user) return null
  if (user.emailRequired && route.requiresAuth) return '/verify-email'
  if (!user.emailRequired && route.name === 'email-gate') return '/channels/@me'
  return null
}

/** Seconds left of a cooldown that started at `startedAt` (ms) and lasts `seconds`. */
export function cooldownLeft(startedAt: number | null, seconds: number, now = Date.now()): number {
  if (startedAt === null) return 0
  return Math.max(0, Math.ceil((startedAt + seconds * 1000 - now) / 1000))
}

/** `details.remainingAttempts` of a wrong-code error (0 = the code is void, ask for a new one). */
export function remainingAttempts(error: unknown): number | null {
  const details = (error as { details?: unknown } | null)?.details as { remainingAttempts?: unknown } | undefined
  return typeof details?.remainingAttempts === 'number' ? details.remainingAttempts : null
}

/** Korean message for a rejected code. */
export function codeErrorMessage(error: unknown, fallback: string): string {
  const left = remainingAttempts(error)
  if (left === null) return fallback
  return left > 0 ? `코드가 올바르지 않아요. ${left}번 더 시도할 수 있어요.` : '코드가 만료되었어요. 코드를 다시 받아 주세요.'
}
