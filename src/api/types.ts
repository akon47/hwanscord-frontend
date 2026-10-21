// Mirrors hwanscord-backend/docs/API.md. Keep in sync with the contract.

export type Presence = 'online' | 'idle' | 'dnd' | 'offline'
export type Status = 'online' | 'idle' | 'dnd' | 'invisible'
export type Role = 'admin' | 'member'
export type ChannelType = 'text' | 'voice' | 'dm'

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: Role
  status: Status
  presence: Presence
  customStatus: string | null
  aboutMe: string | null
  createdAt: string
  settings?: Record<string, unknown>
  /** self only: false for GitHub-created accounts that never set a password */
  hasPassword?: boolean
  /** self only: linked OAuth identities */
  connections?: OAuthConnection[]
}

export interface OAuthConnection {
  provider: 'github'
  login: string
}

export interface AuthProviders {
  github: boolean
}

export interface UserRef {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface Channel {
  id: string
  type: ChannelType
  name: string
  topic: string | null
  position: number
  createdBy: string | null
  participants: string[]
  lastMessageId: string | null
  lastMessageAt: string | null
  createdAt: string
}

export interface Attachment {
  id: string
  url: string
  filename: string
  size: number
  contentType: string
  width: number | null
  height: number | null
}

export interface Reaction {
  emoji: string
  count: number
  userIds: string[]
}

export interface MessageReply {
  id: string
  author: UserRef | null
  content: string
  deleted: boolean
}

export interface Message {
  id: string
  channelId: string
  author: UserRef
  content: string
  attachments: Attachment[]
  replyTo: MessageReply | null
  mentions: string[]
  mentionEveryone: boolean
  reactions: Reaction[]
  pinned: boolean
  editedAt: string | null
  createdAt: string
  nonce?: string
}

export interface ReadState {
  channelId: string
  lastReadMessageId: string | null
  unreadCount: number
  mentionCount: number
}

export interface VoiceMember {
  userId: string
  socketId: string
  muted: boolean
  deafened: boolean
  streaming: boolean
}

export interface VoiceState {
  channelId: string
  members: VoiceMember[]
}

export interface IceServer {
  urls: string[]
  username?: string
  credential?: string
}

export interface IceServersResponse {
  iceServers: IceServer[]
  ttl: number
  relay: boolean
}

export interface RtcUsage {
  month: string
  egressGB: number
  budgetGB: number
  relayEnabled: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ReadyPayload {
  sessionId: string
  user: User
  presences: Record<string, Presence>
  voiceStates: VoiceState[]
}

export type SignalScope = 'voice' | 'screen'
export type SignalType = 'offer' | 'answer' | 'candidate'

export interface RtcSignal {
  from: string
  scope: SignalScope
  type: SignalType
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export type SocketAck<T = unknown> =
  { ok: true; data?: T } | { ok: false; error: { code: string; message: string } }

/** Server → client events (API.md). */
export interface ServerEvents {
  ready: (p: ReadyPayload) => void
  'message:create': (m: Message) => void
  'message:update': (m: Message) => void
  'message:delete': (p: { channelId: string; messageId: string }) => void
  'message:reactions': (p: { channelId: string; messageId: string; reactions: Reaction[] }) => void
  'message:pin': (p: { channelId: string; messageId: string; pinned: boolean }) => void
  'channel:create': (c: Channel) => void
  'channel:update': (c: Channel) => void
  'channel:delete': (p: { channelId: string }) => void
  'user:create': (u: User) => void
  'user:update': (u: User) => void
  'presence:update': (p: { userId: string; presence: Presence }) => void
  typing: (p: { channelId: string; userId: string }) => void
  'readstate:update': (r: ReadState) => void
  'voice:state': (s: VoiceState) => void
  'rtc:signal': (s: RtcSignal) => void
  'screen:watch': (p: { from: string }) => void
  'screen:unwatch': (p: { from: string }) => void
}

/** Client → server events (API.md). */
export interface ClientEvents {
  typing: (p: { channelId: string }, ack?: (r: SocketAck) => void) => void
  'voice:join': (p: { channelId: string }, ack: (r: SocketAck<VoiceState>) => void) => void
  'voice:leave': (p: Record<string, never>, ack?: (r: SocketAck) => void) => void
  'voice:update': (
    p: { muted?: boolean; deafened?: boolean; streaming?: boolean },
    ack?: (r: SocketAck) => void,
  ) => void
  'rtc:signal': (
    p: {
      to: string
      scope: SignalScope
      type: SignalType
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit
    },
    ack?: (r: SocketAck) => void,
  ) => void
  'screen:watch': (p: { to: string }, ack?: (r: SocketAck) => void) => void
  'screen:unwatch': (p: { to: string }, ack?: (r: SocketAck) => void) => void
}
