import { http } from './client'
import type { AuthProviders, AuthResponse, User } from './types'

/** Signup step 1: mails a 6-digit code (always 204 — an existing address gets a notice instead). */
export function registerStart(email: string) {
  return http.post<void>('/auth/register/start', { email })
}

/** Signup step 2: code → short-lived signup token. A wrong code fails with `details.remainingAttempts`. */
export function registerVerify(email: string, code: string) {
  return http.post<{ signupToken: string }>('/auth/register/verify', { email, code })
}

/** Signup step 3. */
export function register(body: { signupToken: string; password: string; displayName?: string; username?: string }) {
  return http.post<AuthResponse>('/auth/register', body)
}

export function usernameAvailable(username: string) {
  return http.get<{ available: boolean; suggestion: string }>('/auth/username-available', { username })
}

/** `login` is the email, or the username for accounts without one. */
export function login(body: { login: string; password: string }) {
  return http.post<AuthResponse>('/auth/login', body)
}

export function fetchMe() {
  return http.get<{ user: User }>('/auth/me')
}

/** Always resolves (the server answers 204 whether or not the account exists). */
export function forgotPassword(login: string) {
  return http.post<void>('/auth/password/forgot', { login })
}

export function resetPassword(token: string, newPassword: string) {
  return http.post<void>('/auth/password/reset', { token, newPassword })
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
