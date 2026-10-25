import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ServiceRequestCard } from "@/components/dashboard/ServiceRequestCard";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { AcceptRequestModal } from "@/components/dashboard/modals/AcceptRequestModal";
import { RejectRequestModal } from "@/components/dashboard/modals/RejectRequestModal";
import { toast } from "sonner";

const allRequests = [
  { id: "req-101", serviceType: "Consulta Médica", date: "20 Jan 2026", time: "10:00", duration: "2h", modality: "presencial" as const, location: "Hospital Central", status: "pendente" as const, requesterName: "João Silva" },
  { id: "req-102", serviceType: "Reunião Empresarial", date: "22 Jan 2026", time: "14:00", duration: "3h", modality: "online" as const, status: "pendente" as const, requesterName: "Empresa ABC" },
  { id: "req-103", serviceType: "Audiência Jurídica", date: "18 Jan 2026", time: "09:00", duration: "4h", modality: "presencial" as const, location: "Tribunal", status: "confirmado" as const, requesterName: "Maria Costa" },
  { id: "req-104", serviceType: "Conferência Médica", date: "15 Jan 2026", time: "14:00", duration: "5h", modality: "online" as const, status: "concluido" as const, requesterName: "Hospital ABC" },
  { id: "req-105", serviceType: "Palestra Educacional", date: "10 Jan 2026", time: "10:00", duration: "2h", modality: "presencial" as const, location: "Universidade", status: "concluido" as const, requesterName: "ISPL" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "confirmado", label: "Confirmados" },
  { value: "concluido", label: "Concluídos" },
];

export default function InterpreterRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<typeof allRequests[0] | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const filteredRequests = allRequests.filter((req) => {
    const matchesSearch = req.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === "pendente");
  const confirmedRequests = filteredRequests.filter(r => r.status === "confirmado");
  const completedRequests = filteredRequests.filter(r => r.status === "concluido");

  const handleAccept = (request: typeof allRequests[0]) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  const handleReject = (request: typeof allRequests[0]) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const confirmAccept = () => {
    toast.success("Solicitação aceite com sucesso!");
    setShowAcceptModal(false);
    setSelectedRequest(null);
  };

  const confirmReject = (reason: string) => {
    toast.success("Solicitação recusada");
    setShowRejectModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitações"
        description="Gerencie as solicitações de serviços recebidas"
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar solicitações..."
        filters={[
          {
            name: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusFilters,
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
        }}
        hasActiveFilters={search !== "" || statusFilter !== "all"}
      />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmados ({confirmedRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({completedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem solicitações pendentes"
              description="Não há novas solicitações a aguardar resposta"
            />
          ) : (
            pendingRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                {...request}
                detailsLink={`/dashboard/interpreter/requests/${request.id}`}
                showActions
                onAccept={() => handleAccept(request)}
                onReject={() => handleReject(request)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem serviços confirmados"
              description="Não há serviços confirmados no momento"
            />
          ) : (
            confirmedRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                {...request}
                detailsLink={`/dashboard/interpreter/requests/${request.id}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem serviços concluídos"
              description="Os serviços concluídos aparecerão aqui"
            />
          ) : (
            completedRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                {...request}
                detailsLink={`/dashboard/interpreter/requests/${request.id}`}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <AcceptRequestModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={confirmAccept}
        request={selectedRequest}
      />

      <RejectRequestModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={confirmReject}
        request={selectedRequest}
      />
    </div>
  );
}
