import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Calendar, FileText, Download, Eye } from "lucide-react";
import { EarningsDetailsModal } from "@/components/dashboard/modals/EarningsDetailsModal";

const earningsData = [
  { id: "earn-1", service: "Audiência Jurídica", date: "15 Jan 2026", hours: 4, rate: 10000, total: 40000, status: "paid" },
  { id: "earn-2", service: "Conferência Médica", date: "12 Jan 2026", hours: 3, rate: 10000, total: 30000, status: "paid" },
  { id: "earn-3", service: "Reunião Empresarial", date: "10 Jan 2026", hours: 2, rate: 10000, total: 20000, status: "pending" },
  { id: "earn-4", service: "Consulta Médica", date: "8 Jan 2026", hours: 2, rate: 10000, total: 20000, status: "paid" },
  { id: "earn-5", service: "Palestra Educacional", date: "5 Jan 2026", hours: 3, rate: 10000, total: 30000, status: "paid" },
];

const monthlyTotals = [
  { month: "Janeiro 2026", total: 150000, services: 12 },
  { month: "Dezembro 2025", total: 130000, services: 10 },
  { month: "Novembro 2025", total: 145000, services: 11 },
];

export default function InterpreterEarnings() {
  const [period, setPeriod] = useState("month");
  const [selectedEarning, setSelectedEarning] = useState<typeof earningsData[0] | null>(null);

  const totalEarnings = earningsData.reduce((sum, e) => sum + e.total, 0);
  const pendingEarnings = earningsData.filter(e => e.status === "pending").reduce((sum, e) => sum + e.total, 0);
  const totalHours = earningsData.reduce((sum, e) => sum + e.hours, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ganhos"
        description="Acompanhe os seus rendimentos e histórico de pagamentos"
        action={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total (Mês)" value={formatCurrency(totalEarnings)} icon={DollarSign} trend={{ value: 15, isPositive: true }} />
        <StatsCard title="Pendente" value={formatCurrency(pendingEarnings)} icon={Calendar} />
        <StatsCard title="Horas Trabalhadas" value={`${totalHours}h`} icon={TrendingUp} />
        <StatsCard title="Serviços" value={earningsData.length} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Ganhos</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earningsData.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">{earning.service}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{earning.date}</span>
                      <span>{earning.hours}h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(earning.total)}</p>
                      <Badge variant={earning.status === "paid" ? "default" : "secondary"}>
                        {earning.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedEarning(earning)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTotals.map((month, index) => (
                <div key={month.month} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{month.month}</span>
                    {index === 0 && <Badge>Atual</Badge>}
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(month.total)}</p>
                  <p className="text-sm text-muted-foreground">{month.services} serviços</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <EarningsDetailsModal
        isOpen={!!selectedEarning}
        onClose={() => setSelectedEarning(null)}
        earning={selectedEarning}
      />
    </div>
  );
}
