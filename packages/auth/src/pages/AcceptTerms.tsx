import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS, COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Checkbox } from '@portal-dos-interpretes/ui/components/checkbox'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { LegalDocumentDialog, useLegalDocumentsInForce, type LegalDocument } from '../components/legalDocuments'
import { safeReturnTo } from '../services/returnTo'
import { useRequiredPortalServices } from '../services/PortalServices'
import { useRefreshSession, useSession } from '../session/SessionContext'

const NAMES = { terms: AUTH_TEXTS.termsLink, privacy: AUTH_TEXTS.privacyLink }

/** /accept-terms (R-PRIV-02): the versions in force the account has not accepted yet. */
export default function AcceptTerms() {
  const services = useRequiredPortalServices()
  const session = useSession()
  const refresh = useRefreshSession()
  const legal = useLegalDocumentsInForce()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [reading, setReading] = useState<LegalDocument | null>(null)

  if (session.status === 'loading') return <AuthShell title={AUTH_TEXTS.acceptTermsTitle}><p role="status" className="text-sm text-muted-foreground">{COMMON_TEXTS.loading}</p></AuthShell>
  if (session.status === 'anonymous') return <Navigate to="/login" replace />
  if (session.status === 'suspended') return <Navigate to="/suspended" replace />
  if (session.status === 'error') return <AuthShell title={AUTH_TEXTS.acceptTermsTitle}><FormAlert>{COMMON_TEXTS.sessionUnavailable}</FormAlert></AuthShell>
  const pending = session.account.pendingDocuments
  const next = safeReturnTo(searchParams.get('returnTo'))
  if (pending.length === 0) return <Navigate to={next} replace />

  const documentFor = (id: string) => (legal.status === 'ready' ? legal.documents.find((document) => document.id === id) ?? null : null)

  const accept = async () => {
    setSaving(true)
    setFormError(null)
    try {
      await services.api.post('/me/accept-terms', { legal_document_ids: pending.map((document) => document.id) })
      await refresh()
      navigate(next, { replace: true })
    } catch (error) {
      console.error('[auth] accepting the terms failed', error)
      setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell title={AUTH_TEXTS.acceptTermsTitle} subtitle={AUTH_TEXTS.acceptTermsSubtitle}>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {pending.map((document) => (
          <li key={document.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm">
              <span className="font-medium">{NAMES[document.kind]}</span>
              <span className="text-muted-foreground"> · versão {document.version}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => setReading(documentFor(document.id))} disabled={!documentFor(document.id)}>Ler</Button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-start gap-2.5">
        <Checkbox id="accept" checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5" />
        <Label htmlFor="accept" className="text-sm font-normal leading-relaxed text-muted-foreground">Li e aceito estas versões.</Label>
      </div>
      {formError && <div className="mt-4"><FormAlert>{formError}</FormAlert></div>}
      <Button className="mt-6 w-full" disabled={!accepted || saving} onClick={() => void accept()}>
        {saving ? 'A guardar…' : AUTH_TEXTS.acceptTermsButton}
      </Button>
      <LegalDocumentDialog document={reading} onClose={() => setReading(null)} />
    </AuthShell>
  )
}
