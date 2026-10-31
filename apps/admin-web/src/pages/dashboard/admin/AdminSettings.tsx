import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@portal-dos-interpretes/auth'
import { COMMON_TEXTS, formatDateTime } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { ALL_FIELDS, CONFIG_GROUPS, differences, displayValue, parseFieldInput, type FieldValue } from '@/config/configFields'
import type { ConfigVersionRow } from '@/data/repositories'
import { useConfigMutations, useConfigVersions, useStaffList } from '@/viewModels/staff-config.viewmodel'

// /settings/config (staff-and-config.md, R-CFG-01..04): the version in force, read only; drafts
// are edited and published with the list of differences; the history of versions.

const UNSET = '__unset__'
/** Server field names that differ from the form's (INVALID_IBAN reports "iban"). */
const SERVER_FIELDS: Record<string, string> = { iban: 'academia_iban' }

/** The history shows the most recent versions first; the rest on request. */
const HISTORY_SIZE = 10

const STATUS_LABELS: Record<string, string> = { draft: 'Rascunho', published: 'Em vigor', retired: 'Retirada' }

function ValueCell({ version, field }: { version: ConfigVersionRow; field: (typeof ALL_FIELDS)[number] }) {
  const shown = displayValue(field, version[field.field])
  if (shown !== null) return <span>{shown}</span>
  return field.blocksProduction ? (
    <Badge variant="destructive">Por definir — bloqueia a produção</Badge>
  ) : (
    <span className="text-muted-foreground">Por definir</span>
  )
}

function VersionView({ version }: { version: ConfigVersionRow }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {CONFIG_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {group.fields.map((field) => (
                <div key={field.field} className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="text-right">
                    <ValueCell version={version} field={field} />
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DraftEditor({ draft, current, onClose }: { draft: ConfigVersionRow; current: ConfigVersionRow | null; onClose: () => void }) {
  const { updateDraft, publish } = useConfigMutations()
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_FIELDS.map((field) => [field.field, draft[field.field] === null ? '' : String(draft[field.field])])),
  )
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<unknown>(null)
  const [confirming, setConfirming] = useState(false)

  const collect = (): Record<string, FieldValue> | null => {
    const errors: Record<string, string> = {}
    const values: Record<string, FieldValue> = {}
    for (const field of ALL_FIELDS) {
      const parsed = parseFieldInput(field, inputs[field.field] ?? '')
      if ('error' in parsed) errors[field.field] = parsed.error
      else values[field.field] = parsed.value
    }
    setFieldErrors(errors)
    return Object.keys(errors).length > 0 ? null : values
  }

  const save = async (): Promise<ConfigVersionRow | null> => {
    setSaveError(null)
    const values = collect()
    if (!values) return null
    try {
      return await updateDraft.mutateAsync({ id: draft.id, values, notes })
    } catch (error) {
      setSaveError(error)
      setFieldErrors(Object.fromEntries(Object.entries(errorDetails(error)).map(([key, message]) => [SERVER_FIELDS[key] ?? key, message])))
      return null
    }
  }

  const [saved, setSaved] = useState<ConfigVersionRow | null>(null)
  const changes = saved ? differences(current, saved) : []

  const askPublish = async () => {
    const result = await save()
    if (result) {
      setSaved(result)
      setConfirming(true)
    }
  }

  const doPublish = async () => {
    try {
      await publish.mutateAsync({ id: draft.id, expectedCurrentVersionId: current?.id ?? null })
      toast.success(`Versão ${draft.version_number} publicada.`)
      setConfirming(false)
      onClose()
    } catch (error) {
      setConfirming(false)
      setSaveError(error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Rascunho — versão {draft.version_number}</CardTitle>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            void save().then((result) => result && toast.success('Rascunho guardado.'))
          }}
        >
          {CONFIG_GROUPS.map((group) => (
            <fieldset key={group.title} className="space-y-3">
              <legend className="font-medium">{group.title}</legend>
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => {
                  const id = `config-${field.field}`
                  return (
                    <div key={field.field} className="space-y-1">
                      <Label htmlFor={id}>
                        {field.label}
                        {field.unit ? ` (${field.unit})` : field.kind === 'percent' ? ' (%)' : field.kind === 'money' ? ' (Kz)' : ''}
                      </Label>
                      {field.kind === 'boolean' ? (
                        // Three states: an empty value is "Por definir", never a hidden "Não".
                        <Select
                          value={inputs[field.field] === '' ? UNSET : inputs[field.field]}
                          onValueChange={(next) => setInputs((current) => ({ ...current, [field.field]: next === UNSET ? '' : next }))}
                        >
                          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNSET}>Por definir</SelectItem>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={id}
                          inputMode={field.kind === 'text' || field.kind === 'iban' ? 'text' : 'decimal'}
                          value={inputs[field.field] ?? ''}
                          placeholder="Por definir"
                          aria-invalid={fieldErrors[field.field] ? true : undefined}
                          onChange={(event) => setInputs((current) => ({ ...current, [field.field]: event.target.value }))}
                        />
                      )}
                      {fieldErrors[field.field] && <p className="text-sm text-destructive">{fieldErrors[field.field]}</p>}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ))}
          <div className="space-y-1">
            <Label htmlFor="config-notes">Notas</Label>
            <Textarea id="config-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          {saveError !== null && <p role="alert" className="text-sm text-destructive">{errorMessage(saveError)}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="outline" disabled={updateDraft.isPending}>
              {updateDraft.isPending ? COMMON_TEXTS.loading : 'Guardar rascunho'}
            </Button>
            <Button type="button" onClick={() => void askPublish()} disabled={updateDraft.isPending || publish.isPending}>
              Publicar…
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publicar a versão {draft.version_number}?</DialogTitle>
            <DialogDescription>
              Passa a ser a versão em vigor{current ? `; a versão ${current.version_number} fica retirada` : ''}. Uma versão publicada não se edita.
            </DialogDescription>
          </DialogHeader>
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum valor muda em relação à versão em vigor.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Em vigor</TableHead>
                  <TableHead>Nova versão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((field) => (
                  <TableRow key={field.field}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>{current ? displayValue(field, current[field.field]) ?? 'Por definir' : '—'}</TableCell>
                    <TableCell>{saved ? displayValue(field, saved[field.field]) ?? 'Por definir' : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>{COMMON_TEXTS.cancel}</Button>
            <Button onClick={() => void doPublish()} disabled={publish.isPending}>
              {publish.isPending ? COMMON_TEXTS.loading : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default function AdminSettings() {
  const session = useSession()
  const isSuper = session.status === 'authenticated' && session.account.staffLevel === 'super_admin'
  const versions = useConfigVersions()
  const staff = useStaffList()
  const { createDraft } = useConfigMutations()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const current = useMemo(() => versions.data?.find((version) => version.status === 'published') ?? null, [versions.data])
  const editing = versions.data?.find((version) => version.id === editingId && version.status === 'draft') ?? null
  const names = useMemo(() => new Map((staff.data ?? []).map((member) => [member.account_id, member.full_name])), [staff.data])

  const startDraft = async () => {
    try {
      const draft = await createDraft.mutateAsync(current?.id)
      setEditingId(draft.id)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (versions.isPending) return <TableSkeleton rows={8} />
  if (versions.isError) return <QueryError error={versions.error} onRetry={() => void versions.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração da plataforma"
        description={current ? `Versão em vigor: ${current.version_number}, publicada a ${current.published_at ? formatDateTime(current.published_at) : '—'}.` : 'Ainda não há nenhuma versão em vigor.'}
        action={isSuper && !editing ? <Button onClick={() => void startDraft()} disabled={createDraft.isPending}>Criar rascunho</Button> : undefined}
      />

      {editing ? <DraftEditor key={editing.id} draft={editing} current={current} onClose={() => setEditingId(null)} /> : current && <VersionView version={current} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de versões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Publicada por</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAll ? versions.data : versions.data.slice(0, HISTORY_SIZE)).map((version) => (
                <TableRow key={version.id}>
                  <TableCell>{version.version_number}</TableCell>
                  <TableCell>
                    <Badge variant={version.status === 'published' ? 'default' : 'secondary'}>{STATUS_LABELS[version.status] ?? version.status}</Badge>
                  </TableCell>
                  <TableCell>{version.published_by ? names.get(version.published_by) ?? '—' : '—'}</TableCell>
                  <TableCell>{version.published_at ? formatDateTime(version.published_at) : '—'}</TableCell>
                  <TableCell className="text-right">
                    {isSuper && version.status === 'draft' && (
                      <Button variant="outline" size="sm" onClick={() => setEditingId(version.id)}>Editar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {versions.data.length > HISTORY_SIZE && (
            <Button variant="ghost" className="mt-2" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Mostrar só as mais recentes' : `Mostrar todas (${versions.data.length})`}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
