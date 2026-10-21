import { http } from './client'
import type { AuthResponse, User } from './types'

export function register(body: { username: string; password: string; displayName?: string }) {
  return http.post<AuthResponse>('/auth/register', body)
}

export function login(body: { username: string; password: string }) {
  return http.post<AuthResponse>('/auth/login', body)
}

export function fetchMe() {
  return http.get<{ user: User }>('/auth/me')
}
