import { Peer, type SignalSender } from './peer'
import { RemoteAudio, audioContext } from './audio'

export interface VoiceClientCallbacks {
  onSpeaking: (socketId: string, speaking: boolean) => void
  onConnectionState: (socketId: string, state: RTCPeerConnectionState) => void
}

/**
 * Full-mesh voice: one Peer per other member socket. The joining socket offers to every existing member;
 * existing members answer. Audio is played through RemoteAudio (per-user gain + master volume + deafen).
 */
export class VoiceClient {
  private peers = new Map<string, Peer>()
  private audios = new Map<string, RemoteAudio>()
  private master: GainNode
  private masterVolume = 1
  private deafened = false

  constructor(
    private localStream: MediaStream,
    private iceServers: RTCIceServer[],
    private readonly send: SignalSender,
    private readonly volumeFor: (socketId: string) => number,
    private readonly callbacks: VoiceClientCallbacks,
  ) {
    const ctx = audioContext()
    this.master = ctx.createGain()
    this.master.connect(ctx.destination)
  }

  get connectedSockets(): string[] {
    return [...this.peers.keys()]
  }

  has(socketId: string): boolean {
    return this.peers.has(socketId)
  }

  setIceServers(iceServers: RTCIceServer[]): void {
    this.iceServers = iceServers
  }

  private createPeer(socketId: string): Peer {
    const peer = new Peer(socketId, 'voice', this.iceServers, this.send, {
      onTrack: (stream) => this.attachAudio(socketId, stream),
      onConnectionState: (state) => {
        this.callbacks.onConnectionState(socketId, state)
        if (state === 'failed' || state === 'closed') this.closePeer(socketId)
      },
    })
    peer.addStream(this.localStream)
    this.peers.set(socketId, peer)
    return peer
  }

  private attachAudio(socketId: string, stream: MediaStream): void {
    this.audios.get(socketId)?.close()
    const audio = new RemoteAudio(stream, this.master, this.volumeFor(socketId), (speaking) =>
      this.callbacks.onSpeaking(socketId, speaking),
    )
    this.audios.set(socketId, audio)
  }

  /** I am the newcomer: offer to an existing member. */
  async connectTo(socketId: string): Promise<void> {
    if (this.peers.has(socketId)) return
    const peer = this.createPeer(socketId)
    try {
      await peer.createOffer()
    } catch {
      this.closePeer(socketId)
    }
  }

  async handleSignal(from: string, type: 'offer' | 'answer' | 'candidate', payload: unknown): Promise<void> {
    let peer = this.peers.get(from)
    if (type === 'offer') {
      // a newcomer is calling me (or a stale peer re-offers): start fresh
      if (peer) this.closePeer(from)
      peer = this.createPeer(from)
      await peer.handleOffer(payload as RTCSessionDescriptionInit)
      return
    }
    if (!peer) return
    if (type === 'answer') await peer.handleAnswer(payload as RTCSessionDescriptionInit)
    else await peer.handleCandidate(payload as RTCIceCandidateInit)
  }

  setVolume(socketId: string, volume: number): void {
    this.audios.get(socketId)?.setVolume(volume)
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume
    this.applyMaster()
  }

  setDeafened(deafened: boolean): void {
    this.deafened = deafened
    this.applyMaster()
  }

  private applyMaster(): void {
    this.master.gain.value = this.deafened ? 0 : this.masterVolume
  }

  async replaceLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream
    const track = stream.getAudioTracks()[0] ?? null
    await Promise.all([...this.peers.values()].map((peer) => peer.replaceAudioTrack(track)))
  }

  closePeer(socketId: string): void {
    this.peers.get(socketId)?.close()
    this.peers.delete(socketId)
    this.audios.get(socketId)?.close()
    this.audios.delete(socketId)
    this.callbacks.onSpeaking(socketId, false)
  }

  /** Drop every peer that is no longer in the channel member list. */
  prune(activeSocketIds: Set<string>): void {
    for (const socketId of this.peers.keys()) {
      if (!activeSocketIds.has(socketId)) this.closePeer(socketId)
    }
  }

  close(): void {
    for (const socketId of [...this.peers.keys()]) this.closePeer(socketId)
    this.master.disconnect()
  }
}
