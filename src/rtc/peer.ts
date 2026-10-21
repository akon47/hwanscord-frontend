import type { SignalScope, SignalType } from '@/api'

export type SignalSender = (
  to: string,
  scope: SignalScope,
  type: SignalType,
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
) => void

export interface PeerCallbacks {
  onTrack?: (stream: MediaStream) => void
  onConnectionState?: (state: RTCPeerConnectionState) => void
}

/**
 * Thin wrapper around RTCPeerConnection with fixed offer/answer roles (see API.md negotiation rules).
 * Candidates arriving before the remote description are queued.
 */
export class Peer {
  readonly pc: RTCPeerConnection
  private pendingCandidates: RTCIceCandidateInit[] = []
  private closed = false

  constructor(
    readonly remoteSocketId: string,
    readonly scope: SignalScope,
    iceServers: RTCIceServer[],
    private readonly send: SignalSender,
    private readonly callbacks: PeerCallbacks = {},
  ) {
    this.pc = new RTCPeerConnection({ iceServers, bundlePolicy: 'max-bundle' })
    this.pc.onicecandidate = (event) => {
      if (event.candidate) this.send(remoteSocketId, scope, 'candidate', event.candidate.toJSON())
    }
    this.pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track])
      this.callbacks.onTrack?.(stream)
    }
    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionState?.(this.pc.connectionState)
    }
  }

  addStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) this.pc.addTrack(track, stream)
  }

  async createOffer(): Promise<void> {
    const offer = await this.pc.createOffer()
    if (this.closed) return
    await this.pc.setLocalDescription(offer)
    if (this.pc.localDescription) this.send(this.remoteSocketId, this.scope, 'offer', this.pc.localDescription.toJSON())
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(offer)
    await this.flushCandidates()
    const answer = await this.pc.createAnswer()
    if (this.closed) return
    await this.pc.setLocalDescription(answer)
    if (this.pc.localDescription) this.send(this.remoteSocketId, this.scope, 'answer', this.pc.localDescription.toJSON())
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.pc.signalingState !== 'have-local-offer') return
    await this.pc.setRemoteDescription(answer)
    await this.flushCandidates()
  }

  async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc.remoteDescription) {
      this.pendingCandidates.push(candidate)
      return
    }
    try {
      await this.pc.addIceCandidate(candidate)
    } catch {
      // ignore stale candidates
    }
  }

  private async flushCandidates(): Promise<void> {
    const queued = this.pendingCandidates
    this.pendingCandidates = []
    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(candidate)
      } catch {
        // ignore
      }
    }
  }

  /** Replace the outgoing audio track (device change) without renegotiation. */
  async replaceAudioTrack(track: MediaStreamTrack | null): Promise<void> {
    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'audio' || (!s.track && track?.kind === 'audio'))
    if (sender) await sender.replaceTrack(track)
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.pc.onicecandidate = null
    this.pc.ontrack = null
    this.pc.onconnectionstatechange = null
    this.pc.getSenders().forEach((s) => {
      try {
        this.pc.removeTrack(s)
      } catch {
        // ignore
      }
    })
    this.pc.close()
  }
}
