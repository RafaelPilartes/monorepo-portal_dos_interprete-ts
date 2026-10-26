import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { destinationFor, type PanelApp } from '../services/destination'
import { safeReturnTo } from '../services/returnTo'
import { useSession } from '../session/SessionContext'

/**
 * /verify-email: where the confirmation link lands (R-ACC-01). The Auth server puts the session in
 * the URL; once it is read, the person goes to returnTo (an accepted invite) or to the onboarding
 * of the role chosen at sign-up.
 */
export default function VerifyEmail({ app = 'requester' }: { app?: PanelApp }) {
  const session = useSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // The Auth server reports a used or expired link in the URL hash.
  const [linkError] = useState(() => /error_code=|error=/.test(window.location.hash))
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setWaitedTooLong(true), 8000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (session.status === 'suspended') navigate('/suspended', { replace: true })
    if (session.status !== 'authenticated') return
    const target = safeReturnTo(searchParams.get('returnTo'), '')
    if (target && session.account.pendingDocuments.length === 0) {
      navigate(target, { replace: true })
      return
    }
    const destination = destinationFor(session.account, app)
    if (destination.kind === 'here') navigate(destination.path, { replace: true })
    else window.location.assign(appUrl(destination.app, destination.path))
  }, [session, navigate, searchParams, app])

  const failed = linkError || (waitedTooLong && session.status === 'anonymous')
  return (
    <AuthShell
      title={AUTH_TEXTS.checkInbox}
      footer={failed && <Link to="/login" className="font-medium text-primary hover:underline">Ir para a entrada</Link>}
    >
      {failed ? <FormAlert>{AUTH_TEXTS.verifyFailed}</FormAlert> : <p role="status" className="text-sm text-muted-foreground">{AUTH_TEXTS.verifyingEmail}</p>}
    </AuthShell>
  )
}
