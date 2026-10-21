import { defineStore } from 'pinia'
import { channelsApi, type Channel, type ChannelType } from '@/api'
import { useAuthStore } from './auth'
import { useUsersStore } from './users'

function byPosition(a: Channel, b: Channel): number {
  return a.position - b.position || a.createdAt.localeCompare(b.createdAt)
}

function byRecent(a: Channel, b: Channel): number {
  return (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt)
}

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    byId: {} as Record<string, Channel>,
    loaded: false,
  }),
  getters: {
    all: (state): Channel[] => Object.values(state.byId),
    textChannels(): Channel[] {
      return this.all.filter((c) => c.type === 'text').sort(byPosition)
    },
    voiceChannels(): Channel[] {
      return this.all.filter((c) => c.type === 'voice').sort(byPosition)
    },
    dmChannels(): Channel[] {
      return this.all.filter((c) => c.type === 'dm').sort(byRecent)
    },
    get: (state) => (id: string): Channel | undefined => state.byId[id],
    /** The other participant of a DM channel. */
    dmPartnerId() {
      const me = useAuthStore().userId
      return (channel: Channel): string | null => channel.participants.find((p) => p !== me) ?? channel.participants[0] ?? null
    },
    displayName() {
      const users = useUsersStore()
      return (channel: Channel): string => {
        if (channel.type !== 'dm') return channel.name
        const partnerId = this.dmPartnerId(channel)
        return partnerId ? users.displayName(partnerId) : '다이렉트 메시지'
      }
    },
    canManage() {
      const auth = useAuthStore()
      return (channel: Channel): boolean =>
        channel.type !== 'dm' && (auth.isAdmin || (channel.createdBy !== null && channel.createdBy === auth.userId))
    },
    firstTextChannelId(): string | null {
      return this.textChannels[0]?.id ?? null
    },
  },
  actions: {
    async load() {
      const { channels } = await channelsApi.fetchChannels()
      const next: Record<string, Channel> = {}
      for (const channel of channels) next[channel.id] = channel
      this.byId = next
      this.loaded = true
    },
    upsert(channel: Channel) {
      this.byId[channel.id] = channel
    },
    remove(channelId: string) {
      delete this.byId[channelId]
    },
    touch(channelId: string, messageId: string, at: string) {
      const channel = this.byId[channelId]
      if (!channel) return
      channel.lastMessageId = messageId
      channel.lastMessageAt = at
    },
    async create(type: Exclude<ChannelType, 'dm'>, name: string, topic?: string) {
      const { channel } = await channelsApi.createChannel({ type, name, topic: topic || undefined })
      this.upsert(channel)
      return channel
    },
    async update(id: string, body: { name?: string; topic?: string | null; position?: number }) {
      const { channel } = await channelsApi.updateChannel(id, body)
      this.upsert(channel)
      return channel
    },
    async destroy(id: string) {
      await channelsApi.deleteChannel(id)
      this.remove(id)
    },
    async openDm(userId: string) {
      const { channel } = await channelsApi.openDm(userId)
      this.upsert(channel)
      return channel
    },
    reset() {
      this.byId = {}
      this.loaded = false
    },
  },
})
