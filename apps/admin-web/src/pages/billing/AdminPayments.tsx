import { useState } from 'react'
import { toast } from 'sonner'
import { PaymentStatus, useBilling, useBillingAction, useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import type { ProofRow } from '@portal-dos-interpretes/features/billing/data'
import { ReasonAction } from '@portal-dos-interpretes/features/requests/Lifecycle'
import { formatAoa, formatDateTime, PAYMENT_CONTEXT_LABELS, PROOF_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { CreditCard, ExternalLink } from 'lucide-react'

// admin-web /payments (payments.md "Ecrãs"): the proofs to validate, oldest first, with the file,
// the amount expected, the reference and who paid; "Aceitar"/"Recusar" (R-PAY-05). "Histórico"
// shows every proof with who decided and when.

function OpenFile({ path }: { path: string }) {
  const repository = useBilling()
  const [busy, setBusy] = useState(false)
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => {
      setBusy(true)
      repository.fileUrl(path).then((url) => window.open(url, '_blank', 'noopener'), (error) => toast.error(errorMessage(error))).finally(() => setBusy(false))
    }}><ExternalLink className="h-4 w-4" aria-hidden="true" />Ver comprovativo</Button>
  )
}

function ProofCard({ row }: { row: ProofRow }) {
  const accept = useBillingAction((repository, id: string) => repository.acceptProof(id), 'Pagamento confirmado. O recibo foi emitido.')
  const reject = useBillingAction((repository, input: { id: string; reason: string }) => repository.rejectProof(input.id, input.reason), 'Comprovativo recusado. O pagador foi avisado.')
  const pending = row.review_status === 'pending'
  return (
    <li className="space-y-3 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{row.payer_name} · {row.description}</p>
          <p className="text-muted-foreground">{PAYMENT_CONTEXT_LABELS[row.context as keyof typeof PAYMENT_CONTEXT_LABELS]} · Referência <span className="font-mono">{row.reference}</span></p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold tabular-nums">{formatAoa(row.amount_total_aoa ?? 0)}</p>
          <p className="text-xs text-muted-foreground">base {formatAoa(row.amount_base_aoa ?? 0)} · imposto {formatAoa(row.tax_aoa ?? 0)}</p>
        </div>
      </div>
      <p className="text-muted-foreground">
        Enviado por {row.uploaded_by_name} a {formatDateTime(row.uploaded_at ?? '')}
        {row.subject_cancelled_at ? ' · O assunto foi cancelado: ao aceitar, o reembolso é criado logo.' : ''}
      </p>
      {!pending && (
        <p>{PROOF_STATUS_LABELS[row.review_status as keyof typeof PROOF_STATUS_LABELS]} por {row.reviewed_by_name} a {formatDateTime(row.reviewed_at ?? '')}
          {row.rejection_reason ? `: ${row.rejection_reason}` : ''}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <OpenFile path={row.file_path ?? ''} />
        {pending && <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate(row.id ?? '')}>Aceitar</Button>}
        {pending && (
          <ReasonAction label="Recusar" title="Recusar o comprovativo" confirmLabel="Recusar" variant="destructive" pending={reject.isPending}
            description="O pagador lê o motivo e pode enviar outro comprovativo dentro do prazo."
            onConfirm={(reason, close) => reject.mutate({ id: row.id ?? '', reason }, { onSuccess: close })} />
        )}
        <span className="text-muted-foreground">Pagamento:</span> <PaymentStatus status={row.intent_status ?? ''} />
      </div>
    </li>
  )
}

export default function AdminPayments() {
  const [all, setAll] = useState(false)
  const proofs = useBillingQuery(['proofs', all], (repository) => repository.proofs(all))
  return (
    <div className="space-y-4">
      <PageHeader title="Pagamentos" description="Comprovativos por validar, dos mais antigos para os mais recentes." />
      <div className="flex gap-2" role="group" aria-label="Que comprovativos">
        <Button size="sm" variant={all ? 'outline' : 'default'} aria-pressed={!all} onClick={() => setAll(false)}>Por validar</Button>
        <Button size="sm" variant={all ? 'default' : 'outline'} aria-pressed={all} onClick={() => setAll(true)}>Histórico</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {proofs.isPending ? <TableSkeleton />
            : proofs.isError ? <QueryError error={proofs.error} onRetry={() => void proofs.refetch()} />
            : proofs.data.length === 0 ? <EmptyState icon={CreditCard} title="Não há comprovativos por tratar." description="Os comprovativos enviados pelos pagadores aparecem aqui." />
            : <ul className="space-y-3">{proofs.data.map((row) => <ProofCard key={row.id} row={row} />)}</ul>}
        </CardContent>
      </Card>
    </div>
  )
}
