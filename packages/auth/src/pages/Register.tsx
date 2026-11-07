import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Checkbox } from '@portal-dos-interpretes/ui/components/checkbox'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'
import { Building2, Eye, EyeOff, HandHeart, UserRound } from 'lucide-react'
import { AuthShell, FieldError, FormAlert } from '../components/AuthShell'
import { LegalDocumentDialog, useLegalDocumentsInForce, type LegalDocument } from '../components/legalDocuments'
import { safeReturnTo } from '../services/returnTo'
import { useRequiredPortalServices } from '../services/PortalServices'

type IntendedRole = 'requester' | 'interpreter' | 'organization'

export interface RegisterProps {
  /** Account type selected when the page opens: each app pre-selects its own public (AD-017). */
  defaultAccountType?: 'requester' | 'interpreter'
}

const ROLE_ICONS = { requester: UserRound, interpreter: HandHeart, organization: Building2 }

/** /register (accounts-and-organizations.md; R-ACC-01, R-PRIV-01). */
export default function Register({ defaultAccountType = 'requester' }: RegisterProps = {}) {
  const services = useRequiredPortalServices()
  const legal = useLegalDocumentsInForce()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const [intendedRole, setIntendedRole] = useState<IntendedRole>(defaultAccountType)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [reading, setReading] = useState<LegalDocument | null>(null)

  const documents = legal.status === 'ready' ? legal.documents : []
  const byKind = (kind: LegalDocument['kind']) => documents.find((document) => document.kind === kind) ?? null
  const valid = fullName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 8 && accepted && legal.status === 'ready'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    try {
      const safe = returnTo ? safeReturnTo(returnTo) : null
      await services.api.post('/auth/register', {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        intended_role: intendedRole,
        accept_terms: accepted,
        legal_document_ids: documents.map((document) => document.id),
        ...(safe && safe !== '/' ? { return_to: safe } : {}),
      })
      setSentTo(email.trim())
    } catch (error) {
      console.error('[auth] registration failed', error)
      if (error instanceof DataError && (error.field || error.details)) {
        setFieldErrors({ ...(error.details ?? {}), ...(error.field ? { [error.field]: error.message } : {}) })
      } else {
        setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell title={AUTH_TEXTS.checkInbox} subtitle={AUTH_TEXTS.registered(sentTo)}>
        <Button variant="outline" asChild className="w-full">
          <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'}>Ir para a entrada</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={AUTH_TEXTS.registerTitle}
      subtitle={AUTH_TEXTS.registerSubtitle}
      footer={<>Já tens conta? <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} className="font-medium text-primary hover:underline">Entrar</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{AUTH_TEXTS.intendedRoleLabel}</legend>
          <div className="grid gap-2" role="radiogroup">
            {(['requester', 'interpreter', 'organization'] as const).map((role) => {
              const Icon = ROLE_ICONS[role]
              const selected = intendedRole === role
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setIntendedRole(role)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <span>
                    <span className="block text-sm font-medium">{AUTH_TEXTS.intendedRoles[role].title}</span>
                    <span className="block text-xs text-muted-foreground">{AUTH_TEXTS.intendedRoles[role].hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-describedby="full_name-error" />
          <FieldError id="full_name-error" message={fieldErrors.full_name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fieldErrors.email} aria-describedby="email-error" />
          <FieldError id="email-error" message={fieldErrors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Palavra-passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-rules password-error"
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
          <p id="password-rules" className="text-xs text-muted-foreground">{AUTH_TEXTS.passwordRules}</p>
          <FieldError id="password-error" message={fieldErrors.password} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            <Checkbox id="accept_terms" checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5" aria-describedby="accept_terms-error" />
            <Label htmlFor="accept_terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
              {AUTH_TEXTS.acceptTermsPrefix}{' '}
              <button type="button" className="font-medium text-primary hover:underline disabled:opacity-50" disabled={!byKind('terms')} onClick={() => setReading(byKind('terms'))}>{AUTH_TEXTS.termsLink}</button>{' '}
              {AUTH_TEXTS.acceptTermsJoin}{' '}
              <button type="button" className="font-medium text-primary hover:underline disabled:opacity-50" disabled={!byKind('privacy')} onClick={() => setReading(byKind('privacy'))}>{AUTH_TEXTS.privacyLink}</button>
            </Label>
          </div>
          <FieldError id="accept_terms-error" message={fieldErrors.accept_terms ?? fieldErrors.legal_document_ids} />
        </div>

        {legal.status === 'error' && <FormAlert>{AUTH_TEXTS.legalUnavailable}</FormAlert>}
        {formError && <FormAlert>{formError}</FormAlert>}

        <Button type="submit" className="w-full" disabled={!valid || submitting}>
          {submitting ? 'A criar a conta…' : 'Criar conta'}
        </Button>
      </form>
      <LegalDocumentDialog document={reading} onClose={() => setReading(null)} />
    </AuthShell>
  )
}
