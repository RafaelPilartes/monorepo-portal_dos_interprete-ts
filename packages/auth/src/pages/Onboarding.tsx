import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { normalizePhone } from '@portal-dos-interpretes/core'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'
import { COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { AuthShell, FieldError, FormAlert } from '../components/AuthShell'
import { useRequiredPortalServices } from '../services/PortalServices'
import { useRefreshSession, useSession } from '../session/SessionContext'

// Onboarding (accounts-and-organizations.md): the role is created only here, after the email is
// confirmed (R-ACC-01). Individual requester, organisation, interpreter.

type Errors = Record<string, string>

function useSubmit(onDone: () => void) {
  const services = useRequiredPortalServices()
  const refresh = useRefreshSession()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  // Once created, the new role must not send the screen to "/" before it moves on itself.
  const [done, setDone] = useState(false)
  const submit = async (path: string, body: Record<string, unknown>) => {
    setSaving(true)
    setFormError(null)
    setErrors({})
    try {
      await services.api.post(path, body)
      setDone(true)
      await refresh()
      onDone()
    } catch (error) {
      console.error(`[auth] ${path} failed`, error)
      if (error instanceof DataError && (error.field || error.details)) {
        setErrors({ ...(error.details ?? {}), ...(error.field ? { [error.field]: error.message } : {}) })
      } else {
        setFormError(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
      }
    } finally {
      setSaving(false)
    }
  }
  return { submit, saving, formError, errors, done }
}

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

/** A session is needed (the onboarding follows the confirmation of the email). */
function useSignedIn(): { ready: boolean; gate: ReactNode | null } {
  const session = useSession()
  if (session.status === 'loading') return { ready: false, gate: <p role="status" className="p-8 text-sm text-muted-foreground">{COMMON_TEXTS.loading}</p> }
  if (session.status === 'anonymous') return { ready: false, gate: <Navigate to="/login" replace /> }
  if (session.status === 'suspended') return { ready: false, gate: <Navigate to="/suspended" replace /> }
  if (session.status === 'error') return { ready: false, gate: <p role="alert" className="p-8">{COMMON_TEXTS.sessionUnavailable}</p> }
  if (session.account.pendingDocuments.length > 0) return { ready: false, gate: <Navigate to="/accept-terms" replace /> }
  return { ready: true, gate: null }
}

/** requester-web /onboarding: city, address and NIF, all optional; can be skipped. */
export function RequesterOnboarding() {
  const navigate = useNavigate()
  const signedIn = useSignedIn()
  const session = useSession()
  const { submit, saving, formError, errors, done } = useSubmit(() => navigate('/', { replace: true }))
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [nif, setNif] = useState('')
  if (!signedIn.ready) return <>{signedIn.gate}</>
  if (!done && session.status === 'authenticated' && session.account.hasRequesterProfile) return <Navigate to="/" replace />

  const send = (event?: FormEvent) => {
    event?.preventDefault()
    void submit('/onboarding/requester', { city, address, nif })
  }
  return (
    <AuthShell
      title="Pedir intérpretes como particular"
      subtitle="Estes dados ajudam a preencher os teus pedidos. Podes deixá-los para depois."
      footer={<>Representas uma empresa? <Link to="/onboarding/organization" className="font-medium text-primary hover:underline">Criar a organização</Link></>}
    >
      <form onSubmit={send} className="space-y-5">
        <Field id="city" label="Cidade" optional error={errors.city}><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" /></Field>
        <Field id="address" label="Morada" optional error={errors.address}><Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" /></Field>
        <Field id="nif" label="NIF" optional error={errors.nif}><Input id="nif" value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} /></Field>
        {formError && <FormAlert>{formError}</FormAlert>}
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'A guardar…' : 'Continuar'}</Button>
          <Button type="button" variant="outline" className="flex-1" disabled={saving} onClick={() => void submit('/onboarding/requester', {})}>Saltar por agora</Button>
        </div>
      </form>
    </AuthShell>
  )
}

/** requester-web /onboarding/organization (R-ORG-01): name and NIF required; the rest optional. */
export function OrganizationOnboarding({ title = 'Criar a organização' }: { title?: string }) {
  const navigate = useNavigate()
  const signedIn = useSignedIn()
  const { submit, saving, formError, errors } = useSubmit(() => navigate('/organization', { replace: true }))
  const [values, setValues] = useState({ name: '', nif: '', sector: '', address: '', city: '', phone: '', website_url: '' })
  if (!signedIn.ready) return <>{signedIn.gate}</>
  const set = (field: keyof typeof values) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const send = (event: FormEvent) => {
    event.preventDefault()
    const phone = values.phone.trim() ? normalizePhone(values.phone) ?? values.phone.trim() : ''
    void submit('/organizations', { ...values, nif: values.nif.trim().toUpperCase(), phone })
  }
  return (
    <AuthShell title={title} subtitle="Os pedidos da organização ficam visíveis para todos os membros. Quem cria a organização é o seu dono.">
      <form onSubmit={send} className="space-y-5">
        <Field id="name" label="Nome da organização" error={errors.name}><Input id="name" value={values.name} onChange={set('name')} autoComplete="organization" required /></Field>
        <Field id="nif" label="NIF" error={errors.nif}><Input id="nif" value={values.nif} onChange={set('nif')} required /></Field>
        <Field id="sector" label="Sector" optional error={errors.sector}><Input id="sector" value={values.sector} onChange={set('sector')} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="city" label="Cidade" optional error={errors.city}><Input id="city" value={values.city} onChange={set('city')} /></Field>
          <Field id="phone" label="Telefone" optional error={errors.phone}><Input id="phone" type="tel" value={values.phone} onChange={set('phone')} placeholder="923 000 000" /></Field>
        </div>
        <Field id="address" label="Morada" optional error={errors.address}><Input id="address" value={values.address} onChange={set('address')} /></Field>
        <Field id="website_url" label="Site" optional error={errors.website_url}><Input id="website_url" type="url" value={values.website_url} onChange={set('website_url')} placeholder="https://" /></Field>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" className="w-full" disabled={saving || values.name.trim().length < 2 || !values.nif.trim()}>
          {saving ? 'A criar…' : 'Criar a organização'}
        </Button>
      </form>
    </AuthShell>
  )
}

/** interpreter-web /onboarding: creates the role and leads to the profile (R-ACC-01, R-DIR-02). */
export function InterpreterOnboarding() {
  const navigate = useNavigate()
  const signedIn = useSignedIn()
  const session = useSession()
  const { submit, saving, formError, errors, done } = useSubmit(() => navigate('/profile', { replace: true }))
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  if (!signedIn.ready) return <>{signedIn.gate}</>
  if (!done && session.status === 'authenticated' && session.account.roles.includes('interpreter')) return <Navigate to="/" replace />
  return (
    <AuthShell
      title="Criar o teu perfil de intérprete"
      subtitle="Começa pelo essencial. Depois completas o perfil (línguas, serviços e preços) para apareceres no directório."
    >
      <form onSubmit={(event) => { event.preventDefault(); void submit('/onboarding/interpreter', { city, bio }) }} className="space-y-5">
        <Field id="city" label="Cidade onde trabalhas" optional error={errors.city}><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field id="bio" label="Apresentação curta" optional error={errors.bio}>
          <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Que línguas interpretas, em que contextos, há quanto tempo." />
        </Field>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" className="w-full" disabled={saving}>{saving ? 'A criar…' : 'Criar o perfil'}</Button>
      </form>
    </AuthShell>
  )
}
