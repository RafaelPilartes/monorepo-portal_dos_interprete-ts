import { Link } from 'react-router-dom'
import { useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { priceText } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useMyAssignments, useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatAoa, formatDate, formatDateTime, PAYOUT_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Wallet } from 'lucide-react'

// interpreter-web /earnings (payments.md "Ecrãs"): the payouts of managed requests (queued, paid,
// with the reference), and apart the prices agreed in direct and open requests, paid outside the
// Portal (D-30). Nothing is added up here: each value is what the database holds.
export default function InterpreterEarnings() {
  const { accountId } = useRequests()
  // Only the interpreter's own: an account that is also finance reads every payout in the view.
  const payouts = useBillingQuery(['payouts', 'mine', accountId], async (repository) =>
    (await repository.payouts()).filter((row) => row.interpreter_id === accountId))
  const mine = useMyAssignments()
  const agreed = (mine.data ?? []).filter((row) => row.kind !== 'managed' && ['accepted', 'delivered', 'completed'].includes(row.status ?? '') && row.agreed_price_aoa !== null)
  return (
    <div className="space-y-6">
      <PageHeader title="Ganhos" description="Os repasses dos pedidos geridos e os valores acordados nos outros pedidos." />
      <Card>
        <CardHeader><CardTitle>Repasses do Portal</CardTitle></CardHeader>
        <CardContent>
          {payouts.isPending ? <TableSkeleton rows={3} />
            : payouts.isError ? <QueryError error={payouts.error} onRetry={() => void payouts.refetch()} />
            : payouts.data.length === 0 ? <EmptyState icon={Wallet} title="Ainda não tens repasses." description="Quando concluíres um pedido gerido, o teu valor entra aqui e a equipa transfere-o." />
            : (
              <ul className="divide-y text-sm">
                {payouts.data.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{row.service_title} · {row.request_code}</p>
                      <p className="text-muted-foreground">{formatDate(row.starts_at ?? '')}{row.status === 'paid' ? ` · transferido a ${formatDateTime(row.paid_at ?? '')}, referência ${row.paid_reference}` : ''}</p>
                      {row.status === 'queued' && !row.payout_details_snapshot && (
                        <p className="text-destructive">Indica o IBAN em <Link to="/settings" className="underline">Configurações</Link> para receberes.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatAoa(row.amount_aoa ?? 0)}</span>
                      <Badge variant="outline">{PAYOUT_STATUS_LABELS[row.status as keyof typeof PAYOUT_STATUS_LABELS]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Valores acordados noutros pedidos</CardTitle>
          <p className="text-sm text-muted-foreground">Pagos fora do Portal: combinas o pagamento com quem pede.</p>
        </CardHeader>
        <CardContent>
          {mine.isPending ? <TableSkeleton rows={3} />
            : mine.isError ? <QueryError error={mine.error} onRetry={() => void mine.refetch()} />
            : agreed.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não tens pedidos directos ou abertos aceites.</p>
            : (
              <ul className="divide-y text-sm">
                {agreed.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link to={`/requests/${row.request_id}`} className="hover:underline">{row.service_title} · {row.code} · {formatDate(row.starts_at ?? '')}</Link>
                    <span className="tabular-nums">{priceText(row.agreed_price_aoa, row.agreed_travel_fee_aoa)}</span>
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
