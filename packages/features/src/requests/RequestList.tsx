import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REQUEST_KIND_LABELS } from '@portal-dos-interpretes/i18n'
import { AgendaWhen } from '@portal-dos-interpretes/ui/components/agenda'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { ClipboardList } from 'lucide-react'
import { QueryError, TableSkeleton } from '../components/QueryStates'
import { useRequestList } from './RequestsContext'

const PAGE_SIZE = 15

/**
 * requester-web /requests (active) and /history (finished): paginated on the server, with the
 * "Criados por mim / Toda a organização" filter in an organisation's context (requests-core.md).
 */
export function RequestList({ finished, organizationId }: { finished: boolean; organizationId: string | null }) {
  const [page, setPage] = useState(1)
  const [mineOnly, setMineOnly] = useState(false)
  const list = useRequestList(finished, organizationId, mineOnly, page, PAGE_SIZE)
  const inOrganization = organizationId !== null

  return (
    <div className="space-y-4">
      {inOrganization && (
        <div className="flex gap-2" role="group" aria-label="Pedidos de quem">
          <Button size="sm" variant={mineOnly ? 'default' : 'outline'} aria-pressed={mineOnly} onClick={() => { setMineOnly(true); setPage(1) }}>Criados por mim</Button>
          <Button size="sm" variant={mineOnly ? 'outline' : 'default'} aria-pressed={!mineOnly} onClick={() => { setMineOnly(false); setPage(1) }}>Toda a organização</Button>
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          {list.isPending ? <TableSkeleton />
            : list.isError ? <QueryError error={list.error} onRetry={() => void list.refetch()} />
            : list.data.rows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={finished ? 'Ainda não há pedidos terminados.' : 'Ainda não fizeste nenhum pedido'}
                description={finished ? 'Os pedidos concluídos, cancelados ou expirados aparecem aqui.' : 'Escolhe um intérprete e marca o serviço em poucos passos.'}
                action={finished ? undefined : <Button asChild><Link to="/requests/new">Fazer um pedido</Link></Button>}
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Quando</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead className="hidden md:table-cell">Tipo</TableHead>
                      <TableHead className="hidden sm:table-cell">Intérpretes</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.data.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell><AgendaWhen at={row.starts_at} /></TableCell>
                        <TableCell>
                          <Link to={`/requests/${row.id}`} className="font-medium hover:underline">{row.service_title}</Link>
                          <p className="font-mono text-xs text-muted-foreground">{row.code}{row.is_urgent && <Badge variant="destructive" className="ml-2 py-0 text-[10px]">Urgente</Badge>}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{REQUEST_KIND_LABELS[row.kind as keyof typeof REQUEST_KIND_LABELS]}</TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">{row.accepted_count}/{row.interpreters_needed}</TableCell>
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
