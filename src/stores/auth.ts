import { defineStore } from 'pinia'
import { authApi, usersApi, type User } from '@/api'
import type { UpdateMeBody } from '@/api/users'
import { getToken, setToken, onUnauthorized } from '@/api/token'
import { useSettingsStore } from './settings'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: null as User | null,
    /** true once the initial session check finished (either way) */
    ready: false,
  }),
  getters: {
    isLoggedIn: (s) => Boolean(s.token && s.user),
    isAdmin: (s) => s.user?.role === 'admin',
    userId: (s) => s.user?.id ?? null,
  },
  actions: {
    installUnauthorizedHandler(onLogout: () => void) {
      onUnauthorized(() => {
        if (!this.token) return
        this.clearSession()
        onLogout()
      })
    },
    setSession(token: string, user: User) {
      this.token = token
      this.user = user
      setToken(token)
      this.applyRemoteSettings(user)
    },
    clearSession() {
      this.token = null
      this.user = null
      setToken(null)
    },
    applyRemoteSettings(user: User) {
      const settings = useSettingsStore()
      settings.setSyncHandler((next) => {
        void usersApi
          .updateMe({ settings: next as unknown as Record<string, unknown> })
          .catch(() => undefined)
      })
      settings.hydrateFromServer(user.settings)
    },
    /** Validate the stored token on startup. */
    async bootstrap(): Promise<boolean> {
      if (!this.token) {
        this.ready = true
        return false
      }
      try {
        const { user } = await authApi.fetchMe()
        this.user = user
        this.applyRemoteSettings(user)
        return true
      } catch {
        this.clearSession()
        return false
      } finally {
        this.ready = true
      }
    },
    /** `login` is the email, or the username for legacy accounts. */
    async login(login: string, password: string) {
      const res = await authApi.login({ login, password })
      this.setSession(res.token, res.user)
      return res.user
    },
    async register(body: { signupToken: string; password: string; displayName?: string; username?: string }) {
      const res = await authApi.register(body)
      this.setSession(res.token, res.user)
      return res.user
    },
    async loginWithToken(token: string) {
      this.token = token
      setToken(token)
      try {
        const { user } = await authApi.fetchMe()
        this.setSession(token, user)
        return user
      } catch (error) {
        this.clearSession()
        throw error
      }
    },
    async completeGithubSignup(signupToken: string, username: string, displayName?: string) {
      const res = await authApi.completeGithubSignup({
        signupToken,
        username,
        displayName: displayName || undefined,
      })
      this.setSession(res.token, res.user)
      return res.user
    },
    /** Starts linking GitHub to the signed-in account (full-page navigation to GitHub). */
    async startGithubLink(next: string) {
      const { url } = await authApi.githubLinkUrl(next)
      window.location.assign(url)
    },
    async unlinkGithub() {
      const { user } = await usersApi.unlinkGithub()
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
    async requestEmailCode(email: string, currentPassword: string | null) {
      await usersApi.requestEmailCode(currentPassword === null ? { email } : { email, currentPassword })
    },
    /** Sets the verified email; lifts the email gate. */
    async verifyEmailCode(code: string) {
      const { user } = await usersApi.verifyEmailCode(code)
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
    /** Re-reads my profile (connections / hasPassword) from the server. */
    async refreshMe() {
      const { user } = await authApi.fetchMe()
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
    logout() {
      useSettingsStore().setSyncHandler(null)
      this.clearSession()
    },
    /** Called from the users store when a user:update for me arrives. */
    applyUserUpdate(user: User) {
      if (this.user && user.id === this.user.id) {
        this.user = { ...this.user, ...user, settings: user.settings ?? this.user.settings }
      }
    },
    async patchMe(body: UpdateMeBody) {
      const { user } = await usersApi.updateMe(body)
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
    /** Pass `null` as currentPassword to set the first password of a GitHub-only account. */
    async changePassword(currentPassword: string | null, newPassword: string) {
      const { token } = await usersApi.updatePassword(
        currentPassword === null ? { newPassword } : { currentPassword, newPassword },
      )
      // every other session was signed out; keep this one with the fresh token (the socket reconnects with it)
      this.token = token
      setToken(token)
      if (this.user && this.user.hasPassword === false) this.user = { ...this.user, hasPassword: true }
    },
    async uploadAvatar(file: File, onProgress?: (ratio: number) => void) {
      const { user } = await usersApi.uploadAvatar(file, onProgress).promise
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
    async removeAvatar() {
      const { user } = await usersApi.removeAvatar()
      this.user = { ...user, settings: user.settings ?? this.user?.settings }
      return this.user
    },
  },
})
