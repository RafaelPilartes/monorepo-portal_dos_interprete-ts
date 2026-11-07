import type { ReactNode } from 'react'
import { agendaParts } from '@portal-dos-interpretes/i18n'
import { cn } from '../lib/utils'

// The panels' signature (DESIGN.md, "agenda de clínica"): lists of things that happen at a time
// lead with the day and the time in a fixed left column, read like an appointment book.

/** The left column: "Hoje" / "qua 12 nov" over "14:30", in Luanda time. */
export function AgendaWhen({ at, className }: { at: string | null | undefined; className?: string }) {
  if (!at) return <div className={cn('w-[4.75rem] shrink-0 text-xs text-muted-foreground', className)}>Sem data</div>
  const parts = agendaParts(at)
  return (
    <div className={cn('w-[4.75rem] shrink-0 tabular-nums leading-tight', className)}>
      <p className={cn('text-xs', parts.relative ? 'font-medium text-primary' : 'text-muted-foreground')}>
        {parts.relative ?? `${parts.weekday} ${parts.day}`}
      </p>
      <p className="mt-0.5 text-[0.9375rem] font-semibold tracking-[-0.01em]">{parts.time}</p>
    </div>
  )
}

/** One appointment: the time column, what it is, and what it needs (status, action). */
export function AgendaItem({ at, children, aside, className }: { at: string | null | undefined; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <li className={cn('flex items-start gap-4 py-3.5 sm:items-center', className)}>
      <AgendaWhen at={at} />
      <div className="min-w-0 flex-1 border-l border-border pl-4">{children}</div>
      {aside && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{aside}</div>}
    </li>
  )
}

/** The book: items separated by hairlines. */
export function AgendaList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return <ul aria-label={label} className={cn('divide-y divide-border', className)}>{children}</ul>
}
