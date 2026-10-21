import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatDayLabel, formatRelative, formatTime, isSameDay, withinGroupWindow } from './time'

const now = new Date(2026, 9, 21, 15, 30, 0)

describe('time utils', () => {
  it('formats 12-hour Korean times', () => {
    expect(formatTime(new Date(2026, 9, 21, 0, 5))).toBe('오전 12:05')
    expect(formatTime(new Date(2026, 9, 21, 9, 7))).toBe('오전 9:07')
    expect(formatTime(new Date(2026, 9, 21, 12, 0))).toBe('오후 12:00')
    expect(formatTime(new Date(2026, 9, 21, 23, 59))).toBe('오후 11:59')
  })

  it('formats dates', () => {
    expect(formatDate(new Date(2026, 0, 3))).toBe('2026년 1월 3일')
  })

  it('labels today / yesterday / older', () => {
    expect(formatDateTime(new Date(2026, 9, 21, 9, 0), now)).toBe('오늘 오전 9:00')
    expect(formatDateTime(new Date(2026, 9, 20, 21, 0), now)).toBe('어제 오후 9:00')
    expect(formatDateTime(new Date(2026, 8, 1, 13, 5), now)).toBe('2026. 9. 1. 오후 1:05')
    expect(formatDayLabel(new Date(2026, 9, 21, 1), now)).toBe('오늘')
    expect(formatDayLabel(new Date(2026, 9, 20, 1), now)).toBe('어제')
    expect(formatDayLabel(new Date(2026, 9, 1), now)).toBe('2026년 10월 1일')
  })

  it('formats relative times', () => {
    expect(formatRelative(new Date(now.getTime() - 10_000), now)).toBe('방금')
    expect(formatRelative(new Date(now.getTime() - 5 * 60_000), now)).toBe('5분 전')
    expect(formatRelative(new Date(now.getTime() - 3 * 3_600_000), now)).toBe('3시간 전')
    expect(formatRelative(new Date(now.getTime() - 3 * 86_400_000), now)).toBe('3일 전')
  })

  it('compares days and group window', () => {
    expect(isSameDay(new Date(2026, 9, 21, 0), new Date(2026, 9, 21, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 9, 21), new Date(2026, 9, 22))).toBe(false)
    expect(withinGroupWindow('2026-10-21T00:00:00Z', '2026-10-21T00:06:59Z')).toBe(true)
    expect(withinGroupWindow('2026-10-21T00:00:00Z', '2026-10-21T00:07:01Z')).toBe(false)
  })
})
