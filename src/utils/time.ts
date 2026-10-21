const DAY_MS = 24 * 60 * 60 * 1000

export function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** "오후 3:07" */
export function formatTime(value: string | number | Date): string {
  const d = toDate(value)
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${period} ${hour12}:${minutes}`
}

/** "2026년 10월 21일" */
export function formatDate(value: string | number | Date): string {
  const d = toDate(value)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "오늘 오후 3:07", "어제 오전 9:12", "2026. 10. 21. 오후 3:07" */
export function formatDateTime(value: string | number | Date, now: Date = new Date()): string {
  const d = toDate(value)
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY_MS)
  if (diffDays === 0) return `오늘 ${formatTime(d)}`
  if (diffDays === 1) return `어제 ${formatTime(d)}`
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${formatTime(d)}`
}

/** Full timestamp for tooltips: "2026년 10월 21일 (수) 오후 3:07:09" */
export function formatFull(value: string | number | Date): string {
  const d = toDate(value)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${formatDate(d)} (${weekday}) ${formatTime(d)}:${seconds}`
}

/** Divider label: "오늘", "어제" or the full date. */
export function formatDayLabel(value: string | number | Date, now: Date = new Date()): string {
  const d = toDate(value)
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY_MS)
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  return formatDate(d)
}

/** "방금", "3분 전", "2시간 전", "어제", "5일 전", then the date. */
export function formatRelative(value: string | number | Date, now: Date = new Date()): string {
  const d = toDate(value)
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`
  if (diff < DAY_MS) return `${Math.floor(diff / 3_600_000)}시간 전`
  const days = Math.floor(diff / DAY_MS)
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return formatDate(d)
}

/** Two messages are "grouped" when the same author posted within this window. */
export const GROUP_WINDOW_MS = 7 * 60 * 1000

export function withinGroupWindow(a: string | Date, b: string | Date): boolean {
  return Math.abs(toDate(a).getTime() - toDate(b).getTime()) <= GROUP_WINDOW_MS
}
