import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { ServiceRequestCard } from "@/components/dashboard/ServiceRequestCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { RequestStatusModal } from "@/components/dashboard/modals/RequestStatusModal";
import { toast } from "sonner";

type RequestStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

const allRequests: Array<{
  id: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  modality: "presencial" | "online";
  location?: string;
  status: RequestStatus;
  requesterName: string;
  interpreterName?: string;
}> = [
  { id: "req-301", serviceType: "Consulta Médica", date: "20 Jan 2026", time: "10:00", duration: "2h", modality: "presencial", location: "Hospital Central", status: "pendente", requesterName: "João Silva" },
  { id: "req-302", serviceType: "Reunião Empresarial", date: "22 Jan 2026", time: "14:00", duration: "3h", modality: "online", status: "pendente", requesterName: "Empresa ABC" },
  { id: "req-303", serviceType: "Audiência Jurídica", date: "18 Jan 2026", time: "09:00", duration: "4h", modality: "presencial", location: "Tribunal", status: "confirmado", requesterName: "Maria Costa", interpreterName: "Ana Santos" },
  { id: "req-304", serviceType: "Conferência Médica", date: "15 Jan 2026", time: "14:00", duration: "5h", modality: "online", status: "concluido", requesterName: "Hospital ABC", interpreterName: "João Oliveira" },
  { id: "req-305", serviceType: "Palestra Educacional", date: "10 Jan 2026", time: "10:00", duration: "2h", modality: "presencial", location: "Universidade", status: "concluido", requesterName: "ISPL", interpreterName: "Maria Santos" },
  { id: "req-306", serviceType: "Consulta Psicológica", date: "08 Jan 2026", time: "16:00", duration: "1h", modality: "online", status: "cancelado", requesterName: "Pedro Alves" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "confirmado", label: "Confirmados" },
  { value: "concluido", label: "Concluídos" },
  { value: "cancelado", label: "Cancelados" },
];

export default function AdminRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<typeof allRequests[0] | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const filteredRequests = allRequests.filter((req) => {
    const matchesSearch = req.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === "pendente");
  const confirmedRequests = filteredRequests.filter(r => r.status === "confirmado");
  const completedRequests = filteredRequests.filter(r => r.status === "concluido");
  const canceledRequests = filteredRequests.filter(r => r.status === "cancelado");

  const handleStatusChange = (request: typeof allRequests[0]) => {
    setSelectedRequest(request);
    setShowStatusModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Solicitações"
        description="Monitore e atribua intérpretes às solicitações"
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
          <TabsTrigger value="canceled">Cancelados ({canceledRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem solicitações pendentes"
              description="Todas as solicitações foram atribuídas"
            />
          ) : (
            pendingRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                {...request}
                detailsLink={`/dashboard/admin/requests/${request.id}`}
                showActions
                onAccept={() => handleStatusChange(request)}
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
                detailsLink={`/dashboard/admin/requests/${request.id}`}
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
                detailsLink={`/dashboard/admin/requests/${request.id}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="canceled" className="space-y-4">
          {canceledRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem cancelamentos"
              description="Não há solicitações canceladas"
            />
          ) : (
            canceledRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                {...request}
                detailsLink={`/dashboard/admin/requests/${request.id}`}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <RequestStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        onConfirm={(status, interpreterId) => {
          toast.success("Estado da solicitação atualizado!");
          setShowStatusModal(false);
        }}
        request={selectedRequest}
      />
    </div>
  );
}
