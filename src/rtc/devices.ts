import type { VoiceSettings } from '@/stores/settings'

export function mediaSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export function screenShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia
}

export function buildAudioConstraints(settings: VoiceSettings): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  }
  if (settings.inputDeviceId) constraints.deviceId = { ideal: settings.inputDeviceId }
  return constraints
}

export async function getMicrophoneStream(settings: VoiceSettings): Promise<MediaStream> {
  if (!mediaSupported()) throw new Error('이 브라우저는 마이크를 지원하지 않습니다.')
  return navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints(settings), video: false })
}

export async function getDisplayStream(): Promise<MediaStream> {
  if (!screenShareSupported()) throw new Error('이 브라우저는 화면 공유를 지원하지 않습니다.')
  return navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 30, max: 60 } },
    audio: true,
  })
}

export interface AudioInputDevice {
  deviceId: string
  label: string
}

export async function listAudioInputs(): Promise<AudioInputDevice[]> {
  if (!mediaSupported()) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices
    .filter((d) => d.kind === 'audioinput')
    .map((d, index) => ({ deviceId: d.deviceId, label: d.label || `마이크 ${index + 1}` }))
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop())
}
