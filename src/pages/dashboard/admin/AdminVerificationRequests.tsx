import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FiltersBar } from '@/components/dashboard/FiltersBar'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Shield,
  Mail,
  Pause,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  History,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'

import {
  VerificationStatus,
  VerificationRequest,
  mockVerificationRequests
} from '@/core/mocks/verificationMocks'

const statusFilters = [
  { name: 'all', label: 'Todos' },
  { name: 'pending', label: 'Pendentes' },
  { name: 'active', label: 'Ativos' },
  { name: 'rejected', label: 'Rejeitados' },
  { name: 'expired', label: 'Expirados' },
  { name: 'suspended', label: 'Suspensos' }
]

const planFilters = [
  { value: 'all', label: 'Todos os Planos' },
  { value: 'professional', label: 'Profissional' }
]

export default function AdminVerificationRequests() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)

  // Form states
  const [rejectReason, setRejectReason] = useState('')
  const [suspendReason, setSuspendReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter requests
  const filteredRequests = mockVerificationRequests.filter(r => {
    const matchesSearch =
      r.interpreter_name.toLowerCase().includes(search.toLowerCase()) ||
      r.interpreter_email.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusBadge = (status: VerificationStatus) => {
    const config = {
      active: {
        label: 'Ativo',
        className: 'bg-success/10 text-success border-success/30',
        icon: CheckCircle2
      },
      pending: {
        label: 'Pendente',
        className: 'bg-warning/10 text-warning border-warning/30',
        icon: Clock
      },
      expired: {
        label: 'Expirado',
        className: 'bg-destructive/10 text-destructive border-destructive/30',
        icon: AlertTriangle
      },
      rejected: {
        label: 'Rejeitado',
        className: 'bg-muted text-muted-foreground border-border',
        icon: XCircle
      },
      suspended: {
        label: 'Suspenso',
        className: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
        icon: Pause
      }
    }
    const { label, className, icon: Icon } = config[status]
    return (
      <Badge
        variant="outline"
        className={`${className} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const handleApprove = async () => {
    if (!selectedRequest) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success(
      `Verificação aprovada para ${selectedRequest.interpreter_name}`,
      {
        description: 'O intérprete foi notificado por email.'
      }
    )
    setIsSubmitting(false)
    setShowApproveModal(false)
    setSelectedRequest(null)
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success(
      `Verificação rejeitada para ${selectedRequest.interpreter_name}`,
      {
        description: 'O intérprete foi notificado por email.'
      }
    )
    setIsSubmitting(false)
    setShowRejectModal(false)
    setSelectedRequest(null)
    setRejectReason('')
  }

  const handleSuspend = async () => {
    if (!selectedRequest || !suspendReason) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success(
      `Verificação suspensa para ${selectedRequest.interpreter_name}`,
      {
        description: 'O intérprete foi notificado por email.'
      }
    )
    setIsSubmitting(false)
    setShowSuspendModal(false)
    setSelectedRequest(null)
    setSuspendReason('')
  }

  // Stats
  const stats = {
    pending: mockVerificationRequests.filter(r => r.status === 'pending')
      .length,
    active: mockVerificationRequests.filter(r => r.status === 'active').length,
    total: mockVerificationRequests.length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos de Verificação"
        description="Gerencie os pedidos de verificação dos intérpretes"
        action={
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/admin/verification-history')}
          >
            <History className="h-4 w-4 mr-2" />
            Ver Histórico Completo
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">
                  Total de Pedidos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome, email ou ID..."
        filters={[
          {
            name: 'Estado',
            value: statusFilter,
            options: statusFilters.map(f => ({
              value: f.name,
              label: f.label
            })),
            onChange: setStatusFilter
          },
          {
            name: 'Plano',
            value: planFilter,
            options: planFilters,
            onChange: setPlanFilter
          }
        ]}
        hasActiveFilters={
          statusFilter !== 'all' || planFilter !== 'all' || search !== ''
        }
        onClearFilters={() => {
          setSearch('')
          setStatusFilter('all')
          setPlanFilter('all')
        }}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Shield}
                title="Nenhum pedido encontrado"
                description="Não existem pedidos que correspondam aos filtros selecionados."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intérprete</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data do Pedido</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={request.interpreter_photo}
                                alt={request.interpreter_name}
                              />
                              <AvatarFallback>
                                {request.interpreter_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {request.interpreter_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.interpreter_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{request.plan}</TableCell>
                        <TableCell className="font-semibold">
                          {request.amount.toLocaleString('pt-AO')} Kz
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status as VerificationStatus)}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(request.request_date),
                            'dd MMM yyyy',
                            { locale: pt }
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowDetailsModal(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-success hover:text-success"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setShowApproveModal(true)
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setShowRejectModal(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {request.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-600"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setShowSuspendModal(true)
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredRequests.length
                    )}{' '}
                    de {filteredRequests.length} pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Detalhes do Pedido
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.id} • {selectedRequest?.plan}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Interpreter Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Intérprete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedRequest.interpreter_photo}
                        alt={selectedRequest.interpreter_name}
                      />
                      <AvatarFallback>
                        {selectedRequest.interpreter_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedRequest.interpreter_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(
                            selectedRequest.status as VerificationStatus
                          )}
                          {selectedRequest.previous_verifications > 0 && (
                            <Badge variant="secondary">
                              {selectedRequest.previous_verifications}{' '}
                              verificações anteriores
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {selectedRequest.interpreter_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {selectedRequest.interpreter_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Details */}
              <div className="grid gap-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{selectedRequest.plan}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-primary">
                    {selectedRequest.amount.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Data do Pedido</span>
                  <span>
                    {format(
                      new Date(selectedRequest.request_date),
                      "dd 'de' MMMM 'de' yyyy, HH:mm",
                      {
                        locale: pt
                      }
                    )}
                  </span>
                </div>
                {selectedRequest.last_verification_date && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      Última Verificação
                    </span>
                    <span>
                      {format(
                        new Date(selectedRequest.last_verification_date),
                        'dd MMM yyyy',
                        {
                          locale: pt
                        }
                      )}
                    </span>
                  </div>
                )}
                {selectedRequest.expiration_date && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Expira em</span>
                    <span>
                      {format(
                        new Date(selectedRequest.expiration_date),
                        'dd MMM yyyy',
                        {
                          locale: pt
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Proof */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Comprovativo de Pagamento
                </h4>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedRequest.payment_proof}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Documento PDF
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Observações do Intérprete</h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {selectedRequest.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Fechar
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowRejectModal(true)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowApproveModal(true)
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
            {selectedRequest?.status === 'active' && (
              <Button
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => {
                  setShowDetailsModal(false)
                  setShowSuspendModal(true)
                }}
              >
                <Pause className="h-4 w-4 mr-2" />
                Suspender
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Aprovar Verificação
            </DialogTitle>
            <DialogDescription>
              Confirma a aprovação da verificação para{' '}
              {selectedRequest?.interpreter_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-4 bg-success/5 border-success/20">
              <p className="text-sm">Ao aprovar, o intérprete:</p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li>Receberá o badge de verificado</li>
                <li>Terá maior destaque na listagem</li>
                <li>A verificação será válida por 30 dias</li>
                <li>Será notificado por email</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />A aprovar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Verificação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeitar Verificação
            </DialogTitle>
            <DialogDescription>
              Indique o motivo da rejeição para{' '}
              {selectedRequest?.interpreter_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                Motivo da Rejeição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada ao intérprete por email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />A rejeitar...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Pause className="h-5 w-5" />
              Suspender Verificação
            </DialogTitle>
            <DialogDescription>
              Indique o motivo da suspensão para{' '}
              {selectedRequest?.interpreter_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">
                Motivo da Suspensão <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Descreva o motivo da suspensão..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada ao intérprete por email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleSuspend}
              disabled={!suspendReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />A
                  suspender...
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Suspender
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
