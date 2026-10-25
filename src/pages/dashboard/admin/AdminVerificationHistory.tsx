import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

import { HistoryStatus, VerificationHistoryItem, mockHistory } from '@/core/mocks/verificationMocks';

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "expired", label: "Expirados" },
  { value: "suspended", label: "Suspensos" },
];

const monthFilters = [
  { value: "all", label: "Todos os Meses" },
  { value: "01-2024", label: "Janeiro 2024" },
  { value: "12-2023", label: "Dezembro 2023" },
  { value: "11-2023", label: "Novembro 2023" },
];

export default function AdminVerificationHistory() {
  const [isLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter history
  const filteredHistory = mockHistory.filter((item) => {
    const matchesSearch =
      item.interpreter_name.toLowerCase().includes(search.toLowerCase()) ||
      item.interpreter_email.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: HistoryStatus) => {
    const config = {
      approved: { label: "Aprovado", className: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
      rejected: { label: "Rejeitado", className: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
      expired: { label: "Expirado", className: "bg-muted text-muted-foreground border-border", icon: AlertTriangle },
      suspended: { label: "Suspenso", className: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: Clock },
    };
    const { label, className, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleExport = (type: "csv" | "pdf") => {
    toast.success(`Exportação ${type.toUpperCase()} iniciada`, {
      description: "O ficheiro será descarregado em breve.",
    });
  };

  // Calculate totals
  const totals = {
    approved: mockHistory.filter((h) => h.status === "approved").length,
    rejected: mockHistory.filter((h) => h.status === "rejected").length,
    revenue: mockHistory
      .filter((h) => h.status === "approved")
      .reduce((sum, h) => sum + h.amount, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Verificações"
        description="Visualize todo o histórico financeiro de verificações"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.approved}</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
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
                <p className="text-2xl font-bold">{totals.revenue.toLocaleString("pt-AO")} Kz</p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
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
            name: "Estado",
            value: statusFilter,
            options: statusFilters,
            onChange: setStatusFilter,
          },
          {
            name: "Período",
            value: monthFilter,
            options: monthFilters,
            onChange: setMonthFilter,
          },
        ]}
        hasActiveFilters={statusFilter !== "all" || monthFilter !== "all" || search !== ""}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setMonthFilter("all");
        }}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Shield}
                title="Nenhum registo encontrado"
                description="Não existem registos que correspondam aos filtros selecionados."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intérprete</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data do Pedido</TableHead>
                      <TableHead>Processado em</TableHead>
                      <TableHead>Por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={item.interpreter_photo} alt={item.interpreter_name} />
                              <AvatarFallback>{item.interpreter_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{item.interpreter_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.id}</TableCell>
                        <TableCell className="font-semibold">
                          {item.amount.toLocaleString("pt-AO")} Kz
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {format(new Date(item.request_date), "dd MMM yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.processed_date), "dd MMM yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.processed_by}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download Comprovativo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredHistory.length)} de{" "}
                    {filteredHistory.length} registos
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
                      {currentPage} / {totalPages}
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
    </div>
  );
}
