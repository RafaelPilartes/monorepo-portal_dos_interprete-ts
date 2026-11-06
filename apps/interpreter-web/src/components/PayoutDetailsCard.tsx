import { useEffect, useState } from 'react'
import { useBillingAction, useBillingQuery } from '@portal-dos-interpretes/features/billing/Billing'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorDetails } from '@portal-dos-interpretes/features/lib/errorText'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Landmark } from 'lucide-react'

// interpreter-web /settings, "Dados para receber" (R-PAY-11): holder, bank and Angolan IBAN.
// The IBAN is checked by the database (util.iban_ao); its message shows on the field.
export function PayoutDetailsCard() {
  const current = useBillingQuery(['payout-details'], (repository) => repository.payoutDetails())
  const [form, setForm] = useState({ account_holder: '', bank_name: '', iban: '' })
  const save = useBillingAction((repository, input: typeof form) => repository.savePayoutDetails(input), 'Dados para receber guardados.')
  useEffect(() => {
    if (current.data) setForm({ account_holder: current.data.account_holder ?? '', bank_name: current.data.bank_name ?? '', iban: current.data.iban ?? '' })
  }, [current.data])
  const fields = errorDetails(save.error)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" aria-hidden="true" />Dados para receber</CardTitle>
        <CardDescription>Para onde a equipa transfere os repasses dos pedidos geridos.</CardDescription>
      </CardHeader>
      <CardContent>
        {current.isPending ? <Skeleton className="h-40 w-full" />
          : current.isError ? <QueryError error={current.error} onRetry={() => void current.refetch()} />
          : (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate(form) }}>
              <div className="space-y-1.5">
                <Label htmlFor="payout-holder">Titular da conta</Label>
                <Input id="payout-holder" value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} />
                {fields.account_holder && <p className="text-sm text-destructive">{fields.account_holder}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payout-bank">Banco</Label>
                <Input id="payout-bank" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                {fields.bank_name && <p className="text-sm text-destructive">{fields.bank_name}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="payout-iban">IBAN</Label>
                <Input id="payout-iban" placeholder="AO06…" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
                {fields.iban && <p className="text-sm text-destructive">{fields.iban}</p>}
              </div>
              <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Guardar dados para receber</Button></div>
            </form>
          )}
      </CardContent>
    </Card>
  )
}
