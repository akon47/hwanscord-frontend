// Session lifecycle: load the workspace, open the gateway socket, refetch on reconnect, tear everything down.
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import { resetIceCache } from '@/rtc/ice'
import { registerHandlers } from './handlers'
import { createSocket, disconnectSocket } from './socket'

let active = false
let typingPruneTimer: ReturnType<typeof setInterval> | null = null

export async function loadWorkspace(): Promise<void> {
  await Promise.all([useUsersStore().load(), useChannelsStore().load(), useReadStatesStore().load()])
}

export async function startSession(router: Router): Promise<void> {
  const auth = useAuthStore()
  if (!auth.token || active) return
  active = true
  const ui = useUiStore()
  const messages = useMessagesStore()
  ui.setConnection('connecting')

  await loadWorkspace()

  const socket = createSocket()
  registerHandlers(socket, router)
  let hadConnection = false
  socket.on('connect', () => {
    if (hadConnection) {
      // reconnect: refresh everything we may have missed while offline
      void loadWorkspace()
        .then(async () => {
          if (ui.activeChannelId) await messages.loadAfterLast(ui.activeChannelId)
        })
        .catch(() => undefined)
    }
    hadConnection = true
  })
  socket.on('disconnect', (reason) => {
    ui.setConnection('disconnected')
    useVoiceStore().onSocketDisconnected()
    // the server drops sockets whose sessions were invalidated (password change/reset). socket.io does not
    // retry after a server-side disconnect: reconnect once with the current token — a stale one gets
    // `unauthorized` (→ logout below), a refreshed one simply reconnects.
    if (reason === 'io server disconnect') setTimeout(() => socket.connect(), 500)
  })
  socket.on('connect_error', (error) => {
    if (error.message === 'unauthorized') {
      stopSession()
      auth.logout()
      void router.replace('/login')
      return
    }
    if (error.message === 'email_required') {
      // not a logout: the account needs a verified email first (the gate reconnects afterwards)
      stopSession()
      void auth
        .refreshMe()
        .catch(() => undefined)
        .then(() => router.replace('/verify-email'))
      return
    }
    ui.setConnection('disconnected')
  })

  typingPruneTimer = setInterval(() => messages.pruneTyping(), 2000)
}

export function stopSession(): void {
  active = false
  if (typingPruneTimer) clearInterval(typingPruneTimer)
  typingPruneTimer = null
  useVoiceStore().reset()
  disconnectSocket()
  resetIceCache()
  useMessagesStore().reset()
  useReadStatesStore().reset()
  useChannelsStore().reset()
  useUsersStore().reset()
  useUiStore().setActiveChannel(null)
}

export function sessionActive(): boolean {
  return active
}
