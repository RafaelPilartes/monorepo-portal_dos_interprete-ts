// Dates are stored in UTC and shown/calculated in Luanda time (data-model.md §1).
// The SQL side is util.app_timezone(); this is the only TypeScript copy.
export const APP_TIMEZONE = 'Africa/Luanda'

const LOCALE = 'pt-PT'

function format(date: Date | string, options: Intl.DateTimeFormatOptions): string {
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`invalid date: ${String(date)}`)
  }
  return new Intl.DateTimeFormat(LOCALE, { timeZone: APP_TIMEZONE, ...options }).format(value)
}

/** "25/10/2026" in Luanda time. */
export const formatDate = (date: Date | string): string =>
  format(date, { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "14:30" in Luanda time. */
export const formatTime = (date: Date | string): string =>
  format(date, { hour: '2-digit', minute: '2-digit', hour12: false })

/** "25/10/2026, 14:30" in Luanda time. */
export const formatDateTime = (date: Date | string): string =>
  format(date, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

/** The calendar day in Luanda, as "YYYY-MM-DD" (for "today", deadlines, grouping). */
export function luandaDay(date: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(typeof date === 'string' ? new Date(date) : date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
