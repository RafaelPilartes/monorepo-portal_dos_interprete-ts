import { Link } from 'react-router-dom'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'
import { ChevronRight } from 'lucide-react'

// "À tua espera": what waits on the signed-in person, one line each, with how many and where to
// act (PRODUCT.md principle 2). Counts come from the database views; nothing is invented.

export interface WaitingRow {
  label: string
  detail: string
  count: number
  href: string
  /** "urgent" for what has a deadline or blocks someone else. */
  tone?: 'urgent' | 'normal'
}

export function WaitingList({ rows, empty }: { rows: WaitingRow[]; empty: string }) {
  const open = rows.filter((row) => row.count > 0)
  if (open.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ul className="divide-y divide-border">
      {open.map((row) => (
        <li key={row.href + row.label}>
          <Link to={row.href} className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className={cn('flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums',
              row.tone === 'urgent' ? 'bg-warning/10 text-warning' : 'bg-accent text-accent-foreground')}>{row.count}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{row.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** "Olá, Joana" from the session's first name. */
export function greetingFor(fullName: string | null | undefined): string {
  const first = (fullName ?? '').trim().split(/\s+/)[0]
  return first ? `Olá, ${first}` : 'Olá'
}
