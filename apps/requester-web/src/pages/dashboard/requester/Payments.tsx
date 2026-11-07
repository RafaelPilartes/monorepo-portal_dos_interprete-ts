import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { PaymentBlock, useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { CreditCard } from 'lucide-react'

// requester-web /payments (payments.md "Ecrãs"): every payment of the person's side, with the
// bank data, the proof and the receipts. Payments come from managed requests (H11).
export default function Payments() {
  const payments = useBillingQuery(['payments'], (repository) => repository.payments())
  return (
    <div className="space-y-6">
      <PageHeader title="Pagamentos" description="Os pagamentos feitos pelo Portal: pedidos geridos e outros serviços." />
      {payments.isPending ? <Skeleton className="h-48 w-full" />
        : payments.isError ? <QueryError error={payments.error} onRetry={() => void payments.refetch()} />
        : payments.data.length === 0 ? <EmptyState icon={CreditCard} title="Não tens pagamentos." description="Os pedidos directos e abertos combinam-se fora do Portal; aqui aparecem os pagamentos feitos pelo Portal." />
        : <div className="space-y-4">{payments.data.map((row) => <PaymentBlock key={row.id} payment={row} />)}</div>}
    </div>
  )
}
