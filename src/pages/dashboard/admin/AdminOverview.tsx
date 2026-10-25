import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const stats = [
  { title: "Total Intérpretes", value: "48", icon: Users, change: "+5 este mês" },
  { title: "Solicitantes Ativos", value: "156", icon: UserCheck, change: "+12 este mês" },
  { title: "Serviços este mês", value: "89", icon: FileText, change: "+23% vs mês anterior" },
  { title: "Taxa de Conclusão", value: "94%", icon: TrendingUp, change: "+2% vs mês anterior" },
];

const pendingInterpreters = [
  { id: "1", name: "Ana Ferreira", email: "ana@email.com", date: "15 Jan 2026" },
  { id: "2", name: "Carlos Mendes", email: "carlos@email.com", date: "14 Jan 2026" },
  { id: "3", name: "Sofia Almeida", email: "sofia@email.com", date: "13 Jan 2026" },
];

const recentRequests = [
  { id: "req-201", service: "Consulta Médica", requester: "João Silva", status: "pending" as const, date: "16 Jan 2026" },
  { id: "req-202", service: "Reunião Empresarial", requester: "Empresa XYZ", status: "confirmed" as const, date: "16 Jan 2026" },
  { id: "req-203", service: "Audiência Jurídica", requester: "Maria Costa", status: "pending" as const, date: "15 Jan 2026" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Administrativo"
        description="Visão geral da plataforma"
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Interpreters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Intérpretes Pendentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/admin/interpreters?status=pending">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInterpreters.map((interpreter) => (
                <div key={interpreter.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{interpreter.name}</p>
                    <p className="text-sm text-muted-foreground">{interpreter.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{interpreter.date}</span>
                    <Button size="sm" asChild>
                      <Link to={`/dashboard/admin/interpreters/${interpreter.id}`}>
                        Analisar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Solicitações Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/admin/requests">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{request.service}</p>
                    <p className="text-sm text-muted-foreground">{request.requester}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} />
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/dashboard/admin/requests/${request.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/admin/interpreters?status=pending">
                <AlertCircle className="h-6 w-6" />
                <span>Aprovar Intérpretes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/admin/requests?status=pending">
                <Clock className="h-6 w-6" />
                <span>Atribuir Serviços</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/admin/testimonials">
                <CheckCircle className="h-6 w-6" />
                <span>Gerir Testemunhos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/admin/reports">
                <TrendingUp className="h-6 w-6" />
                <span>Ver Relatórios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
