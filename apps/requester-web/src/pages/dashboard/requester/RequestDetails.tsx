import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { useListing } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { priceText, RequestChat, RequestFacts, RequestTimeline } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useRequestAction, useRequestDetail } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime, REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

// requester-web /requests/:id (requests-core.md, requests-direct.md): the request, its interpreters
// with their state and price, the chat with each, the timeline. Actions while it waits for
// interpreters: invite another (when there is a free place), go on with fewer, change the link.
// "Cancelar pedido" arrives with the service lifecycle (H8).

type Detail = NonNullable<ReturnType<typeof useRequestDetail>['data']>

function assignmentLine(row: Detail['assignments'][number]): string {
  switch (row.status) {
    case 'invited': return `Convidado, responde até ${formatDateTime(row.invite_expires_at ?? '')}`
    case 'declined': return `Recusou${row.decline_reason ? `: ${row.decline_reason}` : ''}`
    case 'expired': return 'O convite expirou'
    default: return ''
  }
}

function InviteAnother({ detail }: { detail: Detail }) {
  const [interpreterId, setInterpreterId] = useState('')
  const listing = useListing({ limit: 50, offset: 0 })
  const invite = useRequestAction((repository, id: string) => repository.invite(detail.request.id ?? '', id), 'Convite enviado.')
  const taken = new Set(detail.assignments.map((row) => row.interpreter_id))
  const options = (listing.data?.rows ?? []).filter((row) => row.account_id && !taken.has(row.account_id))
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="invite-another">Convidar outro intérprete</Label>
        <Select value={interpreterId} onValueChange={setInterpreterId}>
          <SelectTrigger id="invite-another" className="w-64"><SelectValue placeholder="Escolhe do directório" /></SelectTrigger>
          <SelectContent>{options.map((row) => <SelectItem key={row.account_id} value={row.account_id ?? ''}>{row.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button variant="outline" disabled={!interpreterId || invite.isPending} onClick={() => invite.mutate(interpreterId, { onSuccess: () => setInterpreterId('') })}>Convidar</Button>
    </div>
  )
}

function MeetingLink({ detail }: { detail: Detail }) {
  const [link, setLink] = useState(detail.request.meeting_link ?? '')
  const save = useRequestAction((repository, value: string) => repository.updateMeetingLink(detail.request.id ?? '', value), 'Link actualizado.')
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-1.5">
        <Label htmlFor="meeting-link">Link da reunião</Label>
        <Input id="meeting-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} />
      </div>
      <Button variant="outline" disabled={save.isPending || link.trim() === (detail.request.meeting_link ?? '')} onClick={() => save.mutate(link.trim())}>Guardar link</Button>
    </div>
  )
}

export default function RequestDetails() {
  const { id = '' } = useParams()
  const location = useLocation()
  const created = (location.state as { created?: string } | null)?.created
  const detail = useRequestDetail(id)
  const reduce = useRequestAction((repository, needed: number) => repository.reduce(id, needed), 'Pedido actualizado.')

  if (detail.isPending) return <Skeleton className="h-96 w-full" />
  if (detail.isError) return <QueryError error={detail.error} onRetry={() => void detail.refetch()} />
  if (!detail.data) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Não encontrámos este pedido.</h1>
        <Button variant="outline" asChild><Link to="/requests">Ver os meus pedidos</Link></Button>
      </div>
    )
  }
  const { request, assignments, timeline } = detail.data
  const waiting = request.status === 'awaiting_interpreters'
  const accepted = request.accepted_count ?? 0
  const pending = assignments.filter((row) => row.status === 'invited').length
  const hasRoom = accepted + pending < (request.interpreters_needed ?? 0)
  const manage = request.can_manage === true

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/requests"><ArrowLeft className="h-4 w-4" />Pedidos</Link></Button>
      {created && (
        <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Pedido {created} enviado. Os intérpretes convidados foram avisados.</AlertDescription></Alert>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{request.code} · {REQUEST_KIND_LABELS[request.kind as keyof typeof REQUEST_KIND_LABELS]}</p>
          <h1 className="text-2xl font-semibold">{request.service_title}</h1>
        </div>
        <StatusBadge kind="request" status={request.status ?? ''} className="text-sm" />
      </div>
      {waiting && (
        <p className="text-sm text-muted-foreground">
          {accepted} de {request.interpreters_needed} {request.interpreters_needed === 1 ? 'intérprete aceite' : 'intérpretes aceites'}.
          {pending > 0 ? ` ${pending} ${pending === 1 ? 'convite' : 'convites'} à espera de resposta.` : ''}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RequestFacts request={request} />
          <Card>
            <CardHeader><CardTitle>Intérpretes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y">
                {assignments.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <Link to={`/interpreters/${row.interpreter_slug}`} className="font-medium hover:underline">{row.interpreter_name}</Link>
                      {assignmentLine(row) && <p className="text-muted-foreground">{assignmentLine(row)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums">{row.agreed_price_aoa !== null ? priceText(row.agreed_price_aoa, row.agreed_travel_fee_aoa) : priceText(row.offered_price_aoa, row.offered_travel_fee_aoa)}</span>
                      <StatusBadge kind="assignment" status={row.status ?? ''} />
                    </div>
                  </li>
                ))}
              </ul>
              {manage && waiting && hasRoom && <InviteAnother detail={detail.data} />}
              {manage && waiting && accepted > 0 && accepted < (request.interpreters_needed ?? 0) && (
                <Button variant="outline" disabled={reduce.isPending} onClick={() => reduce.mutate(accepted)}>
                  Seguir com {accepted} {accepted === 1 ? 'intérprete' : 'intérpretes'}
                </Button>
              )}
              {manage && request.modality === 'online' && accepted === 0 && waiting && <MeetingLink detail={detail.data} />}
            </CardContent>
          </Card>
          {assignments.filter((row) => row.thread_id).map((row) => (
            <RequestChat key={row.id} threadId={row.thread_id ?? ''} title={`Conversa com ${row.interpreter_name ?? 'o intérprete'}`}
              negotiation={manage ? { role: 'requester', assignmentStatus: row.status ?? '', offeredPrice: row.offered_price_aoa,
                travelFee: row.offered_travel_fee_aoa, interpreterNegotiates: row.accepts_negotiation !== false } : undefined} />
          ))}
        </div>
        <RequestTimeline rows={timeline} />
      </div>
    </div>
  )
}
