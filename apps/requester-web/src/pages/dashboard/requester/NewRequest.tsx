import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useRequestContext, useSession } from '@portal-dos-interpretes/auth'
import { DataError } from '@portal-dos-interpretes/data'
import { useDirectory, useDirectoryCatalog, useListing } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { PRICING_SUFFIX } from '@portal-dos-interpretes/features/directory/labels'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import type { NewRequest as NewRequestInput, RequestPreview } from '@portal-dos-interpretes/features/requests/data'
import { durationText } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatAoa, formatDateTime, fromLuandaLocal, luandaDay, MODALITY_TEXT } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Checkbox } from '@portal-dos-interpretes/ui/components/checkbox'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { AlertCircle, ArrowLeft, ArrowRight, Check, MapPin, Video } from 'lucide-react'

// /requests/new (requests-core.md, "assistente"): seven steps, wired to the database. Only the
// direct request exists in H5; the open and managed requests arrive with H7 and H11 (AD-034).
// Each step checks its fields with the catalog's messages; the total of the review comes from
// booking.preview_request_total, and success is shown only after the 201.

const STEPS = ['Tipo', 'Serviço e intérprete', 'Modalidade', 'Data e duração', 'Local', 'Orçamento', 'Revisão'] as const
type Step = number

// Which step owns each field the API may refuse, to go back to it.
const FIELD_STEP: Readonly<Record<string, Step>> = {
  kind: 0, service_id: 1, language_ids: 1, interpreter_id: 1, interpreter_ids: 1, modality: 2,
  starts_at: 3, duration_minutes: 3, interpreters_needed: 3, meeting_link: 4, address: 4, city: 4,
}

interface Form {
  serviceId: string
  languageIds: string[]
  interpreterIds: string[]
  modality: 'online' | 'in_person' | ''
  day: string
  time: string
  durationMinutes: string
  needed: string
  meetingLink: string
  address: string
  city: string
  notes: string
  beneficiaryName: string
  beneficiaryContact: string
}

const EMPTY: Form = {
  serviceId: '', languageIds: [], interpreterIds: [], modality: '', day: '', time: '', durationMinutes: '60', needed: '1',
  meetingLink: '', address: '', city: '', notes: '', beneficiaryName: '', beneficiaryContact: '',
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/** The configuration in force, for the hints the wizard shows (the rules stay in the database). */
function useConfigInForce() {
  const { repository } = useDirectory()
  return useQuery({ queryKey: ['config', 'in-force'], queryFn: () => repository.configInForce(), staleTime: 5 * 60_000 })
}

export default function NewRequest() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSession()
  const account = session.status === 'authenticated' ? session.account : null
  const [organizationId] = useRequestContext(account)
  const { repository: requests } = useRequests()
  const { repository: directory } = useDirectory()
  const catalog = useDirectoryCatalog()
  const config = useConfigInForce()
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<RequestPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }))

  // "Pedir este intérprete": the profile's slug comes in ?interpreter=.
  const preselected = params.get('interpreter')
  const fromProfile = useListing({ search: undefined, limit: 50, offset: 0 })
  useEffect(() => {
    if (!preselected || form.interpreterIds.length > 0) return
    const row = fromProfile.data?.rows.find((item) => item.slug === preselected)
    if (row?.account_id) set('interpreterIds', [row.account_id])
  }, [preselected, fromProfile.data, form.interpreterIds.length])

  const service = catalog.data?.services.find((row) => row.id === form.serviceId)
  const needed = Math.max(1, Number(form.needed) || 1)
  const firstLanguage = form.languageIds[0]
  const candidates = useListing({ languageId: firstLanguage, limit: 50, offset: 0 })
  const suggestTwo = config.data?.two_interpreters_suggest_minutes ?? null

  const startsAt = form.day && form.time ? fromLuandaLocal(form.day, form.time) : null
  const urgent = useMemo(() => {
    const hours = config.data?.urgent_threshold_hours
    return startsAt && hours !== null && hours !== undefined ? new Date(startsAt).getTime() < Date.now() + hours * 3_600_000 : false
  }, [startsAt, config.data])

  /** The checks a step makes before moving on, with the catalog's messages; the database checks again. */
  const check = (current: Step): Record<string, string> => {
    const found: Record<string, string> = {}
    if (current === 1) {
      if (!form.serviceId) found.service_id = 'Escolhe o serviço.'
      if (form.languageIds.length === 0) found.language_ids = 'Escolhe pelo menos uma língua.'
      if (form.interpreterIds.length === 0) found.interpreter_ids = 'Escolhe pelo menos um intérprete.'
      if (form.interpreterIds.length > needed) found.interpreter_ids = `Escolhe no máximo ${needed} ${needed === 1 ? 'intérprete' : 'intérpretes'}.`
    }
    if (current === 2 && !form.modality) found.modality = 'Escolhe presencial ou online.'
    if (current === 3) {
      if (!form.day || !form.time) found.starts_at = 'Indica o dia e a hora.'
      const minutes = Number(form.durationMinutes)
      if (!Number.isInteger(minutes) || minutes < 15 || minutes > 720) found.duration_minutes = 'A duração tem de estar entre 15 minutos e 12 horas.'
    }
    if (current === 4) {
      if (form.modality === 'online' && !form.meetingLink.trim()) found.meeting_link = 'Indica o link da reunião.'
      if (form.modality === 'online' && form.meetingLink.trim() && !form.meetingLink.trim().startsWith('https://')) found.meeting_link = 'O link tem de começar por https://.'
      if (form.modality === 'in_person' && !form.address.trim()) found.address = 'Indica a morada do serviço.'
    }
    return found
  }

  const next = () => {
    const found = check(step)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    // Step 6 (budget) is only for the open "first to accept" request (H7).
    setStep((current) => (current === 4 ? 6 : Math.min(current + 1, STEPS.length - 1)))
  }
  const back = () => setStep((current) => (current === 6 ? 4 : Math.max(current - 1, 0)))

  // The review asks the server for the total (R-REQ-02).
  useEffect(() => {
    if (step !== 6 || !form.serviceId || !form.modality) return
    let alive = true
    setPreview(null)
    setPreviewError(null)
    requests.preview({ service_id: form.serviceId, duration_minutes: Number(form.durationMinutes), modality: form.modality, interpreter_ids: form.interpreterIds })
      .then((result) => { if (alive) setPreview(result) })
      .catch((error: unknown) => { if (alive) setPreviewError(errorMessage(error)) })
    return () => { alive = false }
  }, [step, form.serviceId, form.durationMinutes, form.modality, form.interpreterIds, requests])

  const submit = async () => {
    if (!preview || !startsAt || !form.modality) return
    const input: NewRequestInput = {
      kind: 'direct',
      organization_id: organizationId ?? undefined,
      service_id: form.serviceId,
      language_ids: form.languageIds,
      modality: form.modality,
      starts_at: startsAt,
      duration_minutes: Number(form.durationMinutes),
      interpreters_needed: needed,
      meeting_link: form.modality === 'online' ? form.meetingLink.trim() : undefined,
      address: form.modality === 'in_person' ? form.address.trim() : undefined,
      city: form.city.trim() || undefined,
      notes: form.notes.trim() || undefined,
      beneficiary_name: form.beneficiaryName.trim() || undefined,
      beneficiary_contact: form.beneficiaryContact.trim() || undefined,
      interpreter_ids: form.interpreterIds,
      expected_total_aoa: preview.total_aoa,
    }
    setSending(true)
    try {
      const created = await requests.create(input)
      navigate(`/requests/${created.id}`, { state: { created: created.code } })
    } catch (error) {
      if (error instanceof DataError && error.code === 'PRICE_CHANGED') {
        // The total changed between the review and the send: show the new one (requests-core.md).
        setPreview(await requests.preview({ service_id: input.service_id, duration_minutes: input.duration_minutes, modality: input.modality, interpreter_ids: input.interpreter_ids }).catch(() => null))
        setPreviewError(errorMessage(error))
        return
      }
      const fields = errorDetails(error)
      const field = error instanceof DataError && error.field ? error.field : Object.keys(fields)[0]
      setErrors(field ? { [field]: fields[field] ?? errorMessage(error) } : {})
      if (field && FIELD_STEP[field] !== undefined) setStep(FIELD_STEP[field])
      else setPreviewError(errorMessage(error))
    } finally {
      setSending(false)
    }
  }

  if (catalog.isPending) return <Skeleton className="h-96 w-full" />

  return (
    <>
      <PageHeader title="Nova Solicitação" description="Pede um intérprete em poucos passos." />
      <ol className="mb-6 flex flex-wrap gap-2 text-xs" aria-label="Passos">
        {STEPS.map((name, index) => index === 5 ? null : (
          <li key={name} aria-current={index === step ? 'step' : undefined}
            className={`rounded-full border px-3 py-1 ${index === step ? 'border-primary bg-primary/10 font-medium text-primary' : index < step ? 'text-foreground' : 'text-muted-foreground'}`}>
            {index < step && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}{name}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {step === 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              <button type="button" aria-pressed="true" className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-left">
                <p className="font-medium">Escolher um intérprete</p>
                <p className="text-sm text-muted-foreground">Escolhes quem queres e convidas directamente.</p>
              </button>
              {[{ title: 'Publicar para intérpretes', text: 'Os intérpretes disponíveis candidatam-se.' }, { title: 'Pedir à plataforma', text: 'A equipa escolhe e faz o orçamento.' }].map((option) => (
                <div key={option.title} aria-disabled="true" className="rounded-lg border p-4 opacity-60">
                  <p className="font-medium">{option.title} <Badge variant="outline" className="ml-1">Disponível em breve</Badge></p>
                  <p className="text-sm text-muted-foreground">{option.text}</p>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Field id="service" label="Serviço" error={errors.service_id}>
                <Select value={form.serviceId} onValueChange={(value) => set('serviceId', value)}>
                  <SelectTrigger id="service"><SelectValue placeholder="Escolhe o serviço" /></SelectTrigger>
                  <SelectContent>{catalog.data?.services.filter((row) => row.active).map((row) => <SelectItem key={row.id} value={row.id}>{row.title}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Línguas</legend>
                <div className="flex flex-wrap gap-2">
                  {catalog.data?.languages.filter((row) => row.active).map((row) => {
                    const on = form.languageIds.includes(row.id)
                    return (
                      <Button key={row.id} type="button" size="sm" variant={on ? 'default' : 'outline'} aria-pressed={on}
                        onClick={() => set('languageIds', on ? form.languageIds.filter((id) => id !== row.id) : [...form.languageIds, row.id])}>
                        {row.name}
                      </Button>
                    )
                  })}
                </div>
                {errors.language_ids && <p className="text-sm text-destructive">{errors.language_ids}</p>}
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Intérprete</legend>
                {!firstLanguage ? <p className="text-sm text-muted-foreground">Escolhe primeiro uma língua.</p>
                  : candidates.isPending ? <Skeleton className="h-24 w-full" />
                  : (candidates.data?.rows.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">Ainda não há intérpretes no directório para esta língua.</p>
                  : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {candidates.data?.rows.map((row) => {
                        const id = row.account_id ?? ''
                        const on = form.interpreterIds.includes(id)
                        const photo = directory.publicUrl('avatars', row.avatar_path)
                        return (
                          <li key={id}>
                            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${on ? 'border-primary bg-primary/5' : ''}`}>
                              <Checkbox checked={on} onCheckedChange={(value) => set('interpreterIds', value === true ? [...form.interpreterIds, id] : form.interpreterIds.filter((item) => item !== id))} />
                              {photo ? <img src={photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">{(row.full_name ?? '').charAt(0)}</span>}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{row.full_name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{(row.language_names ?? []).join(', ')}{row.city ? ` · ${row.city}` : ''}</span>
                              </span>
                              <Link to={`/interpreters/${row.slug}`} target="_blank" className="text-xs text-primary hover:underline">Perfil</Link>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                {errors.interpreter_ids && <p className="text-sm text-destructive">{errors.interpreter_ids}</p>}
                {errors.interpreter_id && <p className="text-sm text-destructive">{errors.interpreter_id}</p>}
                <p className="text-xs text-muted-foreground">O preço de cada intérprete aparece na revisão. Só recebem o convite os que oferecem este serviço nas línguas escolhidas.</p>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Modalidade</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([['in_person', MapPin, 'No local do serviço.'], ['online', Video, 'Por videochamada (Zoom, Meet, Teams…).']] as const).map(([value, Icon, text]) => (
                  <button key={value} type="button" aria-pressed={form.modality === value} onClick={() => set('modality', value)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left ${form.modality === value ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span><span className="block font-medium">{MODALITY_TEXT[value]}</span><span className="text-sm text-muted-foreground">{text}</span></span>
                  </button>
                ))}
              </div>
              {errors.modality && <p className="text-sm text-destructive">{errors.modality}</p>}
            </fieldset>
          )}

          {step === 3 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="day" label="Dia" error={errors.starts_at}>
                <Input id="day" type="date" min={luandaDay(new Date())} value={form.day} onChange={(e) => set('day', e.target.value)} />
              </Field>
              <Field id="time" label="Hora (hora de Luanda)" hint={config.data?.request_min_lead_minutes ? `Pelo menos ${config.data.request_min_lead_minutes} minutos a partir de agora.` : undefined}>
                <Input id="time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
              </Field>
              <Field id="duration" label="Duração (minutos)" error={errors.duration_minutes} hint={Number(form.durationMinutes) >= 15 ? durationText(Number(form.durationMinutes)) : undefined}>
                <Input id="duration" type="number" min={15} max={720} step={15} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
              </Field>
              <Field id="needed" label="Quantos intérpretes" error={errors.interpreters_needed}
                hint={suggestTwo !== null && Number(form.durationMinutes) > suggestTwo ? 'Serviços longos costumam precisar de dois intérpretes a revezar.' : undefined}>
                <Input id="needed" type="number" min={1} max={config.data?.max_interpreters_per_request ?? undefined} value={form.needed} onChange={(e) => set('needed', e.target.value)} />
              </Field>
              {urgent && (
                <Alert className="sm:col-span-2"><AlertCircle className="h-4 w-4" /><AlertDescription>Pedido urgente: os convites expiram à hora de início.</AlertDescription></Alert>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {form.modality === 'online' ? (
                <Field id="meeting_link" label="Link da reunião" error={errors.meeting_link} hint="Começa por https://">
                  <Input id="meeting_link" type="url" value={form.meetingLink} onChange={(e) => set('meetingLink', e.target.value)} />
                </Field>
              ) : (
                <Field id="address" label="Morada" error={errors.address} hint="Só os intérpretes aceites a veem.">
                  <Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </Field>
              )}
              <Field id="city" label="Cidade" error={errors.city}><Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field id="beneficiary_name" label="Para quem é o serviço (opcional)" hint="Só os intérpretes aceites o veem."><Input id="beneficiary_name" value={form.beneficiaryName} onChange={(e) => set('beneficiaryName', e.target.value)} /></Field>
              <Field id="beneficiary_contact" label="Contacto dessa pessoa (opcional)"><Input id="beneficiary_contact" value={form.beneficiaryContact} onChange={(e) => set('beneficiaryContact', e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field id="notes" label="Notas para o intérprete (opcional)"><Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field></div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <CardHeader className="p-0">
                <CardTitle>Revisão</CardTitle>
                <CardDescription>Confirma o pedido antes de enviar.</CardDescription>
              </CardHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Serviço</dt><dd className="font-medium">{service?.title} ({PRICING_SUFFIX[service?.pricing_mode ?? 'hourly']})</dd></div>
                <div><dt className="text-muted-foreground">Quando</dt><dd className="font-medium">{startsAt ? `${formatDateTime(startsAt)} (hora de Luanda)` : ''} · {durationText(Number(form.durationMinutes))}</dd></div>
                <div><dt className="text-muted-foreground">Modalidade</dt><dd className="font-medium">{form.modality ? MODALITY_TEXT[form.modality] : ''}{form.modality === 'in_person' ? ` · ${form.address}` : ''}</dd></div>
                <div><dt className="text-muted-foreground">Intérpretes</dt><dd className="font-medium">{needed}</dd></div>
              </dl>
              {previewError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{previewError}</AlertDescription></Alert>}
              {!preview ? (!previewError && <Skeleton className="h-24 w-full" />) : (
                <div className="rounded-lg border">
                  <ul className="divide-y text-sm">
                    {preview.lines.map((line) => {
                      const row = candidates.data?.rows.find((item) => item.account_id === line.interpreter_id)
                      return (
                        <li key={line.interpreter_id} className="flex flex-wrap justify-between gap-2 p-3">
                          <span>{row?.full_name ?? 'Intérprete'}</span>
                          <span className="tabular-nums">{formatAoa(line.price_aoa)}{line.travel_fee_aoa > 0 ? ` + ${formatAoa(line.travel_fee_aoa)} de deslocação` : ''}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="flex justify-between border-t bg-muted/40 p-3 font-semibold">
                    <span>Total</span><span className="tabular-nums">{formatAoa(preview.total_aoa)}</span>
                  </div>
                </div>
              )}
              {preview && preview.lines.length < form.interpreterIds.length && (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Algum intérprete escolhido não oferece este serviço: volta ao passo 2 e escolhe outro.</AlertDescription></Alert>
              )}
            </div>
          )}

          <div className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={step === 0 ? () => navigate('/requests') : back} disabled={sending}>
              <ArrowLeft className="h-4 w-4" />{step === 0 ? 'Cancelar' : 'Voltar'}
            </Button>
            {step === 6 ? (
              <Button onClick={() => void submit()} disabled={sending || !preview || preview.lines.length < form.interpreterIds.length}>
                {sending ? 'A enviar…' : 'Enviar pedido'}
              </Button>
            ) : (
              <Button onClick={next}>Seguinte<ArrowRight className="h-4 w-4" /></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
