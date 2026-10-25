import { useMemo, useState } from 'react'
import { formatDateTime, STAFF_LEVEL_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { History } from 'lucide-react'
import { QueryError, TableSkeleton } from '@/components/QueryStates'
import type { AuditRow } from '@/data/repositories'
import { AUDIT_PAGE_SIZE, useAuditEvents, useStaffList, type AuditFilters } from '@/viewModels/staff-config.viewmodel'

// /audit (staff-and-config.md, R-AUD-03): paginated on the server, most recent first; each level
// sees the entries of its areas (the database filters, audit.events_for_staff).

const ANY = '__any__'
const ENTITY_LABELS: Record<string, string> = {
  staff_member: 'Equipa',
  platform_version: 'Configuração',
  legal_document: 'Documento legal',
  document_type: 'Tipo de documento',
  verification_document: 'Documento de verificação',
  chat_attachment: 'Anexo de conversa',
}

function actorLabel(row: AuditRow): string {
  const role = row.actor_role && row.actor_role in STAFF_LEVEL_LABELS ? STAFF_LEVEL_LABELS[row.actor_role as keyof typeof STAFF_LEVEL_LABELS] : row.actor_role === 'system' ? 'Sistema' : row.actor_role
  return row.actor_name ? `${row.actor_name} (${role})` : role ?? '—'
}

/** One line about the entry: the changed fields, or the note, or the entity. */
function summary(row: AuditRow): string {
  const after = row.after && typeof row.after === 'object' && !Array.isArray(row.after) ? Object.keys(row.after) : []
  if (after.length > 0) return after.slice(0, 4).join(', ') + (after.length > 4 ? '…' : '')
  return row.note ?? row.entity_id ?? '—'
}

/** End of the chosen day in Luanda (UTC+1), so a "to" date includes the whole day. */
function endOfDay(date: string): string {
  return `${date}T23:59:59.999+01:00`
}

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <p className="text-sm text-muted-foreground">—</p>
  return <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>
}

export default function AdminAudit() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1 })
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<AuditRow | null>(null)
  const events = useAuditEvents(filters)
  const staff = useStaffList()
  const pageCount = useMemo(() => Math.max(1, Math.ceil((events.data?.total ?? 0) / AUDIT_PAGE_SIZE)), [events.data?.total])

  const apply = (patch: Partial<AuditFilters>) => setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Quem fez o quê, e quando. Ninguém altera nem apaga estes registos." />

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="audit-from">De</Label>
            <Input id="audit-from" type="date" value={from} onChange={(event) => { setFrom(event.target.value); apply({ from: event.target.value ? `${event.target.value}T00:00:00+01:00` : undefined }) }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-to">Até</Label>
            <Input id="audit-to" type="date" value={to} onChange={(event) => { setTo(event.target.value); apply({ to: event.target.value ? endOfDay(event.target.value) : undefined }) }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-actor">Pessoa</Label>
            <Select value={filters.actor ?? ANY} onValueChange={(value) => apply({ actor: value === ANY ? undefined : value })}>
              <SelectTrigger id="audit-actor"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todas</SelectItem>
                {(staff.data ?? []).map((member) => member.account_id && (
                  <SelectItem key={member.account_id} value={member.account_id}>{member.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-action">Acção</Label>
            <Input id="audit-action" placeholder="ex.: config.published" value={filters.action ?? ''} onChange={(event) => apply({ action: event.target.value.trim() || undefined })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-entity">Tipo de entidade</Label>
            <Select value={filters.entityType ?? ANY} onValueChange={(value) => apply({ entityType: value === ANY ? undefined : value })}>
              <SelectTrigger id="audit-entity"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todos</SelectItem>
                {Object.entries(ENTITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {events.isPending ? (
            <TableSkeleton rows={8} />
          ) : events.isError ? (
            <QueryError error={events.error} onRetry={() => void events.refetch()} />
          ) : events.data.rows.length === 0 ? (
            <EmptyState icon={History} title="Não há registos neste período." description="Muda os filtros para ver outros registos." />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Quem</TableHead>
                    <TableHead>Acção</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.data.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{row.occurred_at ? formatDateTime(row.occurred_at) : '—'}</TableCell>
                      <TableCell>{actorLabel(row)}</TableCell>
                      <TableCell className="font-mono text-xs">{row.action}</TableCell>
                      <TableCell>{(row.entity_type && ENTITY_LABELS[row.entity_type]) ?? row.entity_type}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{summary(row)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(row)}>Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar page={filters.page} pageCount={pageCount} onPageChange={(page) => apply({ page })} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.action}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selected.occurred_at ? formatDateTime(selected.occurred_at) : ''} · {actorLabel(selected)} · {selected.entity_type} {selected.entity_id}
                {selected.request_id ? ` · pedido ${selected.request_id}` : ''}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="mb-1 text-sm font-medium">Antes</p><Json value={selected.before} /></div>
                <div><p className="mb-1 text-sm font-medium">Depois</p><Json value={selected.after} /></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
