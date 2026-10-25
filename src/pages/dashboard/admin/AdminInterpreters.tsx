import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Star, MapPin, Eye, CheckCircle, XCircle } from "lucide-react";
import { ApproveInterpreterModal } from "@/components/dashboard/modals/ApproveInterpreterModal";
import { RejectInterpreterModal } from "@/components/dashboard/modals/RejectInterpreterModal";
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

const interpreters = [
  { id: "1", name: "Maria Santos", email: "maria@email.com", avatar: "", specialties: ["Saúde", "Jurídico"], status: "pending" as const, rating: 0, location: "Luanda", services: 0, date: "15 Jan 2026" },
  { id: "2", name: "João Oliveira", email: "joao@email.com", avatar: "", specialties: ["Educação", "Eventos"], status: "approved" as const, rating: 4.8, location: "Benguela", services: 45, date: "10 Jan 2026" },
  { id: "3", name: "Ana Costa", email: "ana@email.com", avatar: "", specialties: ["Religioso", "Saúde"], status: "approved" as const, rating: 4.9, location: "Luanda", services: 78, date: "05 Jan 2026" },
  { id: "4", name: "Carlos Mendes", email: "carlos@email.com", avatar: "", specialties: ["Jurídico"], status: "pending" as const, rating: 0, location: "Huambo", services: 0, date: "14 Jan 2026" },
  { id: "5", name: "Sofia Almeida", email: "sofia@email.com", avatar: "", specialties: ["Educação", "Eventos"], status: "suspended" as const, rating: 3.2, location: "Lubango", services: 12, date: "01 Jan 2026" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "suspended", label: "Suspensos" },
];

export default function AdminInterpreters() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInterpreter, setSelectedInterpreter] = useState<typeof interpreters[0] | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInterpreters = interpreters.filter((interpreter) => {
    const matchesSearch = interpreter.name.toLowerCase().includes(search.toLowerCase()) ||
      interpreter.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || interpreter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInterpreters.length / itemsPerPage);
  const paginatedInterpreters = filteredInterpreters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = (interpreter: typeof interpreters[0]) => {
    setSelectedInterpreter(interpreter);
    setShowApproveModal(true);
  };

  const handleReject = (interpreter: typeof interpreters[0]) => {
    setSelectedInterpreter(interpreter);
    setShowRejectModal(true);
  };

  const handleSuspend = (interpreter: typeof interpreters[0]) => {
    setSelectedInterpreter(interpreter);
    setShowSuspensionModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <StatusBadge status="pending" />;
      case "approved":
        return <StatusBadge status="confirmed" />;
      case "suspended":
        return <StatusBadge status="canceled" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Intérpretes"
        description="Aprove, gerencie e monitore os intérpretes da plataforma"
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar intérpretes..."
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
          setCurrentPage(1);
        }}
        hasActiveFilters={search !== "" || statusFilter !== "all"}
      />

      {filteredInterpreters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum intérprete encontrado"
          description="Ajuste os filtros para encontrar intérpretes"
        />
      ) : (
        <div className="grid gap-4">
          {paginatedInterpreters.map((interpreter) => (
            <Card key={interpreter.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={interpreter.avatar} />
                      <AvatarFallback>{interpreter.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{interpreter.name}</h3>
                        {getStatusBadge(interpreter.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{interpreter.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {interpreter.location}
                        </span>
                        {interpreter.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {interpreter.rating}
                          </span>
                        )}
                        <span>{interpreter.services} serviços</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {interpreter.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/admin/interpreters/${interpreter.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Link>
                    </Button>
                    {interpreter.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(interpreter)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(interpreter)}>
                          <XCircle className="h-4 w-4 mr-1" /> Recusar
                        </Button>
                      </>
                    )}
                    {interpreter.status === "approved" && (
                      <Button variant="outline" size="sm" onClick={() => handleSuspend(interpreter)}>
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

      <ApproveInterpreterModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => {
          toast.success("Intérprete aprovado com sucesso!");
          setShowApproveModal(false);
        }}
        interpreter={selectedInterpreter}
      />

      <RejectInterpreterModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={(reason) => {
          toast.success("Intérprete recusado");
          setShowRejectModal(false);
        }}
        interpreter={selectedInterpreter}
      />

      <UserSuspensionModal
        open={showSuspensionModal}
        onOpenChange={setShowSuspensionModal}
        onConfirm={(reason) => {
          toast.success("Utilizador suspenso");
          setShowSuspensionModal(false);
        }}
        userName={selectedInterpreter?.name || ""}
      />
    </div>
  );
}
