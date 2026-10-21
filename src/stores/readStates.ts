import { defineStore } from 'pinia'
import { channelsApi, type Message, type ReadState } from '@/api'
import { mentionsUser } from '@/utils/mentions'
import { useAuthStore } from './auth'
import { useChannelsStore } from './channels'

const ackTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useReadStatesStore = defineStore('readStates', {
  state: () => ({
    byChannel: {} as Record<string, ReadState>,
    loaded: false,
  }),
  getters: {
    get:
      (state) =>
      (channelId: string): ReadState =>
        state.byChannel[channelId] ?? { channelId, lastReadMessageId: null, unreadCount: 0, mentionCount: 0 },
    isUnread() {
      return (channelId: string): boolean => this.get(channelId).unreadCount > 0
    },
    totalMentions(state): number {
      return Object.values(state.byChannel).reduce((sum, rs) => sum + rs.mentionCount, 0)
    },
    dmUnreadTotal(state): number {
      const channels = useChannelsStore()
      return Object.values(state.byChannel)
        .filter((rs) => channels.get(rs.channelId)?.type === 'dm')
        .reduce((sum, rs) => sum + rs.mentionCount, 0)
    },
  },
  actions: {
    async load() {
      const { readStates } = await channelsApi.fetchReadStates()
      const next: Record<string, ReadState> = {}
      for (const rs of readStates) next[rs.channelId] = rs
      this.byChannel = next
      this.loaded = true
    },
    apply(readState: ReadState) {
      this.byChannel[readState.channelId] = readState
      const timer = ackTimers.get(readState.channelId)
      if (timer) {
        clearTimeout(timer)
        ackTimers.delete(readState.channelId)
      }
    },
    /** A message arrived while I am not looking at its channel. */
    noteIncoming(message: Message) {
      const auth = useAuthStore()
      const me = auth.userId
      if (!me) return
      const current = this.get(message.channelId)
      if (message.author.id === me) {
        this.byChannel[message.channelId] = {
          channelId: message.channelId,
          lastReadMessageId: message.id,
          unreadCount: 0,
          mentionCount: 0,
        }
        return
      }
      const isDm = useChannelsStore().get(message.channelId)?.type === 'dm'
      const mentioned = isDm || mentionsUser(message.content, message.mentions, message.mentionEveryone, me)
      this.byChannel[message.channelId] = {
        channelId: message.channelId,
        lastReadMessageId: current.lastReadMessageId,
        unreadCount: current.unreadCount + 1,
        mentionCount: current.mentionCount + (mentioned ? 1 : 0),
      }
    },
    /** Mark as read up to `messageId`, optimistic + debounced server ack. */
    ack(channelId: string, messageId: string) {
      const current = this.get(channelId)
      if (current.lastReadMessageId === messageId && current.unreadCount === 0) return
      if (current.lastReadMessageId && current.lastReadMessageId > messageId) return
      this.byChannel[channelId] = { channelId, lastReadMessageId: messageId, unreadCount: 0, mentionCount: 0 }
      const existing = ackTimers.get(channelId)
      if (existing) clearTimeout(existing)
      ackTimers.set(
        channelId,
        setTimeout(() => {
          ackTimers.delete(channelId)
          void channelsApi
            .ackChannel(channelId, messageId)
            .then(({ readState }) => {
              // only accept if it is not older than what we already show
              const local = this.get(channelId)
              if (!local.lastReadMessageId || readState.lastReadMessageId! >= local.lastReadMessageId) {
                this.byChannel[channelId] = readState
              }
            })
            .catch(() => undefined)
        }, 600),
      )
    },
    remove(channelId: string) {
      delete this.byChannel[channelId]
    },
    reset() {
      this.byChannel = {}
      this.loaded = false
      for (const timer of ackTimers.values()) clearTimeout(timer)
      ackTimers.clear()
    },
  },
})
