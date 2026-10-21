// All UI sounds are synthesized with the Web Audio API — the repo ships no audio files.

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

interface Note {
  frequency: number
  /** seconds from the start */
  at: number
  duration: number
  gain?: number
  type?: OscillatorType
}

function play(notes: Note[], volume: number): void {
  const ctx = getContext()
  if (!ctx || volume <= 0) return
  const master = ctx.createGain()
  master.gain.value = Math.min(1, volume)
  master.connect(ctx.destination)
  const now = ctx.currentTime
  for (const note of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = note.type ?? 'sine'
    osc.frequency.value = note.frequency
    const start = now + note.at
    const end = start + note.duration
    const peak = note.gain ?? 0.25
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(end + 0.02)
  }
}

export const sounds = {
  /** I joined a voice channel: two rising notes. */
  voiceJoin(volume = 0.6) {
    play(
      [
        { frequency: 523.25, at: 0, duration: 0.12 },
        { frequency: 783.99, at: 0.11, duration: 0.18 },
      ],
      volume,
    )
  },
  /** I left: two falling notes. */
  voiceLeave(volume = 0.6) {
    play(
      [
        { frequency: 659.25, at: 0, duration: 0.12 },
        { frequency: 392.0, at: 0.11, duration: 0.2 },
      ],
      volume,
    )
  },
  /** Someone else joined my channel. */
  peerJoin(volume = 0.6) {
    play([{ frequency: 659.25, at: 0, duration: 0.12, gain: 0.15 }], volume)
  },
  /** Someone else left my channel. */
  peerLeave(volume = 0.6) {
    play([{ frequency: 440.0, at: 0, duration: 0.14, gain: 0.15 }], volume)
  },
  message(volume = 0.6) {
    play([{ frequency: 880, at: 0, duration: 0.08, gain: 0.12, type: 'triangle' }], volume)
  },
  mention(volume = 0.6) {
    play(
      [
        { frequency: 880, at: 0, duration: 0.08, gain: 0.16, type: 'triangle' },
        { frequency: 1174.66, at: 0.1, duration: 0.1, gain: 0.16, type: 'triangle' },
      ],
      volume,
    )
  },
  mute(volume = 0.6) {
    play([{ frequency: 330, at: 0, duration: 0.08, gain: 0.12 }], volume)
  },
  unmute(volume = 0.6) {
    play([{ frequency: 494, at: 0, duration: 0.08, gain: 0.12 }], volume)
  },
}

/** Call from a user gesture so later sounds are allowed by autoplay policies. */
export function primeAudio(): void {
  getContext()
}
