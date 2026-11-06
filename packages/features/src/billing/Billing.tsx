import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatAoa, formatDateTime, PAYMENT_CONTEXT_LABELS, PAYMENT_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Copy, Download, FileUp } from 'lucide-react'
import { errorMessage } from '../lib/errorText'
import type { BillingRepository, PaymentRow, ReceiptLink } from './data'

// Payments in the panels (payments.md "Ecrãs"): the repository (built by each app), the queries and
// the payment block. Amounts, tax and dates are shown as the intent says (R-PAY-03).

const BillingContext = createContext<BillingRepository | null>(null)

export function BillingProvider({ repository, children }: { repository: BillingRepository; children: ReactNode }) {
  return <BillingContext.Provider value={repository}>{children}</BillingContext.Provider>
}

export function useBilling(): BillingRepository {
  const value = useContext(BillingContext)
  if (!value) throw new Error('useBilling needs a BillingProvider')
  return value
}

export const billingKeys = { all: ['billing'] as const }

export function useBillingQuery<T>(key: readonly unknown[], read: (repository: BillingRepository) => Promise<T>) {
  const repository = useBilling()
  return useQuery({ queryKey: [...billingKeys.all, ...key], queryFn: () => read(repository) })
}

/** A write through the API; re-reads the payments after it, says how it went. */
export function useBillingAction<Input>(action: (repository: BillingRepository, input: Input) => Promise<unknown>, success: string) {
  const repository = useBilling()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Input) => action(repository, input),
    onSuccess: () => toast.success(success),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  })
}

/** Downloads a receipt PDF the API generates (R-PAY-12). */
export function ReceiptButton({ receipt }: { receipt: ReceiptLink }) {
  const repository = useBilling()
  const [busy, setBusy] = useState(false)
  async function download() {
    setBusy(true)
    try {
      const blob = await repository.receiptPdf(receipt.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${receipt.number}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => void download()}>
      <Download className="h-4 w-4" aria-hidden="true" />{receipt.kind === 'refund' ? 'Recibo de reembolso' : 'Recibo'} {receipt.number}
    </Button>
  )
}

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-muted-foreground">{label}</p><p className="font-mono">{value}</p></div>
      <Button variant="ghost" size="sm" aria-label={`Copiar ${label.toLowerCase()}`} onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => toast.success('Copiado.'), () => toast.error('Não foi possível copiar.'))
      }}><Copy className="h-4 w-4" aria-hidden="true" />Copiar</Button>
    </div>
  )
}

export function PaymentStatus({ status }: { status: string }) {
  const tone = status === 'confirmed' ? 'bg-success/10 text-success border-success/20'
    : status === 'awaiting_proof' ? 'bg-warning/10 text-warning border-warning/20'
    : status === 'proof_submitted' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'
  return <Badge variant="outline" className={tone}>{PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ?? status}</Badge>
}

/** "Enviar comprovativo": PDF, JPG or PNG up to 10 MB, checked again by the API. */
function SendProof({ payment }: { payment: PaymentRow }) {
  const input = useRef<HTMLInputElement>(null)
  const send = useBillingAction((repository, file: File) => repository.sendProof(payment.id ?? '', file), 'Comprovativo enviado. A equipa vai validar.')
  return (
    <>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" aria-label="Ficheiro do comprovativo"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) send.mutate(file)
          event.target.value = ''
        }} />
      <Button disabled={send.isPending} onClick={() => input.current?.click()}>
        <FileUp className="h-4 w-4" aria-hidden="true" />{send.isPending ? 'A enviar…' : 'Enviar comprovativo'}
      </Button>
    </>
  )
}

/** The payment block (requester-web /payments, a managed request's detail, /verification). */
export function PaymentBlock({ payment }: { payment: PaymentRow }) {
  const bank = (payment.bank_snapshot ?? {}) as { bank_name?: string; iban?: string; beneficiary?: string }
  const receipts = (payment.receipts ?? []) as unknown as ReceiptLink[]
  const waiting = payment.status === 'awaiting_proof'
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{payment.description}</CardTitle>
          <p className="text-sm text-muted-foreground">{PAYMENT_CONTEXT_LABELS[payment.context as keyof typeof PAYMENT_CONTEXT_LABELS]}</p>
        </div>
        <PaymentStatus status={payment.status ?? ''} />
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid gap-1 sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Valor base</dt><dd className="tabular-nums">{formatAoa(payment.amount_base_aoa ?? 0)}</dd></div>
          <div><dt className="text-muted-foreground">Imposto</dt><dd className="tabular-nums">{formatAoa(payment.tax_aoa ?? 0)}</dd></div>
          <div><dt className="text-muted-foreground">Total</dt><dd className="text-base font-semibold tabular-nums">{formatAoa(payment.amount_total_aoa ?? 0)}</dd></div>
        </dl>
        {payment.status === 'proof_submitted' && <p>Recebemos o teu comprovativo. A equipa financeira está a validá-lo.</p>}
        {waiting && payment.last_proof_status === 'rejected' && (
          <Alert variant="destructive"><AlertDescription>Recusado: {payment.last_rejection_reason}. Envia outro comprovativo até {formatDateTime(payment.due_at ?? '')}.</AlertDescription></Alert>
        )}
        {payment.status === 'expired' && (
          <Alert variant="destructive"><AlertDescription>O prazo para pagar terminou. Se já fizeste a transferência, fala com o suporte e indica a referência {payment.reference}.</AlertDescription></Alert>
        )}
        {waiting && (
          <div className="space-y-3 rounded-md border p-3">
            <p>Faz a transferência com a referência no descritivo, até {formatDateTime(payment.due_at ?? '')}. Depois envia o comprovativo.</p>
            <CopyValue label="Referência" value={payment.reference ?? ''} />
            {bank.iban && <CopyValue label="IBAN" value={bank.iban} />}
            <p><span className="text-muted-foreground">Banco:</span> {bank.bank_name} · <span className="text-muted-foreground">Beneficiário:</span> {bank.beneficiary}</p>
            {payment.can_pay
              ? <SendProof payment={payment} />
              : <p className="text-muted-foreground">Só o dono ou um administrador da organização envia o comprovativo.</p>}
          </div>
        )}
        {(payment.refunded_aoa ?? 0) > 0 && <p>Reembolsado: <span className="tabular-nums">{formatAoa(payment.refunded_aoa ?? 0)}</span></p>}
        {receipts.length > 0 && <div className="flex flex-wrap gap-2">{receipts.map((receipt) => <ReceiptButton key={receipt.id} receipt={receipt} />)}</div>}
      </CardContent>
    </Card>
  )
}
