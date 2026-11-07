import { ReasonAction } from '@portal-dos-interpretes/features/requests/Lifecycle'
import { ReviewCard } from '@portal-dos-interpretes/features/requests/Reviews'
import type { ReviewRow } from '@portal-dos-interpretes/features/requests/data'
import { useRequestAction, useReviews } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'

// admin-web, the account sheet (reviews.md "Ecrãs"): the reviews it received and gave, with
// "Esconder" for a moderator (R-REV-04). The team reads every review (R-REV-03).

function Hide({ row }: { row: ReviewRow }) {
  const hide = useRequestAction((repository, reason: string) => repository.hideReview(row.id ?? '', reason), 'Avaliação escondida. O autor foi avisado.')
  return (
    <div className="pt-2">
      <ReasonAction label="Esconder" title="Esconder a avaliação" confirmLabel="Esconder" variant="destructive" pending={hide.isPending}
        description="A avaliação deixa de aparecer e de contar para a média. Fica guardada e o autor é avisado."
        onConfirm={(reason, close) => hide.mutate(reason, { onSuccess: close })} />
    </div>
  )
}

export function AccountReviews({ accountId, role, canModerate }: { accountId: string; role: 'requester' | 'interpreter'; canModerate: boolean }) {
  const received = useReviews({ targetId: accountId, role })
  const given = useReviews({ authorId: accountId })
  const rows = [...(received.data ?? []), ...(given.data ?? [])]
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2"><CardTitle className="text-base">Avaliações</CardTitle></CardHeader>
      <CardContent>
        {received.isPending || given.isPending ? <TableSkeleton rows={3} />
          : received.isError ? <QueryError error={received.error} onRetry={() => void received.refetch()} />
          : given.isError ? <QueryError error={given.error} onRetry={() => void given.refetch()} />
          : rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem avaliações.</p> : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <ReviewCard key={row.id} row={row} perspective={row.author_account === accountId ? 'author' : 'reader'}
                action={canModerate && !row.hidden ? <Hide row={row} /> : null} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
