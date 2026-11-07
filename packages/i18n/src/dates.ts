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

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * The parts of the agenda column (the panels' "appointment book", DESIGN.md): "qua", "12 nov",
 * "14:30", in Luanda time; "Hoje" and "Amanhã" by the Luanda calendar.
 */
export function agendaParts(date: Date | string, now: Date = new Date()): { weekday: string; day: string; time: string; relative: string | null } {
  // Fixed short names: the runtimes' pt-PT "short" forms differ (e.g. "20/11" or "20 de nov.").
  const target = luandaDay(date)
  const [year, month, dayOfMonth] = target.split('-').map(Number) as [number, number, number]
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()] ?? ''
  const day = `${dayOfMonth} ${MONTHS[month - 1] ?? ''}`
  const time = formatTime(date)
  const today = luandaDay(now)
  const tomorrow = luandaDay(new Date(now.getTime() + 24 * 3600_000))
  const relative = target === today ? 'Hoje' : target === tomorrow ? 'Amanhã' : null
  return { weekday, day, time, relative }
}

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

/**
 * A day and a time typed in Luanda ("2026-11-03", "14:30") as an instant (ISO, UTC). Luanda is
 * UTC+01:00 all year (no daylight saving), so the offset is fixed (requests-core.md, "Fuso horário").
 */
export function fromLuandaLocal(day: string, time: string): string {
  return new Date(`${day}T${time}:00+01:00`).toISOString()
}
