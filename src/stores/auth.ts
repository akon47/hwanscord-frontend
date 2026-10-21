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
        void usersApi.updateMe({ settings: next as unknown as Record<string, unknown> }).catch(() => undefined)
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
    async login(username: string, password: string) {
      const res = await authApi.login({ username, password })
      this.setSession(res.token, res.user)
      return res.user
    },
    async register(username: string, password: string, displayName?: string) {
      const res = await authApi.register({ username, password, displayName: displayName || undefined })
      this.setSession(res.token, res.user)
      return res.user
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
    async changePassword(currentPassword: string, newPassword: string) {
      await usersApi.updatePassword({ currentPassword, newPassword })
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
