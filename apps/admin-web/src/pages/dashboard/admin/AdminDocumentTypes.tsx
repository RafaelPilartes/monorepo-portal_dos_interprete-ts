import { useState } from 'react'
import { toast } from 'sonner'
import { COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Switch } from '@portal-dos-interpretes/ui/components/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { FileText } from 'lucide-react'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import type { DocumentTypeRow } from '@/data/repositories'
import { useDocumentTypeMutations, useDocumentTypes, type DocumentTypeInput } from '@/viewModels/staff-config.viewmodel'

// /settings/document-types (staff-and-config.md, PC-07): the documents the verification asks for.

const EMPTY: DocumentTypeInput = { code: '', name: '', description: '', required: false, active: true, sort: 0 }

export default function AdminDocumentTypes() {
  const types = useDocumentTypes()
  const { save, remove } = useDocumentTypeMutations()
  const [editing, setEditing] = useState<(DocumentTypeInput & { id?: string }) | null>(null)
  const [formError, setFormError] = useState<unknown>(null)
  const [removing, setRemoving] = useState<DocumentTypeRow | null>(null)

  const submit = async () => {
    if (!editing) return
    setFormError(null)
    try {
      await save.mutateAsync(editing)
      toast.success('Tipo de documento guardado.')
      setEditing(null)
    } catch (error) {
      setFormError(error)
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      toast.success('Tipo de documento removido.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRemoving(null)
    }
  }

  const details = errorDetails(formError)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de documento da verificação"
        description="O que o intérprete tem de enviar para obter o selo."
        action={<Button onClick={() => setEditing({ ...EMPTY, sort: (types.data?.length ?? 0) + 1 })}>Novo tipo</Button>}
      />
      <Card>
        <CardContent className="pt-6">
          {types.isPending ? (
            <TableSkeleton />
          ) : types.isError ? (
            <QueryError error={types.error} onRetry={() => void types.refetch()} />
          ) : types.data.length === 0 ? (
            <EmptyState icon={FileText} title="Ainda não há tipos de documento." description="Os tipos que criares aqui são pedidos na verificação." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.data.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.sort}</TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="font-mono text-xs">{type.code}</TableCell>
                    <TableCell>{type.required ? 'Sim' : 'Não'}</TableCell>
                    <TableCell><Badge variant={type.active ? 'default' : 'secondary'}>{type.active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => setEditing({ id: type.id, code: type.code, name: type.name, description: type.description, required: type.required, active: type.active, sort: type.sort })}>Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => setRemoving(type)}>Remover</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) { setEditing(null); setFormError(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar tipo de documento' : 'Novo tipo de documento'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit() }}>
              <div className="space-y-1">
                <Label htmlFor="doc-name">Nome</Label>
                <Input id="doc-name" required minLength={2} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                {details.name && <p className="text-sm text-destructive">{details.name}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-code">Código</Label>
                <Input id="doc-code" required pattern="[a-z][a-z0-9_]{1,40}" value={editing.code} onChange={(event) => setEditing({ ...editing, code: event.target.value })} />
                <p className="text-xs text-muted-foreground">Letras minúsculas, números e _; começa por uma letra.</p>
                {details.code && <p className="text-sm text-destructive">{details.code}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-description">Descrição</Label>
                <Textarea id="doc-description" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-sort">Ordem</Label>
                <Input id="doc-sort" type="number" min={0} value={editing.sort} onChange={(event) => setEditing({ ...editing, sort: Number(event.target.value) })} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.required} onCheckedChange={(required) => setEditing({ ...editing, required })} />Obrigatório</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={(active) => setEditing({ ...editing, active })} />Activo</label>
              </div>
              {formError !== null && <p role="alert" className="text-sm text-destructive">{errorMessage(formError)}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>{COMMON_TEXTS.cancel}</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? COMMON_TEXTS.loading : COMMON_TEXTS.save}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remover tipo de documento?"
        description={removing ? `"${removing.name}" deixa de ser pedido na verificação.` : ''}
        variant="danger"
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
