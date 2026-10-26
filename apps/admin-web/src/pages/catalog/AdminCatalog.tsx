import { useState, type ReactNode } from 'react'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@portal-dos-interpretes/ui/components/sheet'
import { Switch } from '@portal-dos-interpretes/ui/components/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { Briefcase, Languages, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { servicePrice } from './servicePrice'
import { useCatalog, useCatalogMutations, type CatalogKind, type CatalogRow } from '@/viewModels/catalog.viewmodel'

// /catalog/languages, /catalog/specialties, /catalog/services (catalogs.md): the items with their
// usage; create and edit in a side panel; "Apagar" only for items never used (R-CAT-01); the
// pricing mode of a used service is locked (R-CAT-02).

type Values = Record<string, string | number | boolean | null>

const TEXTS: Record<CatalogKind, { title: string; description: string; empty: string; one: string; icon: typeof Languages }> = {
  languages: { title: 'Línguas', description: 'As línguas que os intérpretes dominam e que os pedidos indicam.', empty: 'Ainda não há línguas.', one: 'língua', icon: Languages },
  specialties: { title: 'Especialidades', description: 'Áreas em que os intérpretes trabalham.', empty: 'Ainda não há especialidades.', one: 'especialidade', icon: Tags },
  services: { title: 'Serviços', description: 'Os serviços que se pedem, com o preço de tabela do pedido gerido.', empty: 'Ainda não há serviços.', one: 'serviço', icon: Briefcase },
}

const EMPTY: Record<CatalogKind, Values> = {
  languages: { code: '', name: '', is_sign_language: false, active: true, sort: 0 },
  specialties: { slug: '', name: '', description: '', active: true, sort: 0 },
  services: { slug: '', title: '', description: '', pricing_mode: 'hourly', platform_price_aoa: 0, icon: '', active: true, sort: 0 },
}

function nameOf(row: CatalogRow): string {
  return ('title' in row ? row.title : row.name) ?? ''
}

function valuesOf(kind: CatalogKind, row: CatalogRow): Values {
  const values: Values = {}
  for (const key of Object.keys(EMPTY[kind])) values[key] = (row as Record<string, unknown>)[key] as Values[string] ?? EMPTY[kind][key] ?? null
  return values
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string | undefined; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Editor({ kind, editing, onClose }: { kind: CatalogKind; editing: { id: string | null; values: Values; usedIn: number }; onClose: () => void }) {
  const { save } = useCatalogMutations(kind)
  const [values, setValues] = useState<Values>(editing.values)
  const errors = save.isError ? errorDetails(save.error) : {}
  const set = (key: string, value: Values[string]) => setValues((current) => ({ ...current, [key]: value }))
  const text = (key: string) => String(values[key] ?? '')
  const pricingLocked = kind === 'services' && editing.id !== null && editing.usedIn > 0

  const submit = () => {
    const payload: Values = { ...values, sort: Number(values.sort ?? 0) }
    if (kind === 'services') {
      payload.platform_price_aoa = Number(values.platform_price_aoa ?? 0)
      payload.icon = text('icon').trim() || null
    }
    save.mutate({ id: editing.id, values: payload }, {
      onSuccess: () => {
        toast.success('Alterações guardadas.')
        onClose()
      },
      onError: (error) => {
        if (Object.keys(errorDetails(error)).length === 0) toast.error(errorMessage(error))
      },
    })
  }

  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-1 py-4">
        {kind === 'languages' && (
          <>
            <Field id="code" label="Código" hint="De 2 a 8 letras minúsculas (ex.: pt, lga)." error={errors.code}>
              <Input id="code" value={text('code')} onChange={(e) => set('code', e.target.value.toLowerCase())} aria-invalid={!!errors.code} />
            </Field>
            <Field id="name" label="Nome" error={errors.name}><Input id="name" value={text('name')} onChange={(e) => set('name', e.target.value)} /></Field>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="is_sign_language">Língua gestual</Label>
              <Switch id="is_sign_language" checked={values.is_sign_language === true} onCheckedChange={(v) => set('is_sign_language', v)} />
            </div>
          </>
        )}
        {kind === 'specialties' && (
          <>
            <Field id="name" label="Nome" error={errors.name}><Input id="name" value={text('name')} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field id="slug" label="Identificador" hint="Letras minúsculas, números e hífenes (ex.: comunicacao-social)." error={errors.slug}>
              <Input id="slug" value={text('slug')} onChange={(e) => set('slug', e.target.value)} aria-invalid={!!errors.slug} />
            </Field>
            <Field id="description" label="Descrição" error={errors.description}>
              <Textarea id="description" rows={3} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </>
        )}
        {kind === 'services' && (
          <>
            <Field id="title" label="Título" error={errors.title}><Input id="title" value={text('title')} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field id="slug" label="Identificador" hint="Letras minúsculas, números e hífenes (ex.: interpretacao-medica)." error={errors.slug}>
              <Input id="slug" value={text('slug')} onChange={(e) => set('slug', e.target.value)} aria-invalid={!!errors.slug} />
            </Field>
            <Field id="description" label="Descrição" error={errors.description}>
              <Textarea id="description" rows={3} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field
              id="pricing_mode"
              label="Modo de preço"
              hint={pricingLocked ? 'Já foi usado: o modo de preço não muda. Para mudar, cria um serviço novo e desactiva este.' : undefined}
              error={errors.pricing_mode}
            >
              <Select value={text('pricing_mode')} onValueChange={(value) => set('pricing_mode', value)} disabled={pricingLocked}>
                <SelectTrigger id="pricing_mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">À hora</SelectItem>
                  <SelectItem value="fixed">Preço fixo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              id="platform_price_aoa"
              label={`Preço de tabela (Kz ${values.pricing_mode === 'hourly' ? 'por hora' : 'fixo'})`}
              hint="Usado nos orçamentos novos do pedido gerido; os já feitos não mudam."
              error={errors.platform_price_aoa}
            >
              <Input id="platform_price_aoa" type="number" min={0} step={1} inputMode="numeric" value={text('platform_price_aoa')} onChange={(e) => set('platform_price_aoa', e.target.value)} />
            </Field>
            <Field id="icon" label="Ícone" hint="Chave da imagem no site (ex.: health, education)." error={errors.icon}>
              <Input id="icon" value={text('icon')} onChange={(e) => set('icon', e.target.value)} />
            </Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field id="sort" label="Ordem" error={errors.sort}>
            <Input id="sort" type="number" min={0} step={1} value={text('sort')} onChange={(e) => set('sort', e.target.value)} />
          </Field>
          <div className="flex items-end justify-between gap-3 pb-2">
            <Label htmlFor="active">Activo</Label>
            <Switch id="active" checked={values.active === true} onCheckedChange={(v) => set('active', v)} />
          </div>
        </div>
      </div>
      <SheetFooter className="gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancelar</Button>
        <Button onClick={submit} disabled={save.isPending}>{save.isPending ? 'A guardar…' : 'Guardar'}</Button>
      </SheetFooter>
    </>
  )
}

export default function AdminCatalog({ kind }: { kind: CatalogKind }) {
  const texts = TEXTS[kind]
  const items = useCatalog(kind)
  const { save, remove } = useCatalogMutations(kind)
  const [editing, setEditing] = useState<{ id: string | null; values: Values; usedIn: number } | null>(null)
  const [deleting, setDeleting] = useState<CatalogRow | null>(null)

  const open = (row: CatalogRow | null) => setEditing(row
    ? { id: row.id ?? null, values: valuesOf(kind, row), usedIn: row.used_in ?? 0 }
    : { id: null, values: { ...EMPTY[kind], sort: ((items.data?.length ?? 0) + 1) * 10 }, usedIn: 0 })

  const deactivate = (row: CatalogRow) => save.mutate(
    { id: row.id ?? null, values: { ...valuesOf(kind, row), active: false } },
    { onSuccess: () => toast.success(`Desactivámos ${nameOf(row)}.`), onError: (error) => toast.error(errorMessage(error)) },
  )

  return (
    <>
      <PageHeader title={texts.title} description={texts.description} action={<Button onClick={() => open(null)}>Novo</Button>} />
      <Card>
        <CardContent className="pt-6">
          {items.isPending ? (
            <TableSkeleton />
          ) : items.isError ? (
            <QueryError error={items.error} onRetry={() => void items.refetch()} />
          ) : items.data.length === 0 ? (
            <EmptyState icon={texts.icon} title={texts.empty} description="Cria o primeiro com o botão Novo." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-right">Ordem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">{kind === 'languages' ? 'Código' : 'Identificador'}</TableHead>
                  {kind === 'services' && <TableHead className="hidden md:table-cell">Preço de tabela</TableHead>}
                  <TableHead className="hidden md:table-cell">Usado em</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Acções</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.data.map((row) => {
                  const used = row.used_in ?? 0
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{row.sort}</TableCell>
                      <TableCell className="font-medium">
                        {nameOf(row)}
                        {'is_sign_language' in row && row.is_sign_language && <Badge variant="secondary" className="ml-2">gestual</Badge>}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{'code' in row ? row.code : row.slug}</TableCell>
                      {kind === 'services' && 'pricing_mode' in row && (
                        <TableCell className="hidden whitespace-nowrap tabular-nums md:table-cell">{servicePrice(row)}</TableCell>
                      )}
                      <TableCell className="hidden text-muted-foreground md:table-cell">{used === 0 ? 'Nunca usado' : used === 1 ? '1 sítio' : `${used} sítios`}</TableCell>
                      <TableCell><Badge variant={row.active ? 'default' : 'secondary'}>{row.active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap text-right">
                        <Button variant="outline" size="sm" onClick={() => open(row)}>Editar</Button>
                        {used === 0 ? (
                          <Button variant="outline" size="sm" onClick={() => setDeleting(row)}>Apagar</Button>
                        ) : row.active ? (
                          <Button variant="outline" size="sm" disabled={save.isPending} onClick={() => deactivate(row)}>Desactivar</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={editing !== null} onOpenChange={(value) => !value && setEditing(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing?.id ? `Editar ${texts.one}` : `Novo item: ${texts.one}`}</SheetTitle>
            <SheetDescription>{editing?.id && editing.usedIn > 0 ? `Usado em ${editing.usedIn === 1 ? '1 sítio' : `${editing.usedIn} sítios`}: desactiva-o em vez de o apagar.` : 'As mudanças ficam na auditoria.'}</SheetDescription>
          </SheetHeader>
          {editing && <Editor key={editing.id ?? 'new'} kind={kind} editing={editing} onClose={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        title={`Apagar ${deleting ? nameOf(deleting) : ''}?`}
        description="Nunca foi usado, por isso pode ser apagado. Esta acção não se desfaz."
        confirmLabel="Apagar"
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id ?? '', {
          onSuccess: () => {
            toast.success(`Apagámos ${nameOf(deleting)}.`)
            setDeleting(null)
          },
          onError: (error) => {
            toast.error(errorMessage(error))
            setDeleting(null)
          },
        })}
      />
    </>
  )
}
