import { useBillingAction, useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { formatAoa, formatDateTime, PAYOUT_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Wallet } from 'lucide-react'
import { MarkPaid } from './MarkPaid'

// admin-web /payouts (R-PAY-10, R-PAY-11): in the queue and paid, with the IBAN copied when the
// payout entered the queue. Without it, the payout cannot be paid (PAYOUT_DETAILS_MISSING).
export default function AdminPayouts() {
  const payouts = useBillingQuery(['payouts'], (repository) => repository.payouts())
  const markPaid = useBillingAction((repository, input: { id: string; reference: string }) => repository.markPayoutPaid(input.id, input.reference),
    'Repasse pago. O intérprete foi avisado.')
  return (
    <div className="space-y-4">
      <PageHeader title="Repasses" description="O que os intérpretes recebem dos pedidos geridos." />
      <Card>
        <CardContent className="pt-6">
          {payouts.isPending ? <TableSkeleton />
            : payouts.isError ? <QueryError error={payouts.error} onRetry={() => void payouts.refetch()} />
            : payouts.data.length === 0 ? <EmptyState icon={Wallet} title="Não há repasses por tratar." description="Cada serviço gerido concluído põe aqui o valor do intérprete." />
            : (
              <ul className="space-y-3">
                {payouts.data.map((row) => {
                  const bank = row.payout_details_snapshot as { account_holder?: string; bank_name?: string; iban?: string } | null
                  return (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                      <div>
                        <p className="font-medium">{row.interpreter_name} · {row.service_title} · {row.request_code}</p>
                        {bank ? <p className="font-mono text-muted-foreground">{bank.account_holder} · {bank.bank_name} · {bank.iban}</p>
                          : <p className="text-destructive">O intérprete ainda não indicou o IBAN para receber.</p>}
                        {row.status === 'paid' && <p className="text-muted-foreground">Pago a {formatDateTime(row.paid_at ?? '')} · referência {row.paid_reference}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold tabular-nums">{formatAoa(row.amount_aoa ?? 0)}</span>
                        <Badge variant="outline">{PAYOUT_STATUS_LABELS[row.status as keyof typeof PAYOUT_STATUS_LABELS]}</Badge>
                        {row.status === 'queued' && bank && (
                          <MarkPaid what="o repasse" pending={markPaid.isPending}
                            onConfirm={(reference, close) => markPaid.mutate({ id: row.id ?? '', reference }, { onSuccess: close })} />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
