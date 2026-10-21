import { http, upload } from './client'
import type { Status, User } from './types'

export interface UpdateMeBody {
  username?: string
  displayName?: string
  aboutMe?: string | null
  customStatus?: string | null
  status?: Status
  settings?: Record<string, unknown>
}

export function fetchUsers() {
  return http.get<{ users: User[] }>('/users')
}

export function fetchUser(id: string) {
  return http.get<{ user: User }>(`/users/${id}`)
}

export function updateMe(body: UpdateMeBody) {
  return http.patch<{ user: User }>('/users/me', body)
}

/** currentPassword may be omitted only while the account has no password (hasPassword === false). */
/** Returns a fresh token: every other session (and this one's old token) is signed out. */
export function updatePassword(body: { currentPassword?: string; newPassword: string }) {
  return http.patch<{ token: string }>('/users/me/password', body)
}

/** Sends a 6-digit code to the address; nothing changes until it is entered. Allowed while gated. */
export function requestEmailCode(body: { email: string; currentPassword?: string }) {
  return http.post<void>('/users/me/email', body)
}

/** Sets the email (and lifts the email gate). A wrong code fails with `details.remainingAttempts`. */
export function verifyEmailCode(code: string) {
  return http.post<{ user: User }>('/users/me/email/verify', { code })
}

export function unlinkGithub() {
  return http.delete<{ user: User }>('/users/me/oauth/github')
}

export function uploadAvatar(file: File, onProgress?: (ratio: number) => void) {
  const form = new FormData()
  form.append('avatar', file)
  return upload<{ user: User }>('PUT', '/users/me/avatar', form, onProgress)
}

export function removeAvatar() {
  return http.delete<{ user: User }>('/users/me/avatar')
}
