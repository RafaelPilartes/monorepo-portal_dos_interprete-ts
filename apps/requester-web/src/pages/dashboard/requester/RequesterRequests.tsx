import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portal-dos-interpretes/ui/components/tabs";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { ServiceRequestCard } from "@portal-dos-interpretes/features/components/ServiceRequestCard";
import { FiltersBar } from "@portal-dos-interpretes/ui/components/filters-bar";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import { Plus, FileText } from "lucide-react";

// Mock data
const allRequests = [
  {
    id: "REQ-001",
    service: "Interpretação em Consulta Médica",
    date: "2024-01-20",
    time: "10:00",
    status: "pendente" as const,
    modality: "presencial" as const,
  },
  {
    id: "REQ-002",
    service: "Interpretação em Reunião Empresarial",
    date: "2024-01-18",
    time: "14:00",
    status: "confirmado" as const,
    modality: "online" as const,
    interpreter: "Maria Silva",
  },
  {
    id: "REQ-003",
    service: "Interpretação em Conferência",
    date: "2024-01-15",
    time: "09:00",
    status: "concluido" as const,
    modality: "presencial" as const,
    interpreter: "Ana Beatriz",
  },
  {
    id: "REQ-004",
    service: "Interpretação em Aula Universitária",
    date: "2024-01-12",
    time: "08:00",
    status: "concluido" as const,
    modality: "presencial" as const,
    interpreter: "João Pedro",
  },
  {
    id: "REQ-005",
    service: "Interpretação em Evento Religioso",
    date: "2024-01-10",
    time: "10:00",
    status: "cancelado" as const,
    modality: "presencial" as const,
  },
];

export default function RequesterRequests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredRequests = allRequests.filter((request) => {
    const matchesSearch = request.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && request.status === "pendente";
    if (activeTab === "active") return matchesSearch && request.status === "confirmado";
    if (activeTab === "completed") return matchesSearch && request.status === "concluido";
    if (activeTab === "canceled") return matchesSearch && request.status === "cancelado";
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Solicitações"
        description="Gerencie todas as suas solicitações de serviços de interpretação."
        action={
          <Button asChild>
            <Link to="/requests/new">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        }
      />

      <FiltersBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Pesquisar por serviço ou ID..."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({allRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({allRequests.filter(r => r.status === "pendente").length})</TabsTrigger>
          <TabsTrigger value="active">Activas ({allRequests.filter(r => r.status === "confirmado").length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({allRequests.filter(r => r.status === "concluido").length})</TabsTrigger>
          <TabsTrigger value="canceled">Canceladas ({allRequests.filter(r => r.status === "cancelado").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  id={request.id}
                  serviceType={request.service}
                  date={request.date}
                  time={request.time}
                  duration="2 horas"
                  modality={request.modality}
                  status={request.status}
                  interpreterName={request.interpreter}
                  detailsLink={`/requests/${request.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhuma solicitação encontrada"
              description={
                searchQuery
                  ? "Tente ajustar os termos da pesquisa."
                  : "Você ainda não tem solicitações nesta categoria."
              }
              action={
                !searchQuery && (
                  <Button asChild>
                    <Link to="/requests/new">
                      <Plus className="h-4 w-4" />
                      Nova Solicitação
                    </Link>
                  </Button>
                )
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
