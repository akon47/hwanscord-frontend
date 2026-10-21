import { http } from './client'
import type { Message } from './types'

export interface FetchMessagesQuery {
  limit?: number
  before?: string
  after?: string
}

export function fetchMessages(channelId: string, query: FetchMessagesQuery = {}) {
  return http.get<{ messages: Message[]; hasMore: boolean }>(`/channels/${channelId}/messages`, {
    limit: query.limit ?? 50,
    before: query.before,
    after: query.after,
  })
}

export interface SendMessageBody {
  content?: string
  attachmentIds?: string[]
  replyTo?: string
  nonce?: string
}

export function sendMessage(channelId: string, body: SendMessageBody) {
  return http.post<{ message: Message }>(`/channels/${channelId}/messages`, body)
}

export function editMessage(channelId: string, messageId: string, content: string) {
  return http.patch<{ message: Message }>(`/channels/${channelId}/messages/${messageId}`, { content })
}

export function deleteMessage(channelId: string, messageId: string) {
  return http.delete<void>(`/channels/${channelId}/messages/${messageId}`)
}

export function addReaction(channelId: string, messageId: string, emoji: string) {
  return http.put<{ message: Message }>(
    `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
  )
}

export function removeReaction(channelId: string, messageId: string, emoji: string) {
  return http.delete<{ message: Message }>(
    `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
  )
}

export interface SearchQuery {
  q: string
  channelId?: string
  authorId?: string
  limit?: number
  offset?: number
}

export function searchMessages(query: SearchQuery) {
  return http.get<{ results: Message[]; total: number }>('/messages/search', {
    q: query.q,
    channelId: query.channelId,
    authorId: query.authorId,
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
  })
}
