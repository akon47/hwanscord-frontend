import { rtcApi, type IceServer } from '@/api'

const GOOGLE_STUN: IceServer = { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }

interface Cached {
  servers: IceServer[]
  expiresAt: number
  relay: boolean
}

let cached: Cached | null = null
let inflight: Promise<Cached> | null = null

function sanitize(servers: IceServer[]): IceServer[] {
  return servers
    .map((s) => ({ ...s, urls: (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => !/:53(\?|$)/.test(u)) }))
    .filter((s) => s.urls.length > 0)
}

/** ICE servers from the API, refreshed when half of the TTL is spent. Falls back to STUN only. */
export async function getIceServers(): Promise<{ iceServers: IceServer[]; relay: boolean }> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return { iceServers: cached.servers, relay: cached.relay }
  if (!inflight) {
    inflight = rtcApi
      .fetchIceServers()
      .then((res) => {
        const servers = sanitize(res.iceServers)
        const ttlMs = Math.max(60, res.ttl) * 1000
        cached = {
          servers: servers.length ? servers : [GOOGLE_STUN],
          expiresAt: Date.now() + ttlMs / 2,
          relay: res.relay,
        }
        return cached
      })
      .catch(() => {
        cached = { servers: [GOOGLE_STUN], expiresAt: Date.now() + 60_000, relay: false }
        return cached
      })
      .finally(() => {
        inflight = null
      })
  }
  const result = await inflight
  return { iceServers: result.servers, relay: result.relay }
}

export function resetIceCache(): void {
  cached = null
}
