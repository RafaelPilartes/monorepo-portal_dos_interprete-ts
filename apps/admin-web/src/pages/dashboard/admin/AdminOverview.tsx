import { Link } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { greetingFor, WaitingList, type WaitingRow } from '@portal-dos-interpretes/features/components/WaitingList'
import { useStaffCount, useStaffUpcoming } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { AgendaItem, AgendaList } from '@portal-dos-interpretes/ui/components/agenda'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { CalendarClock } from 'lucide-react'

// admin-web / (the team's first page): the queues the signed-in level works on, and the agenda of
// the platform's next requests — from the database (the old sample figures are gone). The counters
// and reports of the operations dashboard arrive with H13 (admin-operations.md).

export default function AdminOverview() {
  const session = useSession()
  const account = session.status === 'authenticated' ? session.account : null
  const level = account?.staffLevel ?? null
  const finance = level === 'finance' || level === 'super_admin'
  const moderates = level === 'moderator' || level === 'super_admin'
  const operates = moderates || level === 'request_operator'

  const disputes = useStaffCount('disputed', moderates)
  const waiting = useStaffCount('awaiting_interpreters', operates)
  const proofs = useBillingQuery(['proofs', false], (repository) => (finance ? repository.proofs(false) : Promise.resolve([])))
  const refunds = useBillingQuery(['refunds'], (repository) => (finance ? repository.refunds() : Promise.resolve([])))
  const payouts = useBillingQuery(['payouts'], (repository) => (finance ? repository.payouts() : Promise.resolve([])))
  const upcoming = useStaffUpcoming(10)

  const rows: WaitingRow[] = [
    ...(moderates ? [{ label: 'Disputas abertas', detail: 'Resolve com notas; as partes são avisadas.', count: disputes.data ?? 0, href: '/requests', tone: 'urgent' as const }] : []),
    ...(finance ? [
      { label: 'Comprovativos por validar', detail: 'Aceita ou recusa, dos mais antigos primeiro.', count: proofs.data?.length ?? 0, href: '/payments', tone: 'urgent' as const },
      { label: 'Reembolsos a transferir', detail: 'Marca como pago com a referência.', count: (refunds.data ?? []).filter((row) => row.status === 'pending').length, href: '/refunds' },
      { label: 'Repasses em fila', detail: 'O valor dos intérpretes dos pedidos geridos.', count: (payouts.data ?? []).filter((row) => row.status === 'queued').length, href: '/payouts' },
    ] : []),
    ...(operates ? [{ label: 'Pedidos à espera de intérpretes', detail: 'Ainda sem todos os intérpretes.', count: waiting.data ?? 0, href: '/requests' }] : []),
  ]
  const loading = (moderates && disputes.isPending) || (operates && waiting.isPending) || proofs.isPending || refunds.isPending || payouts.isPending

  return (
    <div className="space-y-6">
      <PageHeader title={greetingFor(account?.fullName)} description="As filas do teu trabalho e os próximos pedidos da plataforma." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="order-2 min-w-0 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Próximos pedidos</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/requests">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            {upcoming.isPending ? <Skeleton className="h-48 w-full" />
              : upcoming.isError ? <QueryError error={upcoming.error} onRetry={() => void upcoming.refetch()} />
              : upcoming.data.length === 0 ? <EmptyState icon={CalendarClock} title="Nenhum pedido marcado." description="Os pedidos em curso da plataforma aparecem aqui, por dia e hora." />
              : (
                <AgendaList label="Próximos pedidos">
                  {upcoming.data.map((row) => (
                    <AgendaItem key={row.id} at={row.starts_at} aside={<StatusBadge kind="request" status={row.status ?? ''} />}>
                      <Link to={`/requests/${row.id}`} className="font-medium hover:underline">{row.service_title}</Link>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{row.code}</span> · {REQUEST_KIND_LABELS[row.kind as keyof typeof REQUEST_KIND_LABELS]} · {row.organization_name ?? row.created_by_name}
                      </p>
                    </AgendaItem>
                  ))}
                </AgendaList>
              )}
          </CardContent>
        </Card>

        <Card className="order-1 h-fit min-w-0 lg:order-2">
          <CardHeader className="pb-1"><CardTitle>Filas de trabalho</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">O teu nível não tem filas de trabalho nesta página.</p>
              : loading ? <Skeleton className="h-28 w-full" />
              : <WaitingList rows={rows} empty="Nenhuma fila com trabalho. Está tudo em dia." />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
