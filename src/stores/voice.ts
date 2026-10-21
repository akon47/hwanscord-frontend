import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { RtcSignal, VoiceMember, VoiceState } from '@/api'
import { getSocket, emitWithAck } from '@/realtime/socket'
import { VoiceClient } from '@/rtc/voiceClient'
import { ScreenShareHost, ScreenShareViewer } from '@/rtc/screenShare'
import { getIceServers } from '@/rtc/ice'
import { getDisplayStream, getMicrophoneStream, stopStream } from '@/rtc/devices'
import { LocalMonitor } from '@/rtc/audio'
import type { SignalSender } from '@/rtc/peer'
import { sounds, primeAudio } from '@/utils/sounds'
import { readJson, writeJson } from '@/utils/storage'
import { useAuthStore } from './auth'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'

/** Non-reactive runtime objects (never put MediaStreams / RTCPeerConnections in reactive state). */
interface Runtime {
  localStream: MediaStream | null
  monitor: LocalMonitor | null
  voiceClient: VoiceClient | null
  screenHost: ScreenShareHost | null
  screenViewer: ScreenShareViewer | null
  localScreenStream: MediaStream | null
  iceServers: RTCIceServer[]
}

const runtime: Runtime = {
  localStream: null,
  monitor: null,
  voiceClient: null,
  screenHost: null,
  screenViewer: null,
  localScreenStream: null,
  iceServers: [],
}

const sendSignal: SignalSender = (to, scope, type, payload) => {
  getSocket()?.emit('rtc:signal', { to, scope, type, payload })
}

export const useVoiceStore = defineStore('voice', {
  state: () => ({
    /** channelId → state, as broadcast by the server */
    states: {} as Record<string, VoiceState>,
    mySocketId: null as string | null,
    /** the channel my socket is in */
    currentChannelId: null as string | null,
    connecting: false,
    muted: false,
    deafened: false,
    streaming: false,
    /** socketId → speaking */
    speaking: {} as Record<string, boolean>,
    /** socketId → connection state */
    connections: {} as Record<string, RTCPeerConnectionState>,
    /** userId → gain (0–2), persisted */
    volumes: readJson<Record<string, number>>('voice.volumes', {}),
    /** sharer socketId → remote screen stream (viewer side) */
    screenStreams: {} as Record<string, MediaStream>,
    /** socketId of the sharer I'm watching */
    watching: null as string | null,
    /** my own display stream for the local preview */
    localScreenStream: null as MediaStream | null,
    relay: false,
  }),
  getters: {
    isConnected: (s) => s.currentChannelId !== null,
    membersOf: (s) => (channelId: string): VoiceMember[] => s.states[channelId]?.members ?? [],
    myMember(state): VoiceMember | undefined {
      if (!state.currentChannelId || !state.mySocketId) return undefined
      return state.states[state.currentChannelId]?.members.find((m) => m.socketId === state.mySocketId)
    },
    channelOfSocket: (s) => (socketId: string): string | null => {
      for (const st of Object.values(s.states)) {
        if (st.members.some((m) => m.socketId === socketId)) return st.channelId
      }
      return null
    },
    isSpeaking: (s) => (socketId: string): boolean => s.speaking[socketId] === true,
    volumeFor: (s) => (userId: string): number => s.volumes[userId] ?? 1,
    streamers(state): VoiceMember[] {
      if (!state.currentChannelId) return []
      return (state.states[state.currentChannelId]?.members ?? []).filter((m) => m.streaming)
    },
  },
  actions: {
    // ---- server state ---------------------------------------------------------------------------------------
    setStates(states: VoiceState[]) {
      const next: Record<string, VoiceState> = {}
      for (const s of states) if (s.members.length) next[s.channelId] = s
      this.states = next
      this.reconcile()
    },
    onState(state: VoiceState) {
      const previous = this.states[state.channelId]?.members ?? []
      if (state.members.length) this.states[state.channelId] = state
      else delete this.states[state.channelId]
      this.playPeerSounds(state, previous)
      this.reconcile()
    },
    playPeerSounds(state: VoiceState, previous: VoiceMember[]) {
      if (state.channelId !== this.currentChannelId || !this.mySocketId) return
      const settings = useSettingsStore()
      if (!settings.voice.joinLeaveSounds) return
      const volume = settings.effectiveSoundVolume
      const before = new Set(previous.map((m) => m.socketId))
      const after = new Set(state.members.map((m) => m.socketId))
      for (const id of after) if (!before.has(id) && id !== this.mySocketId) sounds.peerJoin(volume)
      for (const id of before) if (!after.has(id) && id !== this.mySocketId) sounds.peerLeave(volume)
    },
    /** Keep peer connections in sync with the member list. */
    reconcile() {
      if (!this.currentChannelId || !this.mySocketId) return
      const members = this.states[this.currentChannelId]?.members ?? []
      const stillHere = members.some((m) => m.socketId === this.mySocketId)
      if (!stillHere) {
        // kicked (channel deleted) or server restarted
        void this.teardown(false)
        return
      }
      const active = new Set(members.filter((m) => m.socketId !== this.mySocketId).map((m) => m.socketId))
      runtime.voiceClient?.prune(active)
      for (const id of Object.keys(this.connections)) if (!active.has(id)) delete this.connections[id]
      for (const id of Object.keys(this.speaking)) if (!active.has(id) && id !== this.mySocketId) delete this.speaking[id]
      // stop watching a stream that ended
      if (this.watching) {
        const sharer = members.find((m) => m.socketId === this.watching)
        if (!sharer || !sharer.streaming) this.unwatch()
      }
      // drop viewers that left the channel
      runtime.screenHost?.pruneViewers(active)
    },

    // ---- join / leave ----------------------------------------------------------------------------------------
    async join(channelId: string) {
      if (this.connecting) return
      if (this.currentChannelId === channelId) return
      const socket = getSocket()
      if (!socket) throw new Error('서버에 연결되어 있지 않습니다.')
      const settings = useSettingsStore()
      const ui = useUiStore()
      this.connecting = true
      primeAudio()
      try {
        if (!runtime.localStream) {
          runtime.localStream = await getMicrophoneStream(settings.voice)
          runtime.localStream.getAudioTracks().forEach((t) => (t.enabled = !this.muted))
          runtime.monitor = new LocalMonitor(runtime.localStream, (speaking) => {
            if (this.mySocketId) this.speaking[this.mySocketId] = speaking && !this.muted
          })
        }
        const ice = await getIceServers()
        runtime.iceServers = ice.iceServers
        this.relay = ice.relay
        // switching channels: drop old peers first
        this.closeVoiceClient()
        const state = await emitWithAck<VoiceState>((ack) => socket.emit('voice:join', { channelId }, ack))
        this.currentChannelId = channelId
        if (state) this.states[channelId] = state
        this.setupVoiceClient()
        // I am the newcomer: offer to everyone already there
        const others = (state?.members ?? []).filter((m) => m.socketId !== this.mySocketId)
        await Promise.all(others.map((m) => runtime.voiceClient!.connectTo(m.socketId)))
        if (this.muted || this.deafened) socket.emit('voice:update', { muted: this.muted, deafened: this.deafened })
        if (settings.voice.joinLeaveSounds) sounds.voiceJoin(settings.effectiveSoundVolume)
      } catch (error) {
        if (!this.currentChannelId) this.releaseMicrophone()
        ui.toast(error instanceof Error ? error.message : '음성 채널에 연결할 수 없습니다.', 'error')
        throw error
      } finally {
        this.connecting = false
      }
    },
    setupVoiceClient() {
      if (!runtime.localStream) return
      const settings = useSettingsStore()
      runtime.voiceClient = new VoiceClient(
        runtime.localStream,
        runtime.iceServers,
        sendSignal,
        (socketId) => {
          const userId = this.userIdOf(socketId)
          return userId ? this.volumeFor(userId) : 1
        },
        {
          onSpeaking: (socketId, speaking) => {
            this.speaking[socketId] = speaking
          },
          onConnectionState: (socketId, state) => {
            this.connections[socketId] = state
          },
        },
      )
      runtime.voiceClient.setMasterVolume(settings.voice.outputVolume)
      runtime.voiceClient.setDeafened(this.deafened)
      runtime.screenViewer = new ScreenShareViewer(runtime.iceServers, sendSignal, (sharer, stream) => {
        if (stream) this.screenStreams[sharer] = markRaw(stream)
        else {
          delete this.screenStreams[sharer]
          if (this.watching === sharer) this.watching = null
        }
      })
    },
    closeVoiceClient() {
      runtime.voiceClient?.close()
      runtime.voiceClient = null
      runtime.screenViewer?.close()
      runtime.screenViewer = null
      this.connections = {}
      this.screenStreams = {}
      this.watching = null
    },
    userIdOf(socketId: string): string | null {
      for (const st of Object.values(this.states)) {
        const member = st.members.find((m) => m.socketId === socketId)
        if (member) return member.userId
      }
      return null
    },
    async leave() {
      const socket = getSocket()
      const settings = useSettingsStore()
      if (socket && this.currentChannelId) {
        try {
          await emitWithAck((ack) => socket.emit('voice:leave', {}, ack), 3000)
        } catch {
          // best effort
        }
      }
      await this.teardown(true)
      if (settings.voice.joinLeaveSounds) sounds.voiceLeave(settings.effectiveSoundVolume)
    },
    /** Local cleanup; `userInitiated` = false when the server removed us. */
    async teardown(userInitiated: boolean) {
      if (this.streaming) await this.stopScreenShare(false)
      this.closeVoiceClient()
      this.releaseMicrophone()
      const me = this.mySocketId
      this.speaking = me ? { [me]: false } : {}
      this.currentChannelId = null
      if (!userInitiated) useUiStore().toast('음성 채널 연결이 끊어졌습니다.', 'info')
    },
    releaseMicrophone() {
      runtime.monitor?.close()
      runtime.monitor = null
      stopStream(runtime.localStream)
      runtime.localStream = null
    },
    /** Socket dropped: everything is gone server-side, so clean up locally. */
    onSocketDisconnected() {
      if (this.currentChannelId) void this.teardown(false)
      this.states = {}
    },
    setMySocketId(id: string) {
      this.mySocketId = id
    },

    // ---- controls -------------------------------------------------------------------------------------------
    toggleMute() {
      this.setMuted(!this.muted)
    },
    setMuted(muted: boolean) {
      const settings = useSettingsStore()
      this.muted = muted
      if (!muted && this.deafened) {
        this.deafened = false
        runtime.voiceClient?.setDeafened(false)
      }
      runtime.localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted))
      if (muted && this.mySocketId) this.speaking[this.mySocketId] = false
      getSocket()?.emit('voice:update', { muted: this.muted, deafened: this.deafened })
      if (settings.settings.sounds) (muted ? sounds.mute : sounds.unmute)(settings.effectiveSoundVolume)
    },
    toggleDeafen() {
      const settings = useSettingsStore()
      this.deafened = !this.deafened
      if (this.deafened) this.muted = true
      runtime.localStream?.getAudioTracks().forEach((t) => (t.enabled = !this.muted))
      runtime.voiceClient?.setDeafened(this.deafened)
      getSocket()?.emit('voice:update', { muted: this.muted, deafened: this.deafened })
      if (settings.settings.sounds) (this.deafened ? sounds.mute : sounds.unmute)(settings.effectiveSoundVolume)
    },
    setVolume(userId: string, volume: number) {
      this.volumes[userId] = volume
      writeJson('voice.volumes', this.volumes)
      for (const st of Object.values(this.states)) {
        for (const m of st.members) if (m.userId === userId) runtime.voiceClient?.setVolume(m.socketId, volume)
      }
    },
    applyOutputVolume(volume: number) {
      runtime.voiceClient?.setMasterVolume(volume)
    },
    /** Device/constraint change while connected. */
    async restartMicrophone() {
      if (!runtime.localStream) return
      const settings = useSettingsStore()
      const next = await getMicrophoneStream(settings.voice)
      next.getAudioTracks().forEach((t) => (t.enabled = !this.muted))
      runtime.monitor?.close()
      runtime.monitor = new LocalMonitor(next, (speaking) => {
        if (this.mySocketId) this.speaking[this.mySocketId] = speaking && !this.muted
      })
      const old = runtime.localStream
      runtime.localStream = next
      await runtime.voiceClient?.replaceLocalStream(next)
      stopStream(old)
    },

    // ---- screen share ------------------------------------------------------------------------------------------
    async startScreenShare() {
      const socket = getSocket()
      if (!socket || !this.currentChannelId || this.streaming) return
      const stream = await getDisplayStream()
      runtime.localScreenStream = stream
      this.localScreenStream = markRaw(stream)
      runtime.screenHost = new ScreenShareHost(stream, runtime.iceServers, sendSignal)
      this.streaming = true
      socket.emit('voice:update', { streaming: true })
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) videoTrack.onended = () => void this.stopScreenShare(true)
    },
    async stopScreenShare(notifyServer = true) {
      if (!this.streaming && !runtime.localScreenStream) return
      runtime.screenHost?.close()
      runtime.screenHost = null
      stopStream(runtime.localScreenStream)
      runtime.localScreenStream = null
      this.localScreenStream = null
      this.streaming = false
      if (notifyServer) getSocket()?.emit('voice:update', { streaming: false })
    },
    watch(sharerSocketId: string) {
      const socket = getSocket()
      if (!socket || !runtime.screenViewer) return
      if (this.watching && this.watching !== sharerSocketId) this.unwatch()
      this.watching = sharerSocketId
      socket.emit('screen:watch', { to: sharerSocketId })
    },
    unwatch() {
      const target = this.watching
      this.watching = null
      if (!target) return
      runtime.screenViewer?.stop(target, false)
      delete this.screenStreams[target]
      getSocket()?.emit('screen:unwatch', { to: target })
    },

    // ---- signaling --------------------------------------------------------------------------------------------
    async onSignal(signal: RtcSignal) {
      if (signal.scope === 'voice') {
        await runtime.voiceClient?.handleSignal(signal.from, signal.type, signal.payload)
        return
      }
      // screen: offers always come from a sharer to me (viewer); answers/candidates may go either way
      if (signal.type === 'offer') {
        if (this.watching !== signal.from) return
        await runtime.screenViewer?.handleOffer(signal.from, signal.payload as RTCSessionDescriptionInit)
        return
      }
      if (runtime.screenHost?.hasViewer(signal.from)) {
        await runtime.screenHost.handleSignal(signal.from, signal.type, signal.payload)
      } else if (signal.type === 'candidate' && runtime.screenViewer?.hasSharer(signal.from)) {
        await runtime.screenViewer.handleCandidate(signal.from, signal.payload as RTCIceCandidateInit)
      }
    },
    onScreenWatch(from: string) {
      if (!this.streaming || !runtime.screenHost) return
      // only members of my channel may watch
      if (this.channelOfSocket(from) !== this.currentChannelId) return
      void runtime.screenHost.addViewer(from)
    },
    onScreenUnwatch(from: string) {
      runtime.screenHost?.removeViewer(from)
    },

    reset() {
      void this.teardown(true)
      this.states = {}
      this.mySocketId = null
    },
  },
})

export function currentUserVoiceChannel(): string | null {
  const voice = useVoiceStore()
  const me = useAuthStore().userId
  if (!me) return null
  for (const st of Object.values(voice.states)) if (st.members.some((m) => m.userId === me)) return st.channelId
  return null
}
