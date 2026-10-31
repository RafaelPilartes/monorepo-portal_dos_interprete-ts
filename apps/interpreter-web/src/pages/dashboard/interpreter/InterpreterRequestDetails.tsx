import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { priceText, RequestChat, RequestFacts, RequestTimeline } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useRequestAction, useRequestDetail, useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { ArrowLeft, Clock } from 'lucide-react'

// interpreter-web /requests/:id (requests-direct.md): the request (the beneficiary and the exact
// address only once accepted, D-95), the price offered, "Aceitar" and "Recusar" with a reason,
// the chat with the requester and the timeline. An overlap answers SCHEDULE_OVERLAP.
export default function InterpreterRequestDetails() {
  const { id = '' } = useParams()
  const { accountId } = useRequests()
  const detail = useRequestDetail(id)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const accept = useRequestAction((repository, assignmentId: string) => repository.accept(assignmentId), 'Pedido aceite. O solicitante foi avisado.')
  const decline = useRequestAction((repository, input: { id: string; reason: string }) => repository.decline(input.id, input.reason), 'Recusaste o pedido.')

  if (detail.isPending) return <Skeleton className="h-96 w-full" />
  if (detail.isError) return <QueryError error={detail.error} onRetry={() => void detail.refetch()} />
  const mine = detail.data?.assignments.find((row) => row.interpreter_id === accountId)
  if (!detail.data || !mine) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Não encontrámos este pedido.</h1>
        <Button variant="outline" asChild><Link to="/requests">Ver as minhas solicitações</Link></Button>
      </div>
    )
  }
  const { request, timeline } = detail.data
  const invited = mine.status === 'invited'
  const reasonOk = reason.trim().length >= 3

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/requests"><ArrowLeft className="h-4 w-4" />Solicitações</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{request.code}</p>
          <h1 className="text-2xl font-semibold">{request.service_title}</h1>
          <p className="text-sm text-muted-foreground">Pedido por {request.organization_name ?? request.created_by_name}</p>
        </div>
        <StatusBadge kind="assignment" status={mine.status ?? ''} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className={invited ? 'border-warning/50' : undefined}>
            <CardHeader><CardTitle>{invited ? 'Convite' : 'O teu serviço'}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-muted-foreground">{invited ? 'Preço proposto' : 'Preço acordado'} ({request.pricing_mode === 'fixed' ? 'preço fixo' : 'pela duração, ao teu preço por hora'})</span>
                <span className="text-lg font-semibold tabular-nums">
                  {invited ? priceText(mine.offered_price_aoa, mine.offered_travel_fee_aoa) : priceText(mine.agreed_price_aoa, mine.agreed_travel_fee_aoa)}
                </span>
              </div>
              {invited && mine.invite_expires_at && (
                <p className="flex items-center gap-2 font-medium text-warning"><Clock className="h-4 w-4" aria-hidden="true" />Responde até {formatDateTime(mine.invite_expires_at)}</p>
              )}
              {mine.status === 'declined' && mine.decline_reason && <p className="text-muted-foreground">Recusaste: {mine.decline_reason}</p>}
              {invited && !declining && (
                <div className="flex flex-wrap gap-2">
                  <Button disabled={accept.isPending} onClick={() => accept.mutate(mine.id ?? '')}>{accept.isPending ? 'A aceitar…' : 'Aceitar'}</Button>
                  <Button variant="outline" onClick={() => setDeclining(true)}>Recusar</Button>
                </div>
              )}
              {invited && declining && (
                <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (reasonOk) decline.mutate({ id: mine.id ?? '', reason: reason.trim() }) }}>
                  <Label htmlFor="decline-reason">Motivo (o solicitante vai ler)</Label>
                  <Textarea id="decline-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button type="submit" variant="destructive" disabled={!reasonOk || decline.isPending}>Recusar o pedido</Button>
                    <Button type="button" variant="ghost" onClick={() => setDeclining(false)}>Voltar</Button>
                  </div>
                </form>
              )}
              {accept.isError && <Alert variant="destructive"><AlertDescription>{(accept.error as Error).message}</AlertDescription></Alert>}
            </CardContent>
          </Card>
          <RequestFacts request={request} />
          {mine.thread_id && <RequestChat threadId={mine.thread_id} title={`Conversa com ${request.created_by_name ?? 'o solicitante'}`} />}
        </div>
        <RequestTimeline rows={timeline} />
      </div>
    </div>
  )
}
