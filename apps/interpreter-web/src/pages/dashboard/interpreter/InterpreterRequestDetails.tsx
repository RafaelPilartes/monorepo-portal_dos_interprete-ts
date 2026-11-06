import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { priceText, RequestChat, RequestFacts, RequestTimeline } from '@portal-dos-interpretes/features/requests/RequestParts'
import { DisputeList, LATE_WARNING, OpenDispute, ReasonAction } from '@portal-dos-interpretes/features/requests/Lifecycle'
import { useRequestAction, useRequestDetail, useRequestDisputes, useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
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
// the chat with the requester and the timeline. An overlap answers SCHEDULE_OVERLAP. Once
// accepted (service-lifecycle.md): cancel the participation before the start (warned when late),
// mark as done from the end, dispute after the start.
export default function InterpreterRequestDetails() {
  const { id = '' } = useParams()
  const { accountId } = useRequests()
  const detail = useRequestDetail(id)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const accept = useRequestAction((repository, assignmentId: string) => repository.accept(assignmentId), 'Pedido aceite. O solicitante foi avisado.')
  const decline = useRequestAction((repository, input: { id: string; reason: string }) => repository.decline(input.id, input.reason), 'Recusaste o pedido.')
  const withdraw = useRequestAction((repository, assignmentId: string) => repository.withdraw(assignmentId), 'Candidatura retirada.')
  const disputes = useRequestDisputes(id)
  const cancel = useRequestAction((repository, input: { id: string; reason: string }) => repository.cancelAssignment(input.id, input.reason),
    'Participação cancelada. O solicitante foi avisado.')
  const deliver = useRequestAction((repository, assignmentId: string) => repository.deliver(assignmentId), 'Marcado como feito. O solicitante foi avisado.')

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
  const applied = mine.status === 'applied'
  const reasonOk = reason.trim().length >= 3
  const accepted = mine.status === 'accepted'
  const started = Date.parse(request.starts_at ?? '') <= Date.now()
  const finished = Date.parse(request.ends_at ?? '') <= Date.now()

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
            <CardHeader><CardTitle>{invited ? 'Convite' : applied ? 'A tua candidatura' : 'O teu serviço'}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-muted-foreground">{invited || applied ? 'Preço proposto' : 'Preço acordado'} ({request.pricing_mode === 'fixed' ? 'preço fixo' : 'pela duração, ao teu preço por hora'})</span>
                <span className="text-lg font-semibold tabular-nums">
                  {invited || applied ? priceText(mine.offered_price_aoa, mine.offered_travel_fee_aoa) : priceText(mine.agreed_price_aoa, mine.agreed_travel_fee_aoa)}
                </span>
              </div>
              {invited && mine.invite_expires_at && (
                <p className="flex items-center gap-2 font-medium text-warning"><Clock className="h-4 w-4" aria-hidden="true" />Responde até {formatDateTime(mine.invite_expires_at)}</p>
              )}
              {mine.status === 'declined' && mine.decline_reason && <p className="text-muted-foreground">Recusaste: {mine.decline_reason}</p>}
              {applied && (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-muted-foreground">Candidatura enviada: o solicitante escolhe entre os candidatos.</p>
                  <Button variant="outline" disabled={withdraw.isPending} onClick={() => withdraw.mutate(mine.id ?? '')}>Retirar candidatura</Button>
                </div>
              )}
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
              {accepted && !started && (
                <ReasonAction label="Cancelar a minha participação" title="Cancelar a minha participação" confirmLabel="Cancelar a participação"
                  variant="destructive" pending={cancel.isPending} warning={request.cancel_is_late ? LATE_WARNING : null}
                  description="O solicitante é avisado e o lugar volta a ficar livre."
                  onConfirm={(text, close) => cancel.mutate({ id: mine.id ?? '', reason: text }, { onSuccess: close })} />
              )}
              {accepted && started && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={!finished || deliver.isPending} onClick={() => deliver.mutate(mine.id ?? '')}>Marcar como feito</Button>
                  <OpenDispute assignmentId={mine.id ?? ''} other="o solicitante" />
                  {!finished && <p className="w-full text-muted-foreground">Podes marcar como feito a partir de {formatDateTime(request.ends_at ?? '')}.</p>}
                </div>
              )}
              {mine.status === 'delivered' && (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-muted-foreground">Marcaste como feito. {mine.confirm_by ? `Sem resposta do solicitante, fica confirmado a ${formatDateTime(mine.confirm_by)}.` : ''}</p>
                  <OpenDispute assignmentId={mine.id ?? ''} other="o solicitante" />
                </div>
              )}
              {mine.status === 'cancelled' && mine.cancel_reason && <p className="text-muted-foreground">Cancelado: {mine.cancel_reason}</p>}
              {(disputes.data?.length ?? 0) > 0 && <DisputeList rows={disputes.data ?? []} />}
              {accept.isError && <Alert variant="destructive"><AlertDescription>{(accept.error as Error).message}</AlertDescription></Alert>}
            </CardContent>
          </Card>
          <RequestFacts request={request} />
          {mine.thread_id && (
            <RequestChat threadId={mine.thread_id} title={`Conversa com ${request.created_by_name ?? 'o solicitante'}`}
              negotiation={{ role: 'interpreter', assignmentStatus: mine.status ?? '', offeredPrice: mine.offered_price_aoa,
                travelFee: mine.offered_travel_fee_aoa, interpreterNegotiates: true, answerBy: mine.invite_expires_at }} />
          )}
        </div>
        <RequestTimeline rows={timeline} />
      </div>
    </div>
  )
}
