import { Peer, type SignalSender } from './peer'

/** Sharer side: one outgoing Peer per viewer that asked to watch. */
export class ScreenShareHost {
  private viewers = new Map<string, Peer>()

  constructor(
    private readonly stream: MediaStream,
    private iceServers: RTCIceServer[],
    private readonly send: SignalSender,
  ) {}

  get viewerCount(): number {
    return this.viewers.size
  }

  setIceServers(iceServers: RTCIceServer[]): void {
    this.iceServers = iceServers
  }

  async addViewer(viewerSocketId: string): Promise<void> {
    this.removeViewer(viewerSocketId)
    const peer = new Peer(viewerSocketId, 'screen', this.iceServers, this.send, {
      onConnectionState: (state) => {
        if (state === 'failed' || state === 'closed') this.removeViewer(viewerSocketId)
      },
    })
    peer.addStream(this.stream)
    this.viewers.set(viewerSocketId, peer)
    try {
      await peer.createOffer()
    } catch {
      this.removeViewer(viewerSocketId)
    }
  }

  async handleSignal(from: string, type: 'answer' | 'candidate', payload: unknown): Promise<void> {
    const peer = this.viewers.get(from)
    if (!peer) return
    if (type === 'answer') await peer.handleAnswer(payload as RTCSessionDescriptionInit)
    else await peer.handleCandidate(payload as RTCIceCandidateInit)
  }

  hasViewer(socketId: string): boolean {
    return this.viewers.has(socketId)
  }

  removeViewer(viewerSocketId: string): void {
    this.viewers.get(viewerSocketId)?.close()
    this.viewers.delete(viewerSocketId)
  }

  pruneViewers(active: Set<string>): void {
    for (const id of [...this.viewers.keys()]) if (!active.has(id)) this.removeViewer(id)
  }

  close(): void {
    for (const socketId of [...this.viewers.keys()]) this.removeViewer(socketId)
  }
}

/** Viewer side: one incoming Peer per sharer I am watching. */
export class ScreenShareViewer {
  private sharers = new Map<string, Peer>()

  constructor(
    private iceServers: RTCIceServer[],
    private readonly send: SignalSender,
    private readonly onStream: (sharerSocketId: string, stream: MediaStream | null) => void,
  ) {}

  setIceServers(iceServers: RTCIceServer[]): void {
    this.iceServers = iceServers
  }

  isWatching(sharerSocketId: string): boolean {
    return this.sharers.has(sharerSocketId)
  }

  /** Called when the sharer's offer arrives (after we sent screen:watch). */
  async handleOffer(from: string, offer: RTCSessionDescriptionInit): Promise<void> {
    this.stop(from, false)
    const peer = new Peer(from, 'screen', this.iceServers, this.send, {
      onTrack: (stream) => this.onStream(from, stream),
      onConnectionState: (state) => {
        if (state === 'failed' || state === 'closed') this.stop(from)
      },
    })
    this.sharers.set(from, peer)
    await peer.handleOffer(offer)
  }

  async handleCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.sharers.get(from)?.handleCandidate(candidate)
  }

  hasSharer(socketId: string): boolean {
    return this.sharers.has(socketId)
  }

  stop(sharerSocketId: string, notify = true): void {
    const peer = this.sharers.get(sharerSocketId)
    if (!peer) return
    peer.close()
    this.sharers.delete(sharerSocketId)
    if (notify) this.onStream(sharerSocketId, null)
  }

  close(): void {
    for (const socketId of [...this.sharers.keys()]) this.stop(socketId)
  }
}
