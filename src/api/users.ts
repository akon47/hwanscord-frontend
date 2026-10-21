import { http, upload } from './client'
import type { Status, User } from './types'

export interface UpdateMeBody {
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

export function updatePassword(body: { currentPassword: string; newPassword: string }) {
  return http.patch<void>('/users/me/password', body)
}

export function uploadAvatar(file: File, onProgress?: (ratio: number) => void) {
  const form = new FormData()
  form.append('avatar', file)
  return upload<{ user: User }>('PUT', '/users/me/avatar', form, onProgress)
}

export function removeAvatar() {
  return http.delete<{ user: User }>('/users/me/avatar')
}
