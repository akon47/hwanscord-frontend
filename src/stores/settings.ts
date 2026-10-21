import { defineStore } from 'pinia'
import { readJson, writeJson } from '@/utils/storage'

export type Theme = 'dark' | 'light'
export type MessageDisplay = 'cozy' | 'compact'

export interface VoiceSettings {
  inputDeviceId: string | null
  outputVolume: number
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  joinLeaveSounds: boolean
}

export interface Settings {
  theme: Theme
  messageDisplay: MessageDisplay
  fontSize: number
  sounds: boolean
  soundVolume: number
  desktopNotifications: boolean
  notifyAllMessages: boolean
  voice: VoiceSettings
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  messageDisplay: 'cozy',
  fontSize: 16,
  sounds: true,
  soundVolume: 0.6,
  desktopNotifications: false,
  notifyAllMessages: false,
  voice: {
    inputDeviceId: null,
    outputVolume: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    joinLeaveSounds: true,
  },
}

const STORAGE_KEY = 'settings'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Merge a possibly partial / foreign object into valid settings. */
export function normalizeSettings(input: unknown, base: Settings = DEFAULT_SETTINGS): Settings {
  if (!isRecord(input)) return { ...base, voice: { ...base.voice } }
  const voiceInput = isRecord(input.voice) ? input.voice : {}
  const pick = <T>(value: unknown, fallback: T, guard: (v: unknown) => v is T): T => (guard(value) ? value : fallback)
  const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
  const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const isTheme = (v: unknown): v is Theme => v === 'dark' || v === 'light'
  const isDisplay = (v: unknown): v is MessageDisplay => v === 'cozy' || v === 'compact'
  const isStrOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'
  return {
    theme: pick(input.theme, base.theme, isTheme),
    messageDisplay: pick(input.messageDisplay, base.messageDisplay, isDisplay),
    fontSize: Math.min(20, Math.max(12, pick(input.fontSize, base.fontSize, isNum))),
    sounds: pick(input.sounds, base.sounds, isBool),
    soundVolume: Math.min(1, Math.max(0, pick(input.soundVolume, base.soundVolume, isNum))),
    desktopNotifications: pick(input.desktopNotifications, base.desktopNotifications, isBool),
    notifyAllMessages: pick(input.notifyAllMessages, base.notifyAllMessages, isBool),
    voice: {
      inputDeviceId: pick(voiceInput.inputDeviceId, base.voice.inputDeviceId, isStrOrNull),
      outputVolume: Math.min(2, Math.max(0, pick(voiceInput.outputVolume, base.voice.outputVolume, isNum))),
      echoCancellation: pick(voiceInput.echoCancellation, base.voice.echoCancellation, isBool),
      noiseSuppression: pick(voiceInput.noiseSuppression, base.voice.noiseSuppression, isBool),
      autoGainControl: pick(voiceInput.autoGainControl, base.voice.autoGainControl, isBool),
      joinLeaveSounds: pick(voiceInput.joinLeaveSounds, base.voice.joinLeaveSounds, isBool),
    },
  }
}

type SyncHandler = (settings: Settings) => void

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: normalizeSettings(readJson<unknown>(STORAGE_KEY, null)),
    /** called (debounced) whenever settings change, so the auth store can PATCH /users/me */
    syncHandler: null as SyncHandler | null,
    syncTimer: 0 as ReturnType<typeof setTimeout> | 0,
  }),
  getters: {
    theme: (s) => s.settings.theme,
    voice: (s) => s.settings.voice,
    effectiveSoundVolume: (s) => (s.settings.sounds ? s.settings.soundVolume : 0),
  },
  actions: {
    applyTheme() {
      if (typeof document === 'undefined') return
      document.documentElement.dataset.theme = this.settings.theme
      document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`)
      document.documentElement.dataset.display = this.settings.messageDisplay
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (meta) meta.content = this.settings.theme === 'dark' ? '#1e1f22' : '#e3e5e8'
    },
    /** Replace local settings with the server copy (server wins when it exists). */
    hydrateFromServer(remote: unknown) {
      if (!isRecord(remote) || Object.keys(remote).length === 0) {
        // nothing on the server yet → push ours
        this.scheduleSync()
        this.applyTheme()
        return
      }
      this.settings = normalizeSettings(remote, this.settings)
      writeJson(STORAGE_KEY, this.settings)
      this.applyTheme()
    },
    update(patch: Partial<Omit<Settings, 'voice'>> & { voice?: Partial<VoiceSettings> }) {
      const next: Settings = {
        ...this.settings,
        ...patch,
        voice: { ...this.settings.voice, ...(patch.voice ?? {}) },
      }
      this.settings = normalizeSettings(next, this.settings)
      writeJson(STORAGE_KEY, this.settings)
      this.applyTheme()
      this.scheduleSync()
    },
    setSyncHandler(handler: SyncHandler | null) {
      this.syncHandler = handler
    },
    scheduleSync() {
      if (!this.syncHandler) return
      if (this.syncTimer) clearTimeout(this.syncTimer)
      this.syncTimer = setTimeout(() => {
        this.syncTimer = 0
        this.syncHandler?.(JSON.parse(JSON.stringify(this.settings)) as Settings)
      }, 800)
    },
  },
})
