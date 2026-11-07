import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS, COMMON_TEXTS, ORG_ROLE_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { useRequiredPortalServices } from '../services/PortalServices'
import { useRefreshSession, useSession } from '../session/SessionContext'

interface InvitePreview {
  organization_name: string
  role: 'admin' | 'member'
  email_masked: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
}

type PreviewState = { status: 'loading' } | { status: 'invalid'; message: string } | { status: 'ready'; invite: InvitePreview }

/**
 * /invite/:token (R-ORG-02): the organisation and the role; "Aceitar" with the session of the
 * invited email, or "Entrar"/"Criar conta" that come back here.
 */
export default function AcceptInvite() {
  const { token = '' } = useParams()
  const services = useRequiredPortalServices()
  const session = useSession()
  const refresh = useRefreshSession()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' })
  const [accepting, setAccepting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const here = `/invite/${encodeURIComponent(token)}`

  useEffect(() => {
    let active = true
    services.api.get<InvitePreview>(`/invites/preview?token=${encodeURIComponent(token)}`)
      .then((invite) => {
        if (!active) return
        setPreview(invite.status === 'pending' ? { status: 'ready', invite } : { status: 'invalid', message: errorFor('INVITE_INVALID').message })
      })
      .catch((error: unknown) => {
        if (active) setPreview({ status: 'invalid', message: error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message })
      })
    return () => {
      active = false
    }
  }, [services, token])

  const accept = async () => {
    setAccepting(true)
    setFormError(null)
    try {
      await services.api.post('/invites/accept', { token })
      await refresh()
      navigate('/organization', { replace: true })
    } catch (error) {
      console.error('[auth] accepting the invite failed', error)
      setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setAccepting(false)
    }
  }

  if (preview.status === 'loading' || session.status === 'loading') {
    return <AuthShell title="Convite"><p role="status" className="text-sm text-muted-foreground">{COMMON_TEXTS.loading}</p></AuthShell>
  }
  if (preview.status === 'invalid') {
    return <AuthShell title="Convite"><FormAlert>{preview.message}</FormAlert></AuthShell>
  }

  const { invite } = preview
  const title = `Convite para ${invite.organization_name}`
  const subtitle = `Recebeste um convite para fazer parte desta organização no Portal dos Intérpretes, como ${ORG_ROLE_LABELS[invite.role].toLowerCase()}. O convite foi enviado para ${invite.email_masked}.`

  if (session.status !== 'authenticated') {
    return (
      <AuthShell title={title} subtitle={subtitle}>
        {session.status === 'suspended' && <div className="mb-4"><FormAlert>{AUTH_TEXTS.suspendedTitle}</FormAlert></div>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1"><Link to={`/login?returnTo=${encodeURIComponent(here)}`}>Entrar para aceitar</Link></Button>
          <Button asChild variant="outline" className="flex-1"><Link to={`/register?returnTo=${encodeURIComponent(here)}`}>Criar conta</Link></Button>
        </div>
      </AuthShell>
    )
  }

  if (session.account.pendingDocuments.length > 0) {
    return <Navigate to={`/accept-terms?returnTo=${encodeURIComponent(here)}`} replace />
  }

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {formError && <div className="mb-4"><FormAlert>{formError}</FormAlert></div>}
      <Button className="w-full" disabled={accepting} onClick={() => void accept()}>
        {accepting ? 'A aceitar…' : 'Aceitar o convite'}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Entraste como {session.account.email}. Se o convite é para outro email, sai e entra com esse.
      </p>
    </AuthShell>
  )
}
