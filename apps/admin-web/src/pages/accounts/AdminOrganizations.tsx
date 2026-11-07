import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { formatDate } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { Building2, Search } from 'lucide-react'
import type { DirectoryQuery } from '@/data/repositories'
import { DIRECTORY_PAGE_SIZE, useOrganizations } from '@/viewModels/accounts.viewmodel'
import { statusLabel, statusVariant, useDebounced } from './directory'

// /organizations (accounts-and-organizations.md, admin-web): paginated on the server, with search
// by name or NIF and a state filter (R-ADM-06).

const ALL = 'all'

export default function AdminOrganizations() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<DirectoryQuery['status'] | typeof ALL>(ALL)
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  useEffect(() => setPage(1), [q, status])
  const organizations = useOrganizations({ q: q || undefined, status: status === ALL ? undefined : status, page, pageSize: DIRECTORY_PAGE_SIZE })
  const total = organizations.data?.pagination.total ?? 0
  const filtered = !!q || status !== ALL

  return (
    <>
      <PageHeader title="Organizações" description="Empresas e instituições que pedem intérpretes em nome próprio." />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input aria-label="Pesquisar por nome ou NIF" placeholder="Pesquisar por nome ou NIF" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="sm:w-44" aria-label="Estado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="suspended">Suspensas</SelectItem>
                <SelectItem value="anonymized">Removidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {organizations.isPending ? (
            <TableSkeleton rows={6} />
          ) : organizations.isError ? (
            <QueryError error={organizations.error} onRetry={() => void organizations.refetch()} />
          ) : organizations.data.data.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={filtered ? 'Nenhuma organização corresponde à pesquisa.' : 'Ainda não há organizações.'}
              description={filtered ? 'Muda a pesquisa ou o estado.' : 'Aparecem aqui quando alguém cria uma no onboarding.'}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead className="hidden md:table-cell">Dono</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Membros</TableHead>
                    <TableHead className="hidden lg:table-cell">Desde</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.data.data.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell><Link to={`/organizations/${org.id}`} className="font-medium hover:text-primary hover:underline">{org.name}</Link></TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{org.nif}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{org.owner_name ?? '—'}</TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{org.member_count ?? 0}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{org.created_at ? formatDate(org.created_at) : '—'}</TableCell>
                      <TableCell><Badge variant={statusVariant(org.status)}>{statusLabel(org.status)}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">{total === 1 ? '1 organização' : `${total} organizações`}</p>
              <PaginationBar page={page} pageCount={Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE))} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
