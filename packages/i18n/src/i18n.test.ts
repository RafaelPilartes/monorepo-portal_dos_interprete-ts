import { describe, expect, it } from 'vitest'
import { APP_TIMEZONE, COMMON_TEXTS, formatAoa, formatDate, formatDateTime, formatTime, luandaDay } from './index'

const NBSP = ' '

describe('formatAoa', () => {
  it.each([
    [14040, `14${NBSP}040${NBSP}Kz`],
    [0, `0${NBSP}Kz`],
    [999, `999${NBSP}Kz`],
    [1000000, `1${NBSP}000${NBSP}000${NBSP}Kz`],
    [-2500, `-2${NBSP}500${NBSP}Kz`],
  ])('%d -> %s', (amount, expected) => {
    expect(formatAoa(amount)).toBe(expected)
  })

  it('refuses cents (D-37) and numbers past the safe integer range', () => {
    expect(() => formatAoa(10.5)).toThrow(RangeError)
    expect(() => formatAoa(1e21)).toThrow(RangeError)
    expect(() => formatAoa(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError)
  })
})

describe('Luanda dates (UTC+1, no daylight saving)', () => {
  it('uses Africa/Luanda', () => {
    expect(APP_TIMEZONE).toBe('Africa/Luanda')
  })

  it('shows 23:30 UTC as the next day at 00:30 in Luanda', () => {
    const instant = '2026-10-25T23:30:00Z'
    expect(formatDate(instant)).toBe('26/10/2026')
    expect(formatTime(instant)).toBe('00:30')
    expect(formatDateTime(instant)).toBe('26/10/2026, 00:30')
    expect(luandaDay(instant)).toBe('2026-10-26')
  })

  it('is one hour ahead of UTC in July as well (no daylight saving)', () => {
    expect(formatTime('2026-07-01T12:00:00Z')).toBe('13:00')
  })

  it('refuses an invalid date instead of printing "Invalid Date"', () => {
    expect(() => formatDate('not a date')).toThrow(RangeError)
  })
})

describe('COMMON_TEXTS', () => {
  it('has the unknown-status label used by StatusBadge', () => {
    expect(COMMON_TEXTS.unknownStatus).toBe('Estado desconhecido')
  })
})
