import { errorMessage } from './errorText'
import { COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'

export function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{errorMessage(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {COMMON_TEXTS.retry}
      </Button>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label={COMMON_TEXTS.loading} className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}
