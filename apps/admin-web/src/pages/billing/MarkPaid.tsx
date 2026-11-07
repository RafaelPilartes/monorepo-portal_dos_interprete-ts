import { useState } from 'react'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'

/** "Marcar como pago" with the transfer reference (R-PAY-07, R-PAY-10). */
export function MarkPaid({ what, pending, onConfirm }: { what: string; pending: boolean; onConfirm: (reference: string, close: () => void) => void }) {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState('')
  const id = `reference-${what.replace(/\W+/g, '-')}`
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Marcar como pago</Button>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReference('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar {what} como pago</DialogTitle>
            <DialogDescription>Indica a referência da transferência feita. Fica registada e não se altera.</DialogDescription>
          </DialogHeader>
          <form className="space-y-2" onSubmit={(event) => {
            event.preventDefault()
            if (reference.trim().length >= 3) onConfirm(reference.trim(), () => { setOpen(false); setReference('') })
          }}>
            <Label htmlFor={id}>Referência da transferência</Label>
            <Input id={id} value={reference} onChange={(e) => setReference(e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
              <Button type="submit" disabled={reference.trim().length < 3 || pending}>Marcar como pago</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
