import { useEffect, useState } from 'react'
import { ACCOUNT_STATUS_LABELS } from '@portal-dos-interpretes/i18n'

// Shared by the account and organisation lists and sheets of admin-web.

export const statusVariant = (status: string | null) => (status === 'active' ? 'default' : status === 'suspended' ? 'destructive' : 'secondary')
export const statusLabel = (status: string | null) => ACCOUNT_STATUS_LABELS[status as keyof typeof ACCOUNT_STATUS_LABELS] ?? status ?? '—'

/** Search text that waits for the person to stop typing before asking the server. */
export function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
