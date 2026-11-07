import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { FiltersBar } from "@portal-dos-interpretes/ui/components/filters-bar";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import { Card, CardContent } from "@portal-dos-interpretes/ui/components/card";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@portal-dos-interpretes/ui/components/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@portal-dos-interpretes/ui/components/dialog";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Shield,
  Calendar,
  Mail,
  CreditCard,
  Pause,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

import { VerificationStatus, InterpreterVerification, mockInterpreterVerifications as mockVerifications } from '@portal-dos-interpretes/features/mocks/verificationMocks';

const statusFilters = [
  { name: "all", label: "Todos" },
  { name: "active", label: "Ativos" },
  { name: "pending", label: "Pendentes" },
  { name: "expired", label: "Expirados" },
  { name: "suspended", label: "Suspensos" },
];

export default function AdminInterpreterVerifications() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInterpreter, setSelectedInterpreter] = useState<InterpreterVerification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const filteredVerifications = mockVerifications.filter((v) => {
    const matchesSearch = 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: VerificationStatus) => {
    const config = {
      active: { label: "Ativo", className: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
      pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/30", icon: Clock },
      expired: { label: "Expirado", className: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
      rejected: { label: "Rejeitado", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
      suspended: { label: "Suspenso", className: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: Pause },
    };
    const { label, className, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleApprove = () => {
    if (selectedInterpreter) {
      toast.success(`Verificação aprovada para ${selectedInterpreter.name}`);
      setShowApproveModal(false);
      setSelectedInterpreter(null);
    }
  };

  const handleReject = () => {
    if (selectedInterpreter && rejectReason) {
      toast.success(`Verificação rejeitada para ${selectedInterpreter.name}`);
      setShowRejectModal(false);
      setSelectedInterpreter(null);
      setRejectReason("");
    }
  };

  const handleSuspend = () => {
    if (selectedInterpreter && suspendReason) {
      toast.success(`Verificação suspensa para ${selectedInterpreter.name}`);
      setShowSuspendModal(false);
      setSelectedInterpreter(null);
      setSuspendReason("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Verificações"
        description="Gerencie o status de verificação dos intérpretes"
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar intérpretes..."
        filters={[
          {
            name: "Estado",
            value: statusFilter,
            options: statusFilters.map(f => ({ value: f.name, label: f.label })),
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={statusFilter !== "all" || search !== ""}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {filteredVerifications.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Nenhuma verificação encontrada"
          description="Não existem verificações que correspondam aos filtros selecionados."
        />
      ) : (
        <div className="grid gap-4">
          {filteredVerifications.map((interpreter) => (
            <Card key={interpreter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={interpreter.photo} alt={interpreter.name} />
                    <AvatarFallback>{interpreter.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{interpreter.name}</h3>
                      {getStatusBadge(interpreter.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {interpreter.email}
                      </span>
                      {interpreter.last_payment_date && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          Último: {format(new Date(interpreter.last_payment_date), "dd MMM yyyy", { locale: pt })}
                        </span>
                      )}
                      {interpreter.expiration_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expira: {format(new Date(interpreter.expiration_date), "dd MMM yyyy", { locale: pt })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInterpreter(interpreter);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {interpreter.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedInterpreter(interpreter);
                            setShowApproveModal(true);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedInterpreter(interpreter);
                            setShowRejectModal(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {interpreter.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => {
                          setSelectedInterpreter(interpreter);
                          setShowSuspendModal(true);
                        }}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Suspender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Verificação</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a verificação do intérprete
            </DialogDescription>
          </DialogHeader>
          {selectedInterpreter && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedInterpreter.photo} alt={selectedInterpreter.name} />
                  <AvatarFallback>{selectedInterpreter.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedInterpreter.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedInterpreter.email}</p>
                </div>
              </div>
              
              <div className="grid gap-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Estado</span>
                  {getStatusBadge(selectedInterpreter.status)}
                </div>
                {selectedInterpreter.last_payment_amount && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Valor do Plano</span>
                    <span className="font-medium">{selectedInterpreter.last_payment_amount.toLocaleString('pt-AO')} Kz/mês</span>
                  </div>
                )}
                {selectedInterpreter.last_payment_date && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Último Pagamento</span>
                    <span>{format(new Date(selectedInterpreter.last_payment_date), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</span>
                  </div>
                )}
                {selectedInterpreter.expiration_date && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Data de Expiração</span>
                    <span>{format(new Date(selectedInterpreter.expiration_date), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</span>
                  </div>
                )}
                {selectedInterpreter.payment_proof && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Comprovativo</span>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      {selectedInterpreter.payment_proof}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fechar
            </Button>
            <Button onClick={() => navigate(`/interpreters/${selectedInterpreter?.id}`)}>
              Ver Perfil Completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Verificação</DialogTitle>
            <DialogDescription>
              Confirma a aprovação da verificação para {selectedInterpreter?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Ao aprovar, o intérprete receberá o badge de verificado e terá acesso aos benefícios premium por 30 dias.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar Verificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Verificação</DialogTitle>
            <DialogDescription>
              Indique o motivo da rejeição para {selectedInterpreter?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender Verificação</DialogTitle>
            <DialogDescription>
              Indique o motivo da suspensão para {selectedInterpreter?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Motivo da Suspensão</Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Descreva o motivo da suspensão..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="outline" 
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleSuspend} 
              disabled={!suspendReason}
            >
              <Pause className="h-4 w-4 mr-2" />
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
