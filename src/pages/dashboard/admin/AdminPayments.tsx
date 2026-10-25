import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, Eye, Download } from "lucide-react";

const stats = [
  { title: "Total Pago", value: "2.450.000 Kz", icon: DollarSign, change: "Este mês" },
  { title: "Pagamentos Pendentes", value: "345.000 Kz", icon: Clock, change: "5 pagamentos" },
  { title: "Taxa Média/Serviço", value: "15.000 Kz", icon: TrendingUp, change: "+5% vs mês anterior" },
  { title: "Intérpretes Pagos", value: "42", icon: CheckCircle, change: "Este mês" },
];

const payments = [
  { id: "1", interpreter: "Maria Santos", amount: "45.000 Kz", services: 3, status: "pending", period: "Jan 2026" },
  { id: "2", interpreter: "João Oliveira", amount: "60.000 Kz", services: 4, status: "pending", period: "Jan 2026" },
  { id: "3", interpreter: "Ana Costa", amount: "75.000 Kz", services: 5, status: "completed", period: "Dez 2025" },
  { id: "4", interpreter: "Carlos Mendes", amount: "30.000 Kz", services: 2, status: "completed", period: "Dez 2025" },
  { id: "5", interpreter: "Sofia Almeida", amount: "90.000 Kz", services: 6, status: "completed", period: "Dez 2025" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "completed", label: "Concluídos" },
];

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.interpreter.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Pagamentos"
        description="Controle os pagamentos aos intérpretes"
        action={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.change}
          />
        ))}
      </div>

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar intérprete..."
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

      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum pagamento encontrado"
          description="Ajuste os filtros para encontrar pagamentos"
        />
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.interpreter}</h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.services} serviços • {payment.period}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">{payment.amount}</p>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status === "completed" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                      {payment.status === "pending" && (
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" /> Processar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
