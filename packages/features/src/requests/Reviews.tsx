import { useState } from 'react'
import { formatDate, formatDateTime } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portal-dos-interpretes/ui/components/tabs'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { CheckCircle2, Star } from 'lucide-react'
import { DataError } from '@portal-dos-interpretes/data'
import { QueryError } from '../components/QueryStates'
import { errorDetails } from '../lib/errorText'
import type { ReviewRow, ReviewToDoRow } from './data'
import { useRating, useRequestAction, useRequests, useReviews, useReviewsToDo, useUnrevealedCount } from './RequestsContext'

// Reviews (reviews.md "Ecrãs"): the stars, the form after a completed service, the review cards,
// the /reviews page of each panel and the average (R-REV-05). What each person sees is decided by
// booking.review_details (R-REV-03); the screens only show it.

export function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? 'fill-warning text-warning' : 'text-muted-foreground/40'}`} aria-hidden="true" />
      ))}
    </span>
  )
}

/** R-DIR-05: "4,6 (12 avaliações)", or "Ainda sem avaliações", never "0,0". */
export function RatingLine({ accountId, role }: { accountId: string; role: 'requester' | 'interpreter' }) {
  const rating = useRating(accountId, role)
  if (rating.isPending || rating.isError) return null
  if (rating.data.count === 0 || rating.data.average === null) return <p className="text-sm text-muted-foreground">Ainda sem avaliações</p>
  return (
    <p className="flex items-center gap-2 text-sm">
      <Stars value={Math.round(rating.data.average)} />
      <span className="font-medium tabular-nums">{rating.data.average.toLocaleString('pt-PT', { minimumFractionDigits: 1 })}</span>
      <span className="text-muted-foreground">({rating.data.count === 1 ? '1 avaliação' : `${rating.data.count} avaliações`})</span>
    </p>
  )
}

interface Sent { todo: ReviewToDoRow; revealed: boolean }

/** "daqui a N dias", counted from the completion (R-REV-02), as the base gives it. */
function revealIn(revealAt: string | null): string {
  const days = Math.ceil((Date.parse(revealAt ?? '') - Date.now()) / 86_400_000)
  return Number.isFinite(days) && days > 1 ? `daqui a ${days} dias` : days === 1 ? 'daqui a 1 dia' : 'em breve'
}

function ThankYou({ sent }: { sent: Sent }) {
  return (
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertDescription>
        {sent.revealed
          ? `Obrigado. ${sent.todo.other_name ?? 'A outra parte'} já tinha avaliado: as duas avaliações estão visíveis.`
          : `Obrigado. A tua avaliação fica visível quando ${sent.todo.other_name ?? 'a outra parte'} também avaliar, ou ${revealIn(sent.todo.reveal_at)}.`}
      </AlertDescription>
    </Alert>
  )
}

/** "Avalia o teu serviço com {nome}" (R-REV-01): 1 to 5 stars and an optional comment. */
function ReviewForm({ todo, onSent }: { todo: ReviewToDoRow; onSent: (sent: Sent) => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  // The thanks are recorded inside the action: once the list is read again this form is gone, and
  // a callback given to mutate() would no longer run.
  const submit = useRequestAction(async (repository, input: { rating: number; comment: string }) => {
    const review = await repository.submitReview(todo.assignment_id ?? '', input.rating, input.comment) as { revealed_at?: string | null }
    onSent({ todo, revealed: Boolean(review?.revealed_at) })
    return review
  }, 'Avaliação enviada.')
  const other = todo.other_name ?? 'a outra parte'
  const fieldError = submit.error instanceof DataError ? errorDetails(submit.error).rating : undefined
  const id = `review-${todo.assignment_id}`
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avalia o teu serviço com {other}</CardTitle>
        <p className="text-sm text-muted-foreground">{todo.service_title} · {todo.request_code}. Podes avaliar até {formatDateTime(todo.review_by ?? '')}.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault()
          submit.mutate({ rating, comment: comment.trim() })
        }}>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Estrelas</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} aria-pressed={rating === n}
                  className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setRating(n)}>
                  <Star className={`h-7 w-7 ${n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/50'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
            {fieldError && <p className="mt-1 text-sm text-destructive">{fieldError}</p>}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor={id}>Comentário (opcional)</Label>
            <Textarea id={id} rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <Button type="submit" disabled={submit.isPending}>Enviar avaliação</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ReviewCard({ row, perspective, action }: { row: ReviewRow; perspective: 'author' | 'target' | 'reader'; action?: React.ReactNode }) {
  const who = perspective === 'author' ? `Para ${row.target_name}` : row.author_name
  return (
    <li className="space-y-1 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{who}</span>
        <Stars value={row.rating ?? 0} />
      </div>
      {row.comment && <p>{row.comment}</p>}
      <p className="text-xs text-muted-foreground">
        {row.service_title} · {formatDate(row.submitted_at ?? '')}
        {perspective === 'author' && !row.revealed_at ? ' · Ainda não visível: espera pela outra parte' : ''}
        {row.hidden ? ` · Escondida pela equipa${row.hidden_reason ? `: ${row.hidden_reason}` : ''}` : ''}
      </p>
      {action}
    </li>
  )
}

function ReviewList({ rows, perspective, empty }: { rows: ReviewRow[]; perspective: 'author' | 'target'; empty: string }) {
  if (rows.length === 0) return <EmptyState icon={Star} title={empty} description="As avaliações aparecem quando as duas partes avaliam, ou ao fim do prazo." />
  return <ul className="space-y-3">{rows.map((row) => <ReviewCard key={row.id} row={row} perspective={perspective} />)}</ul>
}

/**
 * The forms of the reviews to do; a sent one leaves the list when it is read again, so the thanks
 * are kept here, where the list is.
 */
function ReviewForms({ rows, empty = null }: { rows: ReviewToDoRow[]; empty?: React.ReactNode }) {
  const [sent, setSent] = useState<Sent[]>([])
  const key = (row: ReviewToDoRow) => `${row.assignment_id}-${row.author_role}`
  const done = new Set(sent.map((item) => key(item.todo)))
  if (rows.length === 0 && sent.length === 0) return <>{empty}</>
  return (
    <div className="space-y-4">
      {sent.map((item) => <ThankYou key={key(item.todo)} sent={item} />)}
      {rows.filter((row) => !done.has(key(row))).map((row) => <ReviewForm key={key(row)} todo={row} onSent={(item) => setSent((list) => [...list, item])} />)}
    </div>
  )
}

/** The review forms of one request's completed services (the request detail, R-REV-01). */
export function RequestReviewForms({ requestId }: { requestId: string }) {
  const todo = useReviewsToDo()
  return <ReviewForms rows={(todo.data ?? []).filter((row) => row.request_id === requestId)} />
}

/** /reviews of requester-web and interpreter-web: "Por avaliar", "Que fiz", "Que recebi". */
export function ReviewsPage({ role }: { role: 'requester' | 'interpreter' }) {
  const { accountId } = useRequests()
  const todo = useReviewsToDo()
  const mine = useReviews({ authorId: accountId, role }, accountId !== '')
  const received = useReviews({ targetId: accountId, role }, accountId !== '')
  const forms = (todo.data ?? []).filter((row) => row.author_role === role)
  return (
    <Tabs defaultValue="todo" className="space-y-4">
      <TabsList>
        <TabsTrigger value="todo">Por avaliar{forms.length > 0 ? ` (${forms.length})` : ''}</TabsTrigger>
        <TabsTrigger value="mine">Que fiz</TabsTrigger>
        <TabsTrigger value="received">Que recebi</TabsTrigger>
      </TabsList>
      <TabsContent value="todo" className="space-y-4">
        {todo.isPending ? <Skeleton className="h-40 w-full" />
          : todo.isError ? <QueryError error={todo.error} onRetry={() => void todo.refetch()} />
          : <ReviewForms rows={forms} empty={<EmptyState icon={Star} title="Nada por avaliar." description="Depois de cada serviço concluído, podes avaliar a outra parte aqui." />} />}
      </TabsContent>
      <TabsContent value="mine">
        {mine.isPending ? <Skeleton className="h-40 w-full" />
          : mine.isError ? <QueryError error={mine.error} onRetry={() => void mine.refetch()} />
          : <ReviewList rows={mine.data} perspective="author" empty="Ainda não fizeste avaliações." />}
      </TabsContent>
      <TabsContent value="received" className="space-y-4">
        <RatingLine accountId={accountId} role={role} />
        <UnrevealedNote role={role} />
        {received.isPending ? <Skeleton className="h-40 w-full" />
          : received.isError ? <QueryError error={received.error} onRetry={() => void received.refetch()} />
          : <ReviewList rows={received.data.filter((row) => row.revealed_at)} perspective="target" empty="Ainda não recebeste avaliações visíveis." />}
      </TabsContent>
    </Tabs>
  )
}

/** "1 avaliação por revelar" (interpreter-profile-and-directory.md, /profile/reviews). */
export function UnrevealedNote({ role }: { role: 'requester' | 'interpreter' }) {
  const count = useUnrevealedCount(role)
  if (!count.data) return null
  return <p className="text-sm text-muted-foreground">{count.data === 1 ? '1 avaliação por revelar' : `${count.data} avaliações por revelar`}</p>
}

/** The revealed reviews of an account as others read them: an interpreter's profile, a requester for its interpreters. */
export function ReceivedReviews({ accountId, role, title }: { accountId: string; role: 'requester' | 'interpreter'; title: string }) {
  const reviews = useReviews({ targetId: accountId, role }, accountId !== '')
  const rows = (reviews.data ?? []).filter((row) => row.revealed_at && !row.hidden)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <RatingLine accountId={accountId} role={role} />
      {rows.length > 0 && <ul className="space-y-3">{rows.slice(0, 10).map((row) => <ReviewCard key={row.id} row={row} perspective="reader" />)}</ul>}
      {rows.length > 10 && <p className="text-sm text-muted-foreground">E mais {rows.length - 10}.</p>}
    </section>
  )
}
