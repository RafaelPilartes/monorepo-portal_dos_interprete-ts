import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Shield,
  Star,
  Users,
  TrendingUp,
  CreditCard,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { RequestVerificationModal } from "@/components/dashboard/modals/RequestVerificationModal";
import { VerificationRequestDetailsModal } from "@/components/dashboard/modals/VerificationRequestDetailsModal";

// Types
type VerificationProfileStatus = "verified" | "pending_payment" | "not_verified" | "expired";
import { RequestStatus, VerificationRequest, mockRequestsForInterpreter as mockRequests } from '@/core/mocks/verificationMocks';

const planBenefits = [
  { icon: Shield, text: "Badge de verificado no perfil público" },
  { icon: Star, text: "Maior destaque na listagem de intérpretes" },
  { icon: Users, text: "Prioridade em solicitações abertas" },
  { icon: TrendingUp, text: "Mais confiança para solicitantes" },
];

const statusFilters = [
  { value: "all", label: "Todos os Estados" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "expired", label: "Expirados" },
];

export default function InterpreterVerification() {
  // State
  const [verificationStatus] = useState<VerificationProfileStatus>("verified");
  const [expirationDate] = useState<Date>(new Date("2024-02-28"));
  const [isLoading] = useState(false);
  
  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isRenewal, setIsRenewal] = useState(false);
  
  // Table states
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getStatusConfig = (status: VerificationProfileStatus) => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle2,
          label: "Verificado",
          color: "bg-success text-success-foreground",
          description: "O seu perfil está verificado e visível com destaque para os solicitantes.",
        };
      case "pending_payment":
        return {
          icon: Clock,
          label: "Pagamento Pendente",
          color: "bg-warning text-warning-foreground",
          description: "Aguardando confirmação do pagamento pela equipa administrativa.",
        };
      case "not_verified":
        return {
          icon: XCircle,
          label: "Não Verificado",
          color: "bg-muted text-muted-foreground",
          description: "Solicite a verificação para aumentar a sua visibilidade e credibilidade.",
        };
      case "expired":
        return {
          icon: AlertTriangle,
          label: "Expirado",
          color: "bg-destructive text-destructive-foreground",
          description: "A sua verificação expirou. Renove para manter o status verificado.",
        };
    }
  };

  const getRequestStatusBadge = (status: RequestStatus) => {
    const config = {
      pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/30", icon: Clock },
      approved: { label: "Aprovado", className: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
      rejected: { label: "Rejeitado", className: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
      expired: { label: "Expirado", className: "bg-muted text-muted-foreground border-border", icon: AlertTriangle },
    };
    const { label, className, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const statusConfig = getStatusConfig(verificationStatus);
  const StatusIcon = statusConfig.icon;

  // Filter requests
  const filteredRequests = mockRequests.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRequestVerification = (renewal = false) => {
    setIsRenewal(renewal);
    setShowRequestModal(true);
  };

  const handleViewDetails = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verificação"
        description="Gerencie o seu estado de verificação e aumente a sua visibilidade"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Estado Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className={`rounded-xl p-4 ${statusConfig.color}`}>
                  <div className="flex items-center gap-3">
                    <StatusIcon className="h-8 w-8" />
                    <div>
                      <p className="font-bold text-lg">{statusConfig.label}</p>
                      {verificationStatus === "verified" && expirationDate && (
                        <p className="text-sm opacity-90">
                          Válido até {format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{statusConfig.description}</p>

                {verificationStatus === "verified" ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleRequestVerification(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renovar Verificação
                  </Button>
                ) : verificationStatus === "expired" ? (
                  <Button 
                    className="w-full"
                    onClick={() => handleRequestVerification(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Renovar Agora
                  </Button>
                ) : verificationStatus === "not_verified" ? (
                  <Button 
                    className="w-full"
                    onClick={() => handleRequestVerification(false)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Solicitar Verificação
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Aguardando Confirmação
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Plano de Verificação Profissional
            </CardTitle>
            <CardDescription>
              Aumente a sua credibilidade e visibilidade na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-32" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">15.000</span>
                  <span className="text-lg text-muted-foreground">Kz/mês</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {planBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <benefit.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Nota:</strong> O pagamento não ativa automaticamente a verificação. 
                    Após o pagamento, a nossa equipa irá analisar e confirmar a sua verificação em até 48 horas.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Requests History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Histórico de Pedidos
              </CardTitle>
              <CardDescription>
                Acompanhe todos os seus pedidos de verificação
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "Não há pedidos com o estado selecionado."
                  : "Ainda não submeteu nenhum pedido de verificação."}
              </p>
              {statusFilter === "all" && verificationStatus === "not_verified" && (
                <Button
                  className="mt-4"
                  onClick={() => handleRequestVerification(false)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Solicitar Verificação
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.id}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.request_date), "dd MMM yyyy", {
                            locale: pt,
                          })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {request.amount.toLocaleString("pt-AO")} Kz
                        </TableCell>
                        <TableCell>{getRequestStatusBadge(request.status as RequestStatus)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de{" "}
                    {filteredRequests.length} pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Modals */}
      <RequestVerificationModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        isRenewal={isRenewal}
      />

      <VerificationRequestDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        request={selectedRequest}
      />
    </div>
  );
}
