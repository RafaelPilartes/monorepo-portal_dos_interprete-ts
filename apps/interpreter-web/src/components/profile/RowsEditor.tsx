import { useState, type ReactNode } from 'react'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Checkbox } from '@portal-dos-interpretes/ui/components/checkbox'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@portal-dos-interpretes/ui/components/sheet'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { OwnTable } from '@portal-dos-interpretes/features/directory/data'
import { Field } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// A list of the interpreter's own rows with create, edit and delete in a side panel. Each field
// says how to read and write itself; the database checks the values and the panel shows its
// refusal on the field.

export interface RowField {
  key: string
  label: string
  kind?: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'url'
  hint?: string
}

type Values = Record<string, string | boolean>

function toValues(fields: readonly RowField[], row: Record<string, unknown> | null): Values {
  return Object.fromEntries(fields.map(({ key, kind }) => {
    const value = row?.[key]
    return [key, kind === 'checkbox' ? value === true : value === null || value === undefined ? '' : String(value)]
  }))
}

function toRow(fields: readonly RowField[], values: Values): Record<string, unknown> {
  return Object.fromEntries(fields.map(({ key, kind }) => {
    const value = values[key]
    if (kind === 'checkbox') return [key, value === true]
    const text = String(value ?? '').trim()
    if (text === '') return [key, null]
    return [key, kind === 'number' ? Number(text) : text]
  }))
}

export function RowsEditor<Row extends { id: string }>({ table, title, description, empty, addLabel, rows, fields, summary }: {
  table: OwnTable
  title: string
  description: string
  empty: string
  addLabel: string
  rows: readonly Row[]
  fields: readonly RowField[]
  summary: (row: Row) => ReactNode
}) {
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null)
  const save = useProfileWrite((repository, accountId, input: { id: string | null; values: Values }) => input.id
    ? repository.updateOwn(table, input.id, toRow(fields, input.values))
    : repository.insertOwn(table, { interpreter_id: accountId, ...toRow(fields, input.values) }), 'Alterações guardadas.', fields.map(({ key }) => key))
  const remove = useProfileWrite((repository, _accountId, id: string) => repository.deleteOwn(table, id), 'Removido.')
  const errors = save.isError ? failureOf(save.error).fields : {}
  const set = (key: string, value: string | boolean) => setEditing((current) => current && { ...current, values: { ...current.values, [key]: value } })

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => { save.reset(); setEditing({ id: null, values: toValues(fields, null) }) }}>
          <Plus className="h-4 w-4" />{addLabel}
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 py-3">
                <div className="flex-1 text-sm">{summary(row)}</div>
                <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => { save.reset(); setEditing({ id: row.id, values: toValues(fields, row as unknown as Record<string, unknown>) }) }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Remover" disabled={remove.isPending} onClick={() => remove.mutate(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing?.id ? `Editar: ${title.toLowerCase()}` : addLabel}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {editing && (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                save.mutate(editing, { onSuccess: () => setEditing(null) })
              }}
            >
              <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
                {fields.map(({ key, label, kind = 'text', hint }) => kind === 'checkbox' ? (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox id={key} checked={editing.values[key] === true} onCheckedChange={(value) => set(key, value === true)} />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ) : (
                  <Field key={key} id={key} label={label} hint={hint} error={errors[key]}>
                    {kind === 'textarea'
                      ? <Textarea id={key} rows={4} value={String(editing.values[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
                      : <Input id={key} type={kind} value={String(editing.values[key] ?? '')} aria-invalid={!!errors[key]} onChange={(e) => set(key, e.target.value)} />}
                  </Field>
                ))}
                {save.isError && Object.keys(errors).length === 0 && <p role="alert" className="text-sm text-destructive">{failureOf(save.error).message}</p>}
              </div>
              <SheetFooter className="gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'A guardar…' : 'Guardar'}</Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  )
}
