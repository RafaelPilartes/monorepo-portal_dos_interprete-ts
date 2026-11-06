import { useState, type ReactNode } from 'react'
import { formatDateTime } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { AlertTriangle } from 'lucide-react'
import type { AssignmentRow, DisputeRow } from './data'
import { useRequestAction } from './RequestsContext'

// The lifecycle actions of the detail screens (service-lifecycle.md "Ecrãs"): each asks for its
// reason in a dialog, warns before a late cancellation (D-22, the rule read from the base), and
// says the deadline of the automatic confirmation (R-LIFE-04).

export const LATE_WARNING = 'Faltam menos de 24 horas: este cancelamento fica registado no teu perfil.'

interface ReasonActionProps {
  label: string
  title: string
  description: string
  confirmLabel: string
  warning?: string | null | undefined
  variant?: 'outline' | 'destructive' | 'default'
  pending: boolean
  onConfirm: (reason: string, close: () => void) => void
}

/** A button that asks for a reason (at least 3 characters, as the base requires) before acting. */
export function ReasonAction({ label, title, description, confirmLabel, warning, variant = 'outline', pending, onConfirm }: ReasonActionProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const ok = reason.trim().length >= 3
  const id = `reason-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {warning && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{warning}</AlertDescription></Alert>
          )}
          <form className="space-y-2" onSubmit={(event) => {
            event.preventDefault()
            if (ok) onConfirm(reason.trim(), () => { setOpen(false); setReason('') })
          }}>
            <Label htmlFor={id}>Motivo</Label>
            <Textarea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
              <Button type="submit" variant={variant === 'outline' ? 'default' : variant} disabled={!ok || pending}>{confirmLabel}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** "Abrir disputa" on an assignment, for either party (R-LIFE-05). */
export function OpenDispute({ assignmentId, other }: { assignmentId: string; other: string }) {
  const open = useRequestAction((repository, reason: string) => repository.openDispute(assignmentId, reason), 'Disputa aberta. A equipa vai analisar.')
  return (
    <ReasonAction label="Abrir disputa" title="Abrir disputa" confirmLabel="Abrir disputa" pending={open.isPending}
      description={`A equipa e ${other} são avisados. A confirmação automática pára até a disputa ser resolvida.`}
      onConfirm={(reason, close) => open.mutate(reason, { onSuccess: close })} />
  )
}

/** The requester's side on a delivered assignment: confirm, or dispute, until the deadline (R-LIFE-04). */
export function DeliveredActions({ row }: { row: AssignmentRow }) {
  const confirm = useRequestAction((repository, id: string) => repository.confirm(id), 'Serviço confirmado.')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate(row.id ?? '')}>Confirmar que o serviço foi feito</Button>
      <OpenDispute assignmentId={row.id ?? ''} other="o intérprete" />
      {row.confirm_by && <p className="w-full text-xs text-muted-foreground">Sem resposta, fica confirmado a {formatDateTime(row.confirm_by)}.</p>}
    </div>
  )
}

/** The disputes of a request, as their parties and the team read them. */
export function DisputeList({ rows, action }: { rows: DisputeRow[]; action?: (row: DisputeRow) => ReactNode }) {
  if (rows.length === 0) return null
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="rounded-md border p-3 text-sm">
          <p className="font-medium">
            {row.status === 'open' ? 'Disputa aberta' : row.resolution === 'completed' ? 'Disputa resolvida: o serviço conta como feito' : 'Disputa resolvida: o serviço não conta'}
          </p>
          <p className="text-muted-foreground">
            Aberta por {row.opened_by_name ?? (row.opened_by_role === 'interpreter' ? 'o intérprete' : 'o solicitante')} a {formatDateTime(row.created_at ?? '')}: «{row.reason}»
          </p>
          {row.notes && <p className="text-muted-foreground">Notas da equipa: {row.notes}</p>}
          {action?.(row)}
        </li>
      ))}
    </ul>
  )
}
