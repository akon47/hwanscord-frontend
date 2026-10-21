// Audio graph helpers: remote playback with per-user gain, speaking detection, mic level meter.

let sharedContext: AudioContext | null = null

export function audioContext(): AudioContext {
  if (!sharedContext) sharedContext = new AudioContext()
  if (sharedContext.state === 'suspended') void sharedContext.resume()
  return sharedContext
}

const SPEAKING_THRESHOLD = 0.02
const SPEAKING_HANGOVER_MS = 300
const POLL_MS = 80

/** Watches an audio node and reports speaking on/off with a short hangover. */
export class SpeakingDetector {
  private analyser: AnalyserNode
  private buffer: Float32Array<ArrayBuffer>
  private timer: ReturnType<typeof setInterval> | null = null
  private lastLoud = 0
  private speaking = false
  level = 0

  constructor(
    ctx: AudioContext,
    source: AudioNode,
    private readonly onChange: (speaking: boolean) => void,
    private readonly threshold = SPEAKING_THRESHOLD,
  ) {
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.6
    source.connect(this.analyser)
    this.buffer = new Float32Array(this.analyser.fftSize) as Float32Array<ArrayBuffer>
    this.timer = setInterval(() => this.poll(), POLL_MS)
  }

  private poll(): void {
    this.analyser.getFloatTimeDomainData(this.buffer)
    let sum = 0
    for (let i = 0; i < this.buffer.length; i++) {
      const v = this.buffer[i] ?? 0
      sum += v * v
    }
    const rms = Math.sqrt(sum / this.buffer.length)
    this.level = rms
    const now = performance.now()
    if (rms >= this.threshold) this.lastLoud = now
    const next = now - this.lastLoud <= SPEAKING_HANGOVER_MS
    if (next !== this.speaking) {
      this.speaking = next
      this.onChange(next)
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.analyser.disconnect()
    if (this.speaking) {
      this.speaking = false
      this.onChange(false)
    }
  }
}

/**
 * Plays a remote MediaStream through the Web Audio graph (so we can apply >100% gain and a master volume)
 * and reports speaking state. The hidden <audio> element is required by Chromium to actually receive RTP audio.
 */
export class RemoteAudio {
  private element: HTMLAudioElement
  private source: MediaStreamAudioSourceNode
  private gain: GainNode
  private detector: SpeakingDetector

  constructor(
    stream: MediaStream,
    master: GainNode,
    volume: number,
    onSpeaking: (speaking: boolean) => void,
  ) {
    const ctx = master.context as AudioContext
    this.element = document.createElement('audio')
    this.element.srcObject = stream
    this.element.muted = true
    this.element.autoplay = true
    void this.element.play().catch(() => undefined)
    this.source = ctx.createMediaStreamSource(stream)
    this.gain = ctx.createGain()
    this.gain.gain.value = volume
    this.source.connect(this.gain)
    this.gain.connect(master)
    this.detector = new SpeakingDetector(ctx, this.source, onSpeaking)
  }

  setVolume(volume: number): void {
    this.gain.gain.value = Math.max(0, Math.min(2, volume))
  }

  close(): void {
    this.detector.stop()
    this.source.disconnect()
    this.gain.disconnect()
    this.element.srcObject = null
    this.element.remove()
  }
}

/** Speaking detection for the local microphone (never played back). */
export class LocalMonitor {
  private source: MediaStreamAudioSourceNode
  private detector: SpeakingDetector

  constructor(stream: MediaStream, onSpeaking: (speaking: boolean) => void) {
    const ctx = audioContext()
    this.source = ctx.createMediaStreamSource(stream)
    this.detector = new SpeakingDetector(ctx, this.source, onSpeaking)
  }

  get level(): number {
    return this.detector.level
  }

  close(): void {
    this.detector.stop()
    this.source.disconnect()
  }
}
