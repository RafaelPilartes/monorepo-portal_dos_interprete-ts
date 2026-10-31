import { useState } from "react";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { ServiceRequestCard } from "@portal-dos-interpretes/features/components/ServiceRequestCard";
import { FiltersBar } from "@portal-dos-interpretes/ui/components/filters-bar";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portal-dos-interpretes/ui/components/select";
import { History, Filter } from "lucide-react";

// Mock data - completed and canceled requests
const historyRequests = [
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
  {
    id: "REQ-006",
    service: "Interpretação em Consulta Médica",
    date: "2024-01-05",
    time: "14:00",
    status: "concluido" as const,
    modality: "online" as const,
    interpreter: "Maria Silva",
  },
];

const periods = [
  { value: "all", label: "Todo o Período" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "90days", label: "Últimos 90 dias" },
  { value: "6months", label: "Últimos 6 meses" },
  { value: "1year", label: "Último ano" },
];

export default function RequestHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = historyRequests.filter((request) => {
    const matchesSearch = request.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Solicitações"
        description="Visualize o histórico completo das suas solicitações concluídas e canceladas."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FiltersBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Pesquisar no histórico..."
        />
        
        <div className="flex gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
          icon={History}
          title="Nenhum registo encontrado"
          description={
            searchQuery
              ? "Tente ajustar os termos da pesquisa."
              : "Você ainda não tem histórico de solicitações."
          }
        />
      )}
    </div>
  );
}
