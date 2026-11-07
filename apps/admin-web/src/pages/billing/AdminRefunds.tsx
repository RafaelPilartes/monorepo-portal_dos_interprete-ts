import { useBillingAction, useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { formatAoa, formatDateTime, REFUND_REASON_LABELS, REFUND_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Undo2 } from 'lucide-react'
import { MarkPaid } from './MarkPaid'

// admin-web /refunds (R-PAY-07): pending and paid; "Marcar como pago" issues the refund receipt.
export default function AdminRefunds() {
  const refunds = useBillingQuery(['refunds'], (repository) => repository.refunds())
  const markPaid = useBillingAction((repository, input: { id: string; reference: string }) => repository.markRefundPaid(input.id, input.reference),
    'Reembolso pago. O recibo foi emitido.')
  return (
    <div className="space-y-4">
      <PageHeader title="Reembolsos" description="Os reembolsos a transferir e os já pagos." />
      <Card>
        <CardContent className="pt-6">
          {refunds.isPending ? <TableSkeleton />
            : refunds.isError ? <QueryError error={refunds.error} onRetry={() => void refunds.refetch()} />
            : refunds.data.length === 0 ? <EmptyState icon={Undo2} title="Não há reembolsos por tratar." description="Os reembolsos criados pelas regras ou à mão aparecem aqui." />
            : (
              <ul className="space-y-3">
                {refunds.data.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                    <div>
                      <p className="font-medium">{row.payer_name} · {row.description}</p>
                      <p className="text-muted-foreground">
                        {REFUND_REASON_LABELS[row.reason_code as keyof typeof REFUND_REASON_LABELS]} · pagamento <span className="font-mono">{row.payment_reference}</span>
                        {row.note ? ` · ${row.note}` : ''}
                      </p>
                      {row.status === 'paid' && <p className="text-muted-foreground">Pago a {formatDateTime(row.paid_at ?? '')} · referência {row.paid_reference}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatAoa(row.amount_aoa ?? 0)}</span>
                      <Badge variant="outline">{REFUND_STATUS_LABELS[row.status as keyof typeof REFUND_STATUS_LABELS]}</Badge>
                      {row.status === 'pending' && (
                        <MarkPaid what="o reembolso" pending={markPaid.isPending}
                          onConfirm={(reference, close) => markPaid.mutate({ id: row.id ?? '', reference }, { onSuccess: close })} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
