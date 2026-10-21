const PALETTE = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#3ba55d', '#faa81a', '#1abc9c', '#9b59b6']

export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function avatarColor(seed: string): string {
  return PALETTE[hashString(seed) % PALETTE.length] ?? PALETTE[0]!
}

export function initialOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const first = [...trimmed][0] ?? '?'
  return first.toUpperCase()
}
