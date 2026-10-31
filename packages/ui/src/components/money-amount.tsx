import { COMMON_TEXTS, formatAoa } from '@portal-dos-interpretes/i18n'
import { cn } from '../lib/utils'

export interface MoneyAmountProps {
  /** Whole kwanzas, as the database returns them (D-37). The screen never computes it. */
  amount: number
  className?: string | undefined
}

/** Shows an amount the database computed; no arithmetic here (claude-code-rules.md §9). */
export function MoneyAmount({ amount, className }: MoneyAmountProps) {
  let text: string
  try {
    text = formatAoa(amount)
  } catch (error) {
    // A wrong amount from the data must not blank the screen; it says so instead.
    console.error('MoneyAmount:', error)
    text = COMMON_TEXTS.amountUnavailable
  }
  return (
    <span className={cn('tabular-nums whitespace-nowrap', className)} data-testid="money-amount">
      {text}
    </span>
  )
}
