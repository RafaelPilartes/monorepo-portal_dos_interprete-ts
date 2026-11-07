// What the directory screens call things (only what the person reads is Portuguese).

/** Weekdays as the database stores them: 0 = Sunday … 6 = Saturday, like extract(dow). */
export const WEEKDAYS: readonly string[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const LANGUAGE_LEVELS: Readonly<Record<string, string>> = { native: 'Nativo', fluent: 'Fluente', professional: 'Profissional' }

export const PRICING_SUFFIX: Readonly<Record<string, string>> = { hourly: 'por hora', fixed: 'fixo' }

/** "09:00:00" → "09:00". */
export const hhmm = (time: string): string => time.slice(0, 5)

/** The embed URL of a YouTube or Vimeo link, or null for any other link (shown as a plain link). */
export function videoEmbedUrl(url: string): string | null {
  const youtube = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}?rel=0`
  const vimeo = /vimeo\.com\/(\d+)/.exec(url)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}
