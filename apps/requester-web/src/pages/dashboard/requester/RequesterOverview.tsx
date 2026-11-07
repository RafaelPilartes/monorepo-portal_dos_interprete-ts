import { Link } from 'react-router-dom'
import { useRequestContext, useSession } from '@portal-dos-interpretes/auth'
import { useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { greetingFor, WaitingList } from '@portal-dos-interpretes/features/components/WaitingList'
import { useRequestList, useReviewsToDo } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { AgendaItem, AgendaList } from '@portal-dos-interpretes/ui/components/agenda'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { CalendarClock, Plus } from 'lucide-react'

// requester-web / (the panel's first page): what waits on the person, and the agenda of its
// requests still running — all from the database (the old sample data is gone).

export default function RequesterOverview() {
  const session = useSession()
  const account = session.status === 'authenticated' ? session.account : null
  const [organizationId] = useRequestContext(account)
  const requests = useRequestList(false, organizationId, false, 1, 50)
  const payments = useBillingQuery(['payments'], (repository) => repository.payments())
  const reviews = useReviewsToDo()

  const rows = requests.data?.rows ?? []
  const upcoming = [...rows].sort((a, b) => Date.parse(a.starts_at ?? '') - Date.parse(b.starts_at ?? '')).slice(0, 8)
  const toConfirm = rows.filter((row) => row.status === 'delivered').length
  const waitingInterpreters = rows.filter((row) => row.status === 'awaiting_interpreters').length
  const toPay = (payments.data ?? []).filter((row) => row.status === 'awaiting_proof' && row.can_pay).length
  const toReview = (reviews.data ?? []).filter((row) => row.author_role === 'requester').length
  const loading = requests.isPending || payments.isPending || reviews.isPending

  return (
    <div className="space-y-6">
      <PageHeader title={greetingFor(account?.fullName)} description="O que está à tua espera e os teus próximos serviços."
        action={<Button asChild><Link to="/requests/new"><Plus className="h-4 w-4" />Nova solicitação</Link></Button>} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="order-2 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Próximos serviços</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/requests">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            {requests.isPending ? <Skeleton className="h-48 w-full" />
              : requests.isError ? <QueryError error={requests.error} onRetry={() => void requests.refetch()} />
              : upcoming.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Ainda não tens pedidos em curso." description="Escolhe um intérprete e marca o serviço em poucos passos."
                  action={<Button asChild><Link to="/requests/new">Fazer um pedido</Link></Button>} />
              ) : (
                <AgendaList label="Próximos serviços">
                  {upcoming.map((row) => (
                    <AgendaItem key={row.id} at={row.starts_at} aside={<StatusBadge kind="request" status={row.status ?? ''} />}>
                      <Link to={`/requests/${row.id}`} className="font-medium hover:underline">{row.service_title}</Link>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{row.code}</span> · {REQUEST_KIND_LABELS[row.kind as keyof typeof REQUEST_KIND_LABELS]} · {row.accepted_count}/{row.interpreters_needed} {row.interpreters_needed === 1 ? 'intérprete' : 'intérpretes'}
                      </p>
                    </AgendaItem>
                  ))}
                </AgendaList>
              )}
          </CardContent>
        </Card>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader className="pb-1"><CardTitle>À tua espera</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-28 w-full" /> : (
              <WaitingList empty="Nada à tua espera. Está tudo em dia." rows={[
                { label: 'Confirmar serviços feitos', detail: 'O intérprete marcou como feito: confirma ou abre disputa.', count: toConfirm, href: '/requests', tone: 'urgent' },
                { label: 'Pagamentos por fazer', detail: 'Envia o comprovativo da transferência.', count: toPay, href: '/payments', tone: 'urgent' },
                { label: 'Avaliações por fazer', detail: 'Avalia o intérprete depois do serviço.', count: toReview, href: '/reviews' },
                { label: 'À espera de intérpretes', detail: 'Pedidos que ainda não têm todos os intérpretes.', count: waitingInterpreters, href: '/requests' },
              ]} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
