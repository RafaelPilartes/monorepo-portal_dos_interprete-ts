import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { destinationFor, type PanelApp } from '../services/destination'
import { usePortalServices } from '../services/PortalServices'
import { useOptionalSession } from '../session/SessionContext'
import { safeReturnTo } from '../services/returnTo'

export interface LoginProps {
  /** Where "Criar conta" leads; the link is hidden when null (admin-web has no registration). */
  registerHref?: string | null
  /** The app this page belongs to; decides where the person goes after entering (R-ACC-04). */
  app?: PanelApp
}

/** /login (accounts-and-organizations.md): email and password, returnTo, the three refusals. */
export default function Login({ registerHref = '/register', app = 'requester' }: LoginProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const services = usePortalServices()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const session = useOptionalSession()
  const returnTo = searchParams.get('returnTo')

  // Signed in (or the session just arrived): where the person was going, else the app of the
  // role (R-ACC-04). A suspended account is told so on its own page (R-ACC-03).
  useEffect(() => {
    if (session?.status === 'suspended') navigate('/suspended', { replace: true })
    if (session?.status !== 'authenticated') return
    const target = safeReturnTo(returnTo, '')
    if (target) {
      // The documents to accept come first, then back to where the person was going (R-PRIV-02).
      navigate(session.account.pendingDocuments.length > 0 ? `/accept-terms?returnTo=${encodeURIComponent(target)}` : target, { replace: true })
      return
    }
    const destination = destinationFor(session.account, app)
    if (destination.kind === 'here') navigate(destination.path, { replace: true })
    else window.location.assign(appUrl(destination.app, destination.path))
  }, [session, navigate, returnTo, app])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setUnconfirmed(false)
    if (!services) return
    setIsLoading(true)
    try {
      const result = await services.auth.signIn(email, password)
      if (!result.ok) {
        setUnconfirmed(result.reason === 'email_not_confirmed')
        setFormError(result.reason === 'invalid_credentials' ? AUTH_TEXTS.invalidCredentials : AUTH_TEXTS.emailNotConfirmed)
      }
      // On success the session provider sees the new session and the effect above moves on.
    } catch (error) {
      console.error('[auth] sign-in failed', error)
      setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setIsLoading(false)
    }
  }

  const resend = async () => {
    if (!services) return
    try {
      const target = new URL('/verify-email', window.location.origin)
      if (returnTo) target.searchParams.set('returnTo', safeReturnTo(returnTo))
      await services.auth.resendConfirmation(email, target.toString())
      toast.success(AUTH_TEXTS.confirmationResent)
    } catch (error) {
      toast.error(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    }
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Usa o email e a palavra-passe da tua conta."
      footer={registerHref && (
        <>Ainda não tens conta?{' '}
          <Link to={returnTo ? `${registerHref}?returnTo=${encodeURIComponent(returnTo)}` : registerHref} className="font-medium text-primary hover:underline">Criar conta</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Palavra-passe</Label>
            <Link to="/recover-password" className="text-sm text-primary hover:underline">Esqueci-me da palavra-passe</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {formError && (
          <FormAlert>
            {formError}
            {unconfirmed && (
              <button type="button" onClick={() => void resend()} className="ml-1 font-medium underline underline-offset-2">
                {AUTH_TEXTS.resendConfirmation}
              </button>
            )}
          </FormAlert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !services}>
          {isLoading ? AUTH_TEXTS.signingIn : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
