import { useState } from 'react'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { toast } from 'sonner'
import type { UseMutationResult } from '@tanstack/react-query'

// R-ACC-05: the reason is required and the person sees what happens before confirming. Nothing is
// cancelled that has already started; reactivation brings nothing back (R-ACC-06).

const CONSEQUENCES = {
  account: [
    'A pessoa deixa de conseguir usar o Portal a partir do próximo pedido que fizer.',
    'Se for intérprete, sai do directório de imediato.',
    'Os pedidos que ainda não começaram são cancelados; os serviços em curso ou passados mantêm-se.',
    'Recebe um email com o motivo.',
  ],
  organization: [
    'A organização deixa de poder criar pedidos.',
    'Os pedidos dela que ainda não começaram são cancelados; os serviços em curso ou passados mantêm-se.',
    'As contas dos membros continuam activas e veem o histórico.',
  ],
}

export function SuspendDialog({ open, onOpenChange, kind, name, suspend }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: 'account' | 'organization'
  name: string
  suspend: UseMutationResult<unknown, unknown, string>
}) {
  const [reason, setReason] = useState('')
  const fieldError = suspend.isError ? errorDetails(suspend.error).reason : undefined
  const confirm = () => {
    suspend.mutate(reason.trim(), {
      onSuccess: () => {
        toast.success(kind === 'account' ? `Suspendemos a conta de ${name}.` : `Suspendemos ${name}.`)
        setReason('')
        onOpenChange(false)
      },
      onError: (error) => {
        if (!errorDetails(error).reason) toast.error(errorMessage(error))
      },
    })
  }
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!suspend.isPending) onOpenChange(value) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{kind === 'account' ? `Suspender a conta de ${name}` : `Suspender ${name}`}</DialogTitle>
          <DialogDescription>O que acontece ao confirmar:</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {CONSEQUENCES[kind].map((line) => <li key={line}>{line}</li>)}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="suspend-reason">Motivo</Label>
          <Textarea
            id="suspend-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={!!fieldError}
            placeholder="O motivo fica na auditoria e é enviado à pessoa."
          />
          {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={suspend.isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={confirm} disabled={reason.trim().length < 3 || suspend.isPending}>
            {suspend.isPending ? 'A suspender…' : 'Suspender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
