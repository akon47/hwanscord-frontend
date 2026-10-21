import { http } from './client'
import type { AdminUser } from './types'

export function fetchAdminUsers() {
  return http.get<{ users: AdminUser[] }>('/admin/users')
}

export function issueTemporaryPassword(userId: string) {
  return http.post<{ temporaryPassword: string }>(`/admin/users/${userId}/temporary-password`)
}
