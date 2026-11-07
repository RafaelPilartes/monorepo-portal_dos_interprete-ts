import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { usePortalServices } from '../services/PortalServices'

/** /recover-password: the answer is the same whether or not the account exists. */
export default function RecoverPassword() {
  const services = usePortalServices()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!services) return
    setIsLoading(true)
    setFormError(null)
    try {
      await services.auth.requestPasswordReset(email, new URL('/reset-password', window.location.origin).toString())
      setSent(true)
    } catch (error) {
      console.error('[auth] password reset request failed', error)
      setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={AUTH_TEXTS.recoverTitle}
      subtitle={sent ? undefined : AUTH_TEXTS.recoverSubtitle}
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Voltar à entrada</Link>}
    >
      {sent ? (
        <FormAlert tone="success">{AUTH_TEXTS.recoverSent}</FormAlert>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          {formError && <FormAlert>{formError}</FormAlert>}
          <Button type="submit" className="w-full" disabled={isLoading || !services}>
            {isLoading ? 'A enviar…' : 'Enviar o link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
