import { defineStore } from 'pinia'
import { messagesApi, channelsApi, type Attachment, type Message, type MessageReply, type Reaction } from '@/api'
import type { SendMessageBody } from '@/api/messages'
import { errorMessage } from '@/api/client'
import { createNonce } from '@/utils/format'
import { useAuthStore } from './auth'
import { useChannelsStore } from './channels'
import { useReadStatesStore } from './readStates'
import { useUiStore } from './ui'
import { useUsersStore } from './users'

export const PAGE_SIZE = 50
export const TYPING_TTL_MS = 8000

export interface ChannelMessages {
  items: Message[]
  hasMore: boolean
  loaded: boolean
  loading: boolean
  error: string | null
  /** true while the bucket shows a window around a jumped-to message instead of the newest messages */
  detached: boolean
}

export interface PendingMessage {
  nonce: string
  channelId: string
  content: string
  attachments: Attachment[]
  replyTo: MessageReply | null
  createdAt: string
  status: 'sending' | 'failed'
  error: string | null
  body: SendMessageBody
}

function emptyChannel(): ChannelMessages {
  return { items: [], hasMore: true, loaded: false, loading: false, error: null, detached: false }
}

/** Insert keeping ascending id order; replaces an existing message with the same id. */
function insertSorted(items: Message[], message: Message): void {
  const existing = items.findIndex((m) => m.id === message.id)
  if (existing >= 0) {
    items.splice(existing, 1, message)
    return
  }
  let lo = 0
  let hi = items.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (items[mid]!.id < message.id) lo = mid + 1
    else hi = mid
  }
  items.splice(lo, 0, message)
}

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    byChannel: {} as Record<string, ChannelMessages>,
    pending: [] as PendingMessage[],
    /** channelId → userId → expiresAt (ms) */
    typing: {} as Record<string, Record<string, number>>,
    /** channelId → pinned messages (loaded on demand) */
    pins: {} as Record<string, Message[]>,
  }),
  getters: {
    channel: (state) => (channelId: string): ChannelMessages => state.byChannel[channelId] ?? emptyChannel(),
    list: (state) => (channelId: string): Message[] => state.byChannel[channelId]?.items ?? [],
    pendingFor: (state) => (channelId: string): PendingMessage[] =>
      state.pending.filter((p) => p.channelId === channelId),
    lastMessage:
      (state) =>
      (channelId: string): Message | undefined => {
        const items = state.byChannel[channelId]?.items
        return items && items.length > 0 ? items[items.length - 1] : undefined
      },
    typingUserIds:
      (state) =>
      (channelId: string, now = Date.now()): string[] => {
        const map = state.typing[channelId]
        if (!map) return []
        const me = useAuthStore().userId
        return Object.entries(map)
          .filter(([userId, expiresAt]) => expiresAt > now && userId !== me)
          .map(([userId]) => userId)
      },
    find:
      (state) =>
      (channelId: string, messageId: string): Message | undefined =>
        state.byChannel[channelId]?.items.find((m) => m.id === messageId),
  },
  actions: {
    ensure(channelId: string): ChannelMessages {
      if (!this.byChannel[channelId]) this.byChannel[channelId] = emptyChannel()
      return this.byChannel[channelId]!
    },
    async loadInitial(channelId: string, force = false) {
      const bucket = this.ensure(channelId)
      if ((bucket.loaded && !force) || bucket.loading) return
      bucket.loading = true
      bucket.error = null
      try {
        const { messages, hasMore } = await messagesApi.fetchMessages(channelId, { limit: PAGE_SIZE })
        bucket.items = [...messages].sort((a, b) => (a.id < b.id ? -1 : 1))
        bucket.hasMore = hasMore
        bucket.loaded = true
        const users = useUsersStore()
        for (const m of messages) users.rememberRef(m.author)
      } catch (error) {
        bucket.error = errorMessage(error)
        throw error
      } finally {
        bucket.loading = false
      }
    },
    async loadOlder(channelId: string): Promise<number> {
      const bucket = this.ensure(channelId)
      if (!bucket.loaded || !bucket.hasMore || bucket.loading) return 0
      const oldest = bucket.items[0]
      if (!oldest) return 0
      bucket.loading = true
      try {
        const { messages, hasMore } = await messagesApi.fetchMessages(channelId, { limit: PAGE_SIZE, before: oldest.id })
        for (const m of messages) insertSorted(bucket.items, m)
        bucket.hasMore = hasMore
        return messages.length
      } finally {
        bucket.loading = false
      }
    },
    /** Fill the gap after a reconnect. */
    async loadAfterLast(channelId: string) {
      const bucket = this.ensure(channelId)
      if (!bucket.loaded) return
      const last = bucket.items[bucket.items.length - 1]
      if (!last) {
        await this.loadInitial(channelId, true)
        return
      }
      let after = last.id
      for (let page = 0; page < 5; page++) {
        const { messages, hasMore } = await messagesApi.fetchMessages(channelId, { limit: 100, after })
        for (const m of messages) this.onCreate(m, { silent: true })
        if (!hasMore || messages.length === 0) break
        after = messages[messages.length - 1]!.id
      }
    },
    /** Load the page containing `messageId` if it is not loaded (jump from search / pins). */
    async loadAround(channelId: string, messageId: string) {
      const bucket = this.ensure(channelId)
      if (bucket.items.some((m) => m.id === messageId)) return true
      const [before, after] = await Promise.all([
        messagesApi.fetchMessages(channelId, { limit: 25, before: messageId }),
        messagesApi.fetchMessages(channelId, { limit: 25, after: messageId }),
      ])
      // We reset the bucket to a window around the target. hasMore in both directions is possible; we only keep
      // "older" paging and let the user jump back to present with the button.
      bucket.items = [...before.messages, ...after.messages].sort((a, b) => (a.id < b.id ? -1 : 1))
      bucket.hasMore = before.hasMore
      bucket.loaded = true
      bucket.detached = after.hasMore
      return bucket.items.some((m) => m.id === messageId)
    },
    /** Return to the newest messages after a jump. */
    async loadLatest(channelId: string) {
      const bucket = this.ensure(channelId)
      bucket.loaded = false
      bucket.detached = false
      await this.loadInitial(channelId, true)
    },

    // ---- sending -------------------------------------------------------------------------------------------
    async send(
      channelId: string,
      input: { content: string; attachments: Attachment[]; replyTo: Message | null },
    ): Promise<void> {
      const nonce = createNonce()
      const body: SendMessageBody = {
        content: input.content || undefined,
        attachmentIds: input.attachments.length ? input.attachments.map((a) => a.id) : undefined,
        replyTo: input.replyTo?.id,
        nonce,
      }
      const pending: PendingMessage = {
        nonce,
        channelId,
        content: input.content,
        attachments: input.attachments,
        replyTo: input.replyTo
          ? { id: input.replyTo.id, author: input.replyTo.author, content: input.replyTo.content.slice(0, 200), deleted: false }
          : null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        error: null,
        body,
      }
      this.pending.push(pending)
      await this.flush(pending)
    },
    async flush(pending: PendingMessage) {
      pending.status = 'sending'
      pending.error = null
      try {
        const { message } = await messagesApi.sendMessage(pending.channelId, pending.body)
        this.onCreate(message, { silent: true })
        this.pending = this.pending.filter((p) => p.nonce !== pending.nonce)
        useReadStatesStore().ack(pending.channelId, message.id)
      } catch (error) {
        const entry = this.pending.find((p) => p.nonce === pending.nonce)
        if (entry) {
          entry.status = 'failed'
          entry.error = errorMessage(error)
        }
        throw error
      }
    },
    async retry(nonce: string) {
      const pending = this.pending.find((p) => p.nonce === nonce)
      if (pending) await this.flush(pending)
    },
    discardPending(nonce: string) {
      this.pending = this.pending.filter((p) => p.nonce !== nonce)
    },

    async edit(channelId: string, messageId: string, content: string) {
      const { message } = await messagesApi.editMessage(channelId, messageId, content)
      this.onUpdate(message)
    },
    async remove(channelId: string, messageId: string) {
      await messagesApi.deleteMessage(channelId, messageId)
      this.onDelete(channelId, messageId)
    },
    async toggleReaction(message: Message, emoji: string) {
      const me = useAuthStore().userId
      const mine = message.reactions.find((r) => r.emoji === emoji)?.userIds.includes(me ?? '') ?? false
      const { message: updated } = mine
        ? await messagesApi.removeReaction(message.channelId, message.id, emoji)
        : await messagesApi.addReaction(message.channelId, message.id, emoji)
      this.onUpdate(updated)
    },
    async setPinned(message: Message, pinned: boolean) {
      const { message: updated } = pinned
        ? await channelsApi.pinMessage(message.channelId, message.id)
        : await channelsApi.unpinMessage(message.channelId, message.id)
      this.onUpdate(updated)
      this.onPin(message.channelId, message.id, pinned)
    },
    async loadPins(channelId: string) {
      const { messages } = await channelsApi.fetchPins(channelId)
      this.pins[channelId] = messages
      return messages
    },

    // ---- realtime --------------------------------------------------------------------------------------------
    onCreate(message: Message, options: { silent?: boolean } = {}) {
      const users = useUsersStore()
      users.rememberRef(message.author)
      useChannelsStore().touch(message.channelId, message.id, message.createdAt)
      // our own optimistic message
      if (message.nonce) this.pending = this.pending.filter((p) => p.nonce !== message.nonce)
      const bucket = this.byChannel[message.channelId]
      if (bucket?.loaded && !bucket.detached) insertSorted(bucket.items, message)
      // typing stops when the message arrives
      const typing = this.typing[message.channelId]
      if (typing) delete typing[message.author.id]
      if (!options.silent) {
        const ui = useUiStore()
        const readStates = useReadStatesStore()
        if (ui.isViewing(message.channelId)) readStates.ack(message.channelId, message.id)
        else readStates.noteIncoming(message)
      }
    },
    onUpdate(message: Message) {
      const bucket = this.byChannel[message.channelId]
      if (bucket?.loaded) {
        const idx = bucket.items.findIndex((m) => m.id === message.id)
        if (idx >= 0) bucket.items.splice(idx, 1, message)
      }
      const pins = this.pins[message.channelId]
      if (pins) {
        const idx = pins.findIndex((m) => m.id === message.id)
        if (idx >= 0) pins.splice(idx, 1, message)
      }
      // replies quoting this message
      if (bucket) {
        for (const m of bucket.items) {
          if (m.replyTo?.id === message.id) m.replyTo = { ...m.replyTo, content: message.content.slice(0, 200) }
        }
      }
    },
    onDelete(channelId: string, messageId: string) {
      const bucket = this.byChannel[channelId]
      if (bucket) {
        bucket.items = bucket.items.filter((m) => m.id !== messageId)
        for (const m of bucket.items) {
          if (m.replyTo?.id === messageId) m.replyTo = { ...m.replyTo, deleted: true, content: '' }
        }
      }
      if (this.pins[channelId]) this.pins[channelId] = this.pins[channelId]!.filter((m) => m.id !== messageId)
    },
    onReactions(channelId: string, messageId: string, reactions: Reaction[]) {
      const message = this.find(channelId, messageId)
      if (message) message.reactions = reactions
    },
    onPin(channelId: string, messageId: string, pinned: boolean) {
      const message = this.find(channelId, messageId)
      if (message) message.pinned = pinned
      const pins = this.pins[channelId]
      if (pins) {
        if (!pinned) this.pins[channelId] = pins.filter((m) => m.id !== messageId)
        else if (message && !pins.some((m) => m.id === messageId)) pins.unshift(message)
      }
    },
    onTyping(channelId: string, userId: string) {
      if (!this.typing[channelId]) this.typing[channelId] = {}
      this.typing[channelId]![userId] = Date.now() + TYPING_TTL_MS
    },
    pruneTyping(now = Date.now()) {
      for (const [channelId, map] of Object.entries(this.typing)) {
        for (const [userId, expiresAt] of Object.entries(map)) {
          if (expiresAt <= now) delete map[userId]
        }
        if (Object.keys(map).length === 0) delete this.typing[channelId]
      }
    },
    removeChannel(channelId: string) {
      delete this.byChannel[channelId]
      delete this.typing[channelId]
      delete this.pins[channelId]
      this.pending = this.pending.filter((p) => p.channelId !== channelId)
    },
    reset() {
      this.byChannel = {}
      this.pending = []
      this.typing = {}
      this.pins = {}
    },
  },
})

