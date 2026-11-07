import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import type { DisputeRow } from '@portal-dos-interpretes/features/requests/data'
import { DisputeList, ReasonAction } from '@portal-dos-interpretes/features/requests/Lifecycle'
import { priceText, RequestFacts, RequestTimeline } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useRequestAction, useRequestDetail, useRequestDisputes } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime, REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@portal-dos-interpretes/ui/components/radio-group'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { ArrowLeft } from 'lucide-react'

// admin-web /requests/:id (service-lifecycle.md "Ecrãs"): the request, its interpreters, the
// timeline and the dispute panel with "Resolver" for a moderator (R-LIFE-06). A moderator who
// is a party is refused by the base (FORBIDDEN). Reading the chat arrives with R-PRIV-05 (H14).
// A moderator (or a request operator on managed ones) can also cancel the request (R-LIFE-01).

const NOT_CANCELLABLE = ['delivered', 'completed', 'disputed', 'cancelled', 'expired']
const DONE = ['delivered', 'disputed', 'completed']

function ResolveDispute({ dispute }: { dispute: DisputeRow }) {
  const [open, setOpen] = useState(false)
  const [resolution, setResolution] = useState<'completed' | 'cancelled' | ''>('')
  const [notes, setNotes] = useState('')
  const resolve = useRequestAction((repository, input: { resolution: 'completed' | 'cancelled'; notes: string }) =>
    repository.resolveDispute(dispute.id ?? '', input.resolution, input.notes), 'Disputa resolvida. As duas partes foram avisadas.')
  const ok = resolution !== '' && notes.trim().length >= 3
  return (
    <>
      <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>Resolver</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver a disputa</DialogTitle>
            <DialogDescription>A decisão fica registada na auditoria e as duas partes são avisadas.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
            if (resolution !== '' && ok) resolve.mutate({ resolution, notes: notes.trim() }, { onSuccess: () => setOpen(false) })
          }}>
            <RadioGroup value={resolution} onValueChange={(value) => setResolution(value as 'completed' | 'cancelled')} aria-label="Decisão">
              <div className="flex items-center gap-2"><RadioGroupItem value="completed" id="resolution-completed" /><Label htmlFor="resolution-completed">O serviço conta como feito</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="cancelled" id="resolution-cancelled" /><Label htmlFor="resolution-cancelled">O serviço não conta</Label></div>
            </RadioGroup>
            <div className="space-y-1.5">
              <Label htmlFor="resolution-notes">Notas (as partes leem)</Label>
              <Textarea id="resolution-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
              <Button type="submit" disabled={!ok || resolve.isPending}>Resolver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AdminRequestDetails() {
  const { id = '' } = useParams()
  const session = useSession()
  const level = session.status === 'authenticated' ? session.account.staffLevel : null
  const detail = useRequestDetail(id)
  const disputes = useRequestDisputes(id)
  const cancel = useRequestAction((repository, reason: string) => repository.cancelRequest(id, reason), 'Pedido cancelado. As partes foram avisadas.')

  if (detail.isPending) return <Skeleton className="h-96 w-full" />
  if (detail.isError) return <QueryError error={detail.error} onRetry={() => void detail.refetch()} />
  if (!detail.data) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Não encontrámos este pedido.</h1>
        <Button variant="outline" asChild><Link to="/requests">Ver os pedidos</Link></Button>
      </div>
    )
  }
  const { request, assignments, timeline } = detail.data
  const moderates = level === 'moderator' || level === 'super_admin'
  const canCancel = (moderates || (level === 'request_operator' && request.kind === 'managed')) && !NOT_CANCELLABLE.includes(request.status ?? '')
    && !assignments.some((row) => DONE.includes(row.status ?? ''))

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/requests"><ArrowLeft className="h-4 w-4" />Pedidos</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{request.code} · {REQUEST_KIND_LABELS[request.kind as keyof typeof REQUEST_KIND_LABELS]}</p>
          <h1 className="text-2xl font-semibold">{request.service_title}</h1>
          <p className="text-sm text-muted-foreground">Pedido por {request.organization_name ?? request.created_by_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge kind="request" status={request.status ?? ''} className="text-sm" />
          {canCancel && (
            <ReasonAction label="Cancelar pedido" title="Cancelar o pedido" confirmLabel="Cancelar o pedido" variant="destructive" pending={cancel.isPending}
              description="Cancelado pela equipa: nunca conta como tardio. As partes são avisadas."
              onConfirm={(reason, close) => cancel.mutate(reason, { onSuccess: close })} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {(disputes.data?.length ?? 0) > 0 && (
            <Card className={request.status === 'disputed' ? 'border-destructive/50' : undefined}>
              <CardHeader><CardTitle>Disputa</CardTitle></CardHeader>
              <CardContent>
                <DisputeList rows={disputes.data ?? []} action={(row) => (moderates && row.status === 'open' ? <ResolveDispute dispute={row} /> : null)} />
              </CardContent>
            </Card>
          )}
          <RequestFacts request={request} />
          <Card>
            <CardHeader><CardTitle>Intérpretes</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {assignments.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{row.interpreter_name}</p>
                      {row.delivered_at && <p className="text-muted-foreground">Marcou como feito a {formatDateTime(row.delivered_at)}</p>}
                      {row.cancel_reason && <p className="text-muted-foreground">Cancelado{row.late_cancellation ? ' (tardio)' : ''}: {row.cancel_reason}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums">{row.agreed_price_aoa !== null ? priceText(row.agreed_price_aoa, row.agreed_travel_fee_aoa) : priceText(row.offered_price_aoa, row.offered_travel_fee_aoa)}</span>
                      <StatusBadge kind="assignment" status={row.status ?? ''} />
                    </div>
                  </li>
                ))}
              </ul>
              {assignments.length === 0 && <p className="text-sm text-muted-foreground">Ainda sem intérpretes.</p>}
            </CardContent>
          </Card>
        </div>
        <RequestTimeline rows={timeline} />
      </div>
    </div>
  )
}
