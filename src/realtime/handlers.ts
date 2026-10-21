import type { Router } from 'vue-router'
import type { Message } from '@/api'
import type { AppSocket } from './socket'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useReadStatesStore } from '@/stores/readStates'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import { mentionsUser } from '@/utils/mentions'
import { toPlainText } from '@/utils/markdown'
import { showDesktopNotification } from '@/utils/notify'
import { sounds } from '@/utils/sounds'

function notifyIncoming(message: Message, router: Router): void {
  const auth = useAuthStore()
  const me = auth.userId
  if (!me || message.author.id === me) return
  const ui = useUiStore()
  if (ui.isViewing(message.channelId)) return
  const channels = useChannelsStore()
  const settings = useSettingsStore()
  const channel = channels.get(message.channelId)
  const isDm = channel?.type === 'dm'
  const mentioned = isDm || mentionsUser(message.content, message.mentions, message.mentionEveryone, me)
  if (!mentioned && !settings.settings.notifyAllMessages) return

  const users = useUsersStore()
  const volume = settings.effectiveSoundVolume
  if (volume > 0) (mentioned ? sounds.mention : sounds.message)(volume)

  if (settings.settings.desktopNotifications) {
    const body = toPlainText(message.content, { resolveMention: (id) => users.displayName(id) }) ||
      (message.attachments.length ? `첨부 파일 ${message.attachments.length}개` : '')
    const where = channel ? (isDm ? '' : ` (#${channel.name})`) : ''
    showDesktopNotification({
      title: `${message.author.displayName}${where}`,
      body,
      icon: message.author.avatarUrl,
      tag: `msg-${message.channelId}`,
      onClick: () => {
        void router.push(isDm ? `/channels/@me/${message.channelId}` : `/channels/${message.channelId}`)
      },
    })
  }
}

export function registerHandlers(socket: AppSocket, router: Router): void {
  const auth = useAuthStore()
  const users = useUsersStore()
  const channels = useChannelsStore()
  const messages = useMessagesStore()
  const readStates = useReadStatesStore()
  const voice = useVoiceStore()
  const ui = useUiStore()

  socket.on('ready', (payload) => {
    voice.setMySocketId(payload.sessionId)
    auth.applyUserUpdate(payload.user)
    users.upsert(payload.user)
    users.setPresences(payload.presences)
    voice.setStates(payload.voiceStates)
    ui.setConnection('connected')
  })

  socket.on('message:create', (message) => {
    messages.onCreate(message)
    notifyIncoming(message, router)
  })
  socket.on('message:update', (message) => messages.onUpdate(message))
  socket.on('message:delete', ({ channelId, messageId }) => messages.onDelete(channelId, messageId))
  socket.on('message:reactions', ({ channelId, messageId, reactions }) =>
    messages.onReactions(channelId, messageId, reactions),
  )
  socket.on('message:pin', ({ channelId, messageId, pinned }) => messages.onPin(channelId, messageId, pinned))

  socket.on('channel:create', (channel) => channels.upsert(channel))
  socket.on('channel:update', (channel) => channels.upsert(channel))
  socket.on('channel:delete', ({ channelId }) => {
    channels.remove(channelId)
    messages.removeChannel(channelId)
    readStates.remove(channelId)
    if (ui.activeChannelId === channelId) {
      ui.toast('채널이 삭제되었습니다.', 'info')
      void router.replace('/channels/@me')
    }
  })

  socket.on('user:create', (user) => users.upsert(user))
  socket.on('user:update', (user) => users.upsert(user))
  socket.on('presence:update', ({ userId, presence }) => users.setPresence(userId, presence))
  socket.on('typing', ({ channelId, userId }) => messages.onTyping(channelId, userId))
  socket.on('readstate:update', (readState) => readStates.apply(readState))

  socket.on('voice:state', (state) => voice.onState(state))
  socket.on('rtc:signal', (signal) => void voice.onSignal(signal))
  socket.on('screen:watch', ({ from }) => voice.onScreenWatch(from))
  socket.on('screen:unwatch', ({ from }) => voice.onScreenUnwatch(from))
}
