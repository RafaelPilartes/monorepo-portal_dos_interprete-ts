import { Link } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { greetingFor, WaitingList } from '@portal-dos-interpretes/features/components/WaitingList'
import { useMyAssignments, useReviewsToDo } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { MODALITY_TEXT } from '@portal-dos-interpretes/i18n'
import { AgendaItem, AgendaList } from '@portal-dos-interpretes/ui/components/agenda'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { CalendarClock } from 'lucide-react'

// interpreter-web / (the panel's first page): invitations to answer, services to mark as done,
// reviews, payouts waiting for bank details, and the agenda of accepted services — all from the
// database (the old sample data is gone).

export default function InterpreterOverview() {
  const session = useSession()
  const account = session.status === 'authenticated' ? session.account : null
  const mine = useMyAssignments()
  const reviews = useReviewsToDo()
  const payouts = useBillingQuery(['payouts', 'mine', account?.id ?? ''], async (repository) =>
    (await repository.payouts()).filter((row) => row.interpreter_id === account?.id))

  const now = Date.now()
  const rows = mine.data ?? []
  const invites = rows.filter((row) => row.status === 'invited').length
  const toMark = rows.filter((row) => row.status === 'accepted' && Date.parse(row.ends_at ?? '') <= now).length
  const upcoming = rows.filter((row) => ['accepted', 'invited', 'applied'].includes(row.status ?? '') && Date.parse(row.ends_at ?? '') > now)
    .sort((a, b) => Date.parse(a.starts_at ?? '') - Date.parse(b.starts_at ?? '')).slice(0, 8)
  const toReview = (reviews.data ?? []).filter((row) => row.author_role === 'interpreter').length
  const noDetails = (payouts.data ?? []).filter((row) => row.status === 'queued' && !row.payout_details_snapshot).length
  const loading = mine.isPending || reviews.isPending || payouts.isPending

  return (
    <div className="space-y-6">
      <PageHeader title={greetingFor(account?.fullName)} description="Os convites por responder e os teus próximos serviços."
        action={<Button variant="outline" asChild><Link to="/open-requests">Ver solicitações abertas</Link></Button>} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="order-2 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Agenda</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/schedule">Ver calendário</Link></Button>
          </CardHeader>
          <CardContent>
            {mine.isPending ? <Skeleton className="h-48 w-full" />
              : mine.isError ? <QueryError error={mine.error} onRetry={() => void mine.refetch()} />
              : upcoming.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Sem serviços marcados." description="Os convites e os pedidos que aceitares aparecem aqui, por dia e hora."
                  action={<Button variant="outline" asChild><Link to="/open-requests">Ver solicitações abertas</Link></Button>} />
              ) : (
                <AgendaList label="Agenda">
                  {upcoming.map((row) => (
                    <AgendaItem key={row.id} at={row.starts_at} aside={<StatusBadge kind="assignment" status={row.status ?? ''} />}>
                      <Link to={`/requests/${row.request_id}`} className="font-medium hover:underline">{row.service_title}</Link>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{row.code}</span> · {MODALITY_TEXT[row.modality as keyof typeof MODALITY_TEXT]}{row.city ? ` · ${row.city}` : ''}
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
                { label: 'Convites por responder', detail: 'Aceita ou recusa antes do prazo.', count: invites, href: '/requests', tone: 'urgent' },
                { label: 'Marcar como feitos', detail: 'Serviços que já terminaram.', count: toMark, href: '/schedule', tone: 'urgent' },
                { label: 'Indicar o IBAN', detail: 'Tens repasses à espera dos teus dados bancários.', count: noDetails, href: '/settings', tone: 'urgent' },
                { label: 'Avaliações por fazer', detail: 'Avalia quem pediu o serviço.', count: toReview, href: '/reviews' },
              ]} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
