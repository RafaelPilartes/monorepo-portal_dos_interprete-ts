import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp, 
  Download,
  Calendar,
  PieChart,
} from "lucide-react";
import { useState } from "react";

const stats = [
  { title: "Total de Serviços", value: "1,247", icon: FileText, change: "+156 este mês" },
  { title: "Pessoas Impactadas", value: "3,892", icon: Users, change: "+423 este mês" },
  { title: "Taxa de Conclusão", value: "94.2%", icon: TrendingUp, change: "+2.1% vs mês anterior" },
  { title: "Avaliação Média", value: "4.8/5", icon: BarChart3, change: "Baseado em 847 avaliações" },
];

const servicesByCategory = [
  { category: "Saúde", count: 412, percentage: 33 },
  { category: "Educação", count: 324, percentage: 26 },
  { category: "Jurídico", count: 198, percentage: 16 },
  { category: "Eventos", count: 156, percentage: 13 },
  { category: "Religioso", count: 89, percentage: 7 },
  { category: "Outros", count: 68, percentage: 5 },
];

const monthlyData = [
  { month: "Jan", services: 89, users: 234 },
  { month: "Fev", services: 102, users: 267 },
  { month: "Mar", services: 118, users: 312 },
  { month: "Abr", services: 134, users: 356 },
  { month: "Mai", services: 145, users: 401 },
  { month: "Jun", services: 156, users: 445 },
];

export default function AdminReports() {
  const [period, setPeriod] = useState("month");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Impacto"
        description="Métricas e estatísticas da plataforma"
        action={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar Relatório
          </Button>
        }
      />

      {/* Period Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Período:</span>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Serviços por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servicesByCategory.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((item) => (
                <div key={item.month} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{item.month} 2026</span>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {item.services} serviços
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {item.users} utilizadores
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Impacto Social</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 rounded-lg bg-primary/10">
              <p className="text-4xl font-bold text-primary">3,892</p>
              <p className="text-muted-foreground mt-2">Pessoas surdas beneficiadas</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-primary/10">
              <p className="text-4xl font-bold text-primary">48</p>
              <p className="text-muted-foreground mt-2">Intérpretes ativos</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-primary/10">
              <p className="text-4xl font-bold text-primary">156</p>
              <p className="text-muted-foreground mt-2">Instituições parceiras</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
