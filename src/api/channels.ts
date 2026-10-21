import { http } from './client'
import type { Channel, ChannelType, Message, ReadState } from './types'

export function fetchChannels() {
  return http.get<{ channels: Channel[] }>('/channels')
}

export function createChannel(body: { type: Exclude<ChannelType, 'dm'>; name: string; topic?: string }) {
  return http.post<{ channel: Channel }>('/channels', body)
}

export function updateChannel(id: string, body: { name?: string; topic?: string | null; position?: number }) {
  return http.patch<{ channel: Channel }>(`/channels/${id}`, body)
}

export function deleteChannel(id: string) {
  return http.delete<void>(`/channels/${id}`)
}

export function openDm(userId: string) {
  return http.post<{ channel: Channel }>('/channels/dm', { userId })
}

export function fetchPins(channelId: string) {
  return http.get<{ messages: Message[] }>(`/channels/${channelId}/pins`)
}

export function pinMessage(channelId: string, messageId: string) {
  return http.put<{ message: Message }>(`/channels/${channelId}/pins/${messageId}`)
}

export function unpinMessage(channelId: string, messageId: string) {
  return http.delete<{ message: Message }>(`/channels/${channelId}/pins/${messageId}`)
}

export function ackChannel(channelId: string, messageId: string) {
  return http.post<{ readState: ReadState }>(`/channels/${channelId}/ack`, { messageId })
}

export function fetchReadStates() {
  return http.get<{ readStates: ReadState[] }>('/read-states')
}
