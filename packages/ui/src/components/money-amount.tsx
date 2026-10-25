import { formatAoa } from '@portal-dos-interpretes/i18n'
import { cn } from '../lib/utils'

export interface MoneyAmountProps {
  /** Whole kwanzas, as the database returns them (D-37). The screen never computes it. */
  amount: number
  className?: string | undefined
}

/** Shows an amount the database computed; no arithmetic here (claude-code-rules.md §9). */
export function MoneyAmount({ amount, className }: MoneyAmountProps) {
  return (
    <span className={cn('tabular-nums whitespace-nowrap', className)} data-testid="money-amount">
      {formatAoa(amount)}
    </span>
  )
}
