import { defineStore } from 'pinia'
import { usersApi, type Presence, type User, type UserRef } from '@/api'
import { useAuthStore } from './auth'

const PRESENCE_ORDER: Record<Presence, number> = { online: 0, idle: 1, dnd: 2, offline: 3 }

function compareName(a: User, b: User): number {
  return a.displayName.localeCompare(b.displayName, 'ko')
}

export const useUsersStore = defineStore('users', {
  state: () => ({
    byId: {} as Record<string, User>,
    loaded: false,
  }),
  getters: {
    all(state): User[] {
      return Object.values(state.byId).sort(compareName)
    },
    online(): User[] {
      return this.all
        .filter((u) => u.presence !== 'offline')
        .sort((a, b) => PRESENCE_ORDER[a.presence] - PRESENCE_ORDER[b.presence] || compareName(a, b))
    },
    offline(): User[] {
      return this.all.filter((u) => u.presence === 'offline')
    },
    onlineCount(): number {
      return this.online.length
    },
    get: (state) => (id: string): User | undefined => state.byId[id],
    displayName:
      (state) =>
      (id: string): string =>
        state.byId[id]?.displayName ?? '알 수 없는 사용자',
    mentionTargets(state) {
      return Object.values(state.byId).map((u) => ({ id: u.id, displayName: u.displayName, username: u.username }))
    },
  },
  actions: {
    async load() {
      const { users } = await usersApi.fetchUsers()
      const next: Record<string, User> = {}
      for (const user of users) next[user.id] = user
      // keep presences we already know from the gateway if the REST payload is older
      this.byId = next
      this.loaded = true
      const auth = useAuthStore()
      if (auth.user && next[auth.user.id]) auth.applyUserUpdate(next[auth.user.id]!)
    },
    upsert(user: User) {
      const existing = this.byId[user.id]
      this.byId[user.id] = { ...existing, ...user, presence: user.presence ?? existing?.presence ?? 'offline' }
      useAuthStore().applyUserUpdate(this.byId[user.id]!)
    },
    setPresence(userId: string, presence: Presence) {
      const user = this.byId[userId]
      if (user) user.presence = presence
    },
    setPresences(map: Record<string, Presence>) {
      for (const [userId, presence] of Object.entries(map)) this.setPresence(userId, presence)
      // everyone not listed is offline
      for (const user of Object.values(this.byId)) {
        if (!(user.id in map)) user.presence = 'offline'
      }
    },
    /** Ensure a UserRef embedded in a message is at least known by name. */
    rememberRef(ref: UserRef) {
      if (this.byId[ref.id]) return
      this.byId[ref.id] = {
        ...ref,
        role: 'member',
        status: 'online',
        presence: 'offline',
        customStatus: null,
        aboutMe: null,
        createdAt: new Date(0).toISOString(),
      }
    },
    reset() {
      this.byId = {}
      this.loaded = false
    },
  },
})
