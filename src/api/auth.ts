import { http } from './client'
import type { AuthProviders, AuthResponse, User } from './types'

export function register(body: { username: string; password: string; displayName?: string }) {
  return http.post<AuthResponse>('/auth/register', body)
}

export function login(body: { username: string; password: string }) {
  return http.post<AuthResponse>('/auth/login', body)
}

export function fetchMe() {
  return http.get<{ user: User }>('/auth/me')
}

export function fetchProviders() {
  return http.get<AuthProviders>('/auth/providers')
}

/** Full-page navigation target that starts the GitHub login (the server redirects to GitHub). */
export function githubStartUrl(next: string) {
  return `/api/v1/auth/oauth/github/start?${new URLSearchParams({ next }).toString()}`
}

export function githubLinkUrl(next: string) {
  return http.post<{ url: string }>('/auth/oauth/github/link', { next })
}

export function completeGithubSignup(body: { signupToken: string; username: string; displayName?: string }) {
  return http.post<AuthResponse>('/auth/oauth/github/complete', body)
}
