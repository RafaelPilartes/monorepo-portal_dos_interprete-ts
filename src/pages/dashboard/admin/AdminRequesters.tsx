import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { UserCheck, MapPin, FileText, Eye, Ban } from "lucide-react";
import { UserSuspensionModal } from "@/components/dashboard/modals/UserSuspensionModal";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const requesters = [
  { id: "1", name: "João Silva", email: "joao@email.com", avatar: "", type: "individual", location: "Luanda", requests: 12, status: "active" },
  { id: "2", name: "Empresa ABC", email: "contato@abc.ao", avatar: "", type: "institution", location: "Benguela", requests: 45, status: "active" },
  { id: "3", name: "Maria Costa", email: "maria@email.com", avatar: "", type: "individual", location: "Luanda", requests: 8, status: "active" },
  { id: "4", name: "Hospital Central", email: "admin@hc.ao", avatar: "", type: "institution", location: "Luanda", requests: 156, status: "active" },
  { id: "5", name: "Pedro Santos", email: "pedro@email.com", avatar: "", type: "individual", location: "Huambo", requests: 3, status: "suspended" },
];

const typeFilters = [
  { value: "all", label: "Todos" },
  { value: "individual", label: "Individuais" },
  { value: "institution", label: "Instituições" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "suspended", label: "Suspensos" },
];

export default function AdminRequesters() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedRequester, setSelectedRequester] = useState<typeof requesters[0] | null>(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  const filteredRequesters = requesters.filter((requester) => {
    const matchesSearch = requester.name.toLowerCase().includes(search.toLowerCase()) ||
      requester.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || requester.type === typeFilter;
    const matchesStatus = statusFilter === "all" || requester.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequesters.length / itemsPerPage);
  const paginatedRequesters = filteredRequesters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSuspend = (requester: typeof requesters[0]) => {
    setSelectedRequester(requester);
    setShowSuspensionModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Solicitantes"
        description="Visualize e gerencie os solicitantes da plataforma"
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar solicitantes..."
        filters={[
          {
            name: "type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: typeFilters,
          },
          {
            name: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusFilters,
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setTypeFilter("all");
          setStatusFilter("all");
          setCurrentPage(1);
        }}
        hasActiveFilters={search !== "" || typeFilter !== "all" || statusFilter !== "all"}
      />

      {filteredRequesters.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nenhum solicitante encontrado"
          description="Ajuste os filtros para encontrar solicitantes"
        />
      ) : (
        <div className="grid gap-4">
          {paginatedRequesters.map((requester) => (
            <Card key={requester.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={requester.avatar} />
                      <AvatarFallback>{requester.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{requester.name}</h3>
                        <Badge variant={requester.type === "institution" ? "default" : "secondary"}>
                          {requester.type === "institution" ? "Instituição" : "Individual"}
                        </Badge>
                        {requester.status === "suspended" && (
                          <Badge variant="destructive">Suspenso</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{requester.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {requester.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {requester.requests} solicitações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/admin/requesters/${requester.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Link>
                    </Button>
                    {requester.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => handleSuspend(requester)}>
                        <Ban className="h-4 w-4 mr-1" /> Suspender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <UserSuspensionModal
        open={showSuspensionModal}
        onOpenChange={setShowSuspensionModal}
        onConfirm={(reason) => {
          toast.success("Utilizador suspenso");
          setShowSuspensionModal(false);
        }}
        userName={selectedRequester?.name || ""}
      />
    </div>
  );
}
