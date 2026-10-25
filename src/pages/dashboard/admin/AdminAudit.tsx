import { useState } from 'react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FiltersBar } from '@/components/dashboard/FiltersBar'
import { EmptyState } from '@/components/dashboard/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Clock, ShieldAlert, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { AuditDetailsModal } from '@/components/dashboard/modals/AuditDetailsModal'
import { AuditLog, mockLogs } from '@/core/mocks/auditMocks'

const moduleFilters = [
  { value: 'all', label: 'Todos os Módulos' },
  { value: 'AdminTeam', label: 'Admin Team' },
  { value: 'Interpreters', label: 'Intérpretes' },
  { value: 'Requests', label: 'Pedidos / Requisições' },
  { value: 'Profile', label: 'Perfis de Utilizador' },
  { value: 'Database', label: 'Base de Dados (Sistema)' }
]

export default function AdminAudit() {
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch =
      log.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
    const matchesModule =
      moduleFilter === 'all' || log.module === moduleFilter
    return matchesSearch && matchesModule
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="bg-red-600">crítico</Badge>
      case 'high': return <Badge variant="destructive" className="bg-orange-600">alto</Badge>
      case 'medium': return <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 hover:bg-yellow-200">médio</Badge>
      default: return <Badge variant="outline" className="text-gray-500">baixo</Badge>
    }
  }

  const getActionBadge = (action: string) => {
    return <Badge variant="outline" className="font-mono bg-muted/50">{action}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria Avançada (Schema Completo)"
        description="Monitorização centralizada de transações, modificações e acessos baseada no Schema Completo de Logs."
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por utilizador, ação ou descrição..."
        filters={[
          {
            name: 'module',
            value: moduleFilter,
            onChange: setModuleFilter,
            options: moduleFilters
          }
        ]}
        onClearFilters={() => {
          setSearch('')
          setModuleFilter('all')
          setCurrentPage(1)
        }}
        hasActiveFilters={search !== '' || moduleFilter !== 'all'}
      />

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Nenhum registo encontrado"
          description="Ajuste os filtros de pesquisa para encontrar logs de auditoria."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[150px]">Data & Hora</TableHead>
                  <TableHead>Autor (Role)</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="min-w-[200px]">Descrição Resumida</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map(log => {
                  const dateObj = new Date(log.created_at)
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {dateObj.toLocaleDateString('pt-PT')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> 
                            {dateObj.toLocaleTimeString('pt-PT')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[150px]" title={log.admin_name}>{log.admin_name}</span>
                          <span className="text-xs text-muted-foreground uppercase">{log.admin_role}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.module}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate max-w-[200px] block" title={log.description}>
                            {log.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(log)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AuditDetailsModal 
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
