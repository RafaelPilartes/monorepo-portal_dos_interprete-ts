import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { useStaffRequestList } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime, REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { ClipboardList } from 'lucide-react'

// admin-web /requests: every request, paginated on the server (R-ADM-06), filtered by status;
// "Em disputa" is the moderators' queue (R-LIFE-05).

const PAGE_SIZE = 20
const FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'disputed', label: 'Em disputa' },
  { value: 'awaiting_interpreters', label: 'À espera de intérpretes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'delivered', label: 'Feitos, por confirmar' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function AdminRequests() {
  const [status, setStatus] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const list = useStaffRequestList(status, page, PAGE_SIZE)
  return (
    <div className="space-y-4">
      <PageHeader title="Pedidos" description="Todos os pedidos da plataforma. As disputas abertas estão em «Em disputa»." />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((filter) => (
          <Button key={filter.label} size="sm" variant={status === filter.value ? 'default' : 'outline'} aria-pressed={status === filter.value}
            onClick={() => { setStatus(filter.value); setPage(1) }}>{filter.label}</Button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {list.isPending ? <TableSkeleton />
            : list.isError ? <QueryError error={list.error} onRetry={() => void list.refetch()} />
            : list.data.rows.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Nenhum pedido com este estado." description="Escolhe outro filtro." />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Quando</TableHead>
                      <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                      <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.data.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link to={`/requests/${row.id}`} className="font-medium hover:underline">{row.service_title}</Link>
                          <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(row.starts_at ?? '')}</TableCell>
                        <TableCell className="hidden md:table-cell">{row.organization_name ?? row.created_by_name}</TableCell>
                        <TableCell className="hidden lg:table-cell">{REQUEST_KIND_LABELS[row.kind as keyof typeof REQUEST_KIND_LABELS]}</TableCell>
                        <TableCell><StatusBadge kind="request" status={row.status ?? ''} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4"><PaginationBar page={page} pageCount={Math.max(1, Math.ceil(list.data.total / PAGE_SIZE))} onPageChange={setPage} /></div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
