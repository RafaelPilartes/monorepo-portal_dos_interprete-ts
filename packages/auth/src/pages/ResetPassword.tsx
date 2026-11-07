import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS, COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { toast } from 'sonner'
import { AuthShell, FieldError, FormAlert } from '../components/AuthShell'
import { useRequiredPortalServices } from '../services/PortalServices'
import { useSession } from '../session/SessionContext'

/** /reset-password: the recovery link opens a session; here the person chooses the new password. */
export default function ResetPassword() {
  const services = useRequiredPortalServices()
  const session = useSession()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [weak, setWeak] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setFormError(null)
    setWeak(false)
    try {
      const result = await services.auth.updatePassword(password)
      if (!result.ok) {
        setWeak(true)
        return
      }
      toast.success(AUTH_TEXTS.resetDone)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('[auth] password update failed', error)
      setFormError(error instanceof DataError && error.code === 'UNAUTHENTICATED'
        ? AUTH_TEXTS.resetLinkInvalid
        : error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setIsLoading(false)
    }
  }

  if (session.status === 'loading') {
    return <AuthShell title={AUTH_TEXTS.resetTitle}><p role="status" className="text-sm text-muted-foreground">{COMMON_TEXTS.loading}</p></AuthShell>
  }
  if (session.status !== 'authenticated') {
    return (
      <AuthShell title={AUTH_TEXTS.resetTitle} footer={<Link to="/recover-password" className="font-medium text-primary hover:underline">Pedir um link novo</Link>}>
        <FormAlert>{AUTH_TEXTS.resetLinkInvalid}</FormAlert>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={AUTH_TEXTS.resetTitle} subtitle={AUTH_TEXTS.resetSubtitle}>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova palavra-passe</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-rules password-error" required minLength={8} />
          <p id="password-rules" className="text-xs text-muted-foreground">{AUTH_TEXTS.passwordRules}</p>
          <FieldError id="password-error" message={weak ? errorFor('WEAK_PASSWORD').message : undefined} />
        </div>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" className="w-full" disabled={isLoading || password.length < 8}>
          {isLoading ? 'A guardar…' : 'Guardar a palavra-passe'}
        </Button>
      </form>
    </AuthShell>
  )
}
