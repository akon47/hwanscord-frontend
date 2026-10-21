import { io, type Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents, SocketAck } from '@/api'

export type AppSocket = Socket<ServerEvents, ClientEvents>

let socket: AppSocket | null = null

export function createSocket(token: string): AppSocket {
  disconnectSocket()
  socket = io(window.location.origin, {
    path: '/socket.io/',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    autoConnect: true,
  })
  return socket
}

export function getSocket(): AppSocket | null {
  return socket
}

export function disconnectSocket(): void {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}

export class SocketError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'SocketError'
  }
}

/** Emit with an acknowledgement, rejecting on `{ ok: false }` or timeout. */
export function emitWithAck<T>(
  emit: (ack: (res: SocketAck<T>) => void) => void,
  timeoutMs = 10000,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new SocketError('TIMEOUT', '서버 응답이 없습니다.')), timeoutMs)
    emit((res) => {
      clearTimeout(timer)
      if (res.ok) resolve(res.data)
      else reject(new SocketError(res.error.code, res.error.message))
    })
  })
}
