export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${unit === 0 ? value : value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`
}

export function isImageType(contentType: string): boolean {
  return /^image\//.test(contentType)
}

export function isVideoType(contentType: string): boolean {
  return /^video\//.test(contentType)
}

export function isAudioType(contentType: string): boolean {
  return /^audio\//.test(contentType)
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : ''
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

let nonceCounter = 0
export function createNonce(): string {
  nonceCounter += 1
  return `${Date.now().toString(36)}-${nonceCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
