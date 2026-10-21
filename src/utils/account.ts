import type { User } from '@/api/types'

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

export type EmailBannerState = 'none' | 'missing' | 'unverified'

/** Which account banner to show for the signed-in user. */
export function emailBannerState(user: Pick<User, 'email' | 'emailVerified'> | null, dismissed: boolean): EmailBannerState {
  if (!user || dismissed) return 'none'
  if (!user.email) return 'missing'
  return user.emailVerified ? 'none' : 'unverified'
}

/** Seconds left of a cooldown that started at `startedAt` (ms) and lasts `seconds`. */
export function cooldownLeft(startedAt: number | null, seconds: number, now = Date.now()): number {
  if (startedAt === null) return 0
  return Math.max(0, Math.ceil((startedAt + seconds * 1000 - now) / 1000))
}
