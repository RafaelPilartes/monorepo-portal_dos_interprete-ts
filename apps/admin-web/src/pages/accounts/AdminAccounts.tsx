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
import { Search, UserCheck, Users } from 'lucide-react'
import type { AccountKind, DirectoryQuery } from '@/data/repositories'
import { DIRECTORY_PAGE_SIZE, useAccounts } from '@/viewModels/accounts.viewmodel'
import { statusLabel, statusVariant, useDebounced } from './directory'

// /requesters and /interpreters (accounts-and-organizations.md, admin-web): paginated on the
// server with search and a state filter (R-ADM-06).

const TEXTS = {
  requester: { title: 'Solicitantes', description: 'Quem pede intérpretes, como particular ou numa organização.', empty: 'Ainda não há solicitantes.', icon: UserCheck, base: '/requesters' },
  interpreter: { title: 'Intérpretes', description: 'Quem tem perfil de intérprete, listado ou não no directório.', empty: 'Ainda não há intérpretes.', icon: Users, base: '/interpreters' },
}
const ALL = 'all'

export default function AdminAccounts({ kind }: { kind: AccountKind }) {
  const texts = TEXTS[kind]
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<DirectoryQuery['status'] | typeof ALL>(ALL)
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  useEffect(() => setPage(1), [q, status])
  const query: DirectoryQuery = { q: q || undefined, status: status === ALL ? undefined : status, page, pageSize: DIRECTORY_PAGE_SIZE }
  const accounts = useAccounts(kind, query)
  const total = accounts.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE))
  const filtered = !!q || status !== ALL

  return (
    <>
      <PageHeader title={texts.title} description={texts.description} />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input aria-label="Pesquisar por nome ou email" placeholder="Pesquisar por nome ou email" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
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

          {accounts.isPending ? (
            <TableSkeleton rows={6} />
          ) : accounts.isError ? (
            <QueryError error={accounts.error} onRetry={() => void accounts.refetch()} />
          ) : accounts.data.data.length === 0 ? (
            <EmptyState
              icon={texts.icon}
              title={filtered ? 'Nenhuma conta corresponde à pesquisa.' : texts.empty}
              description={filtered ? 'Muda a pesquisa ou o estado.' : 'As contas aparecem aqui depois do onboarding.'}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">{kind === 'requester' ? 'Tipo' : 'Cidade'}</TableHead>
                    <TableHead className="hidden sm:table-cell">Desde</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.data.data.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Link to={`${texts.base}/${account.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{account.full_name}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{account.email}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {kind === 'requester'
                          ? [account.is_individual_requester && 'Particular', account.is_org_member && 'Organização'].filter(Boolean).join(' · ')
                          : account.city ?? '—'}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{account.created_at ? formatDate(account.created_at) : '—'}</TableCell>
                      <TableCell><Badge variant={statusVariant(account.status)}>{statusLabel(account.status)}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{total === 1 ? '1 conta' : `${total} contas`}</span>
              </div>
              <PaginationBar page={page} pageCount={pageCount} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
