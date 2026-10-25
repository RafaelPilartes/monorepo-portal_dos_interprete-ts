import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@portal-dos-interpretes/ui/components/card";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { StatsCard } from "@portal-dos-interpretes/ui/components/stats-card";
import { ServiceRequestCard } from "@portal-dos-interpretes/features/components/ServiceRequestCard";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import { Timeline } from "@portal-dos-interpretes/ui/components/timeline";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  ArrowRight,
  User,
  Star,
} from "lucide-react";

// Mock data
const stats = {
  total: 12,
  pending: 2,
  inProgress: 3,
  completed: 7,
};

const recentRequests = [
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
];

const upcomingServices = [
  {
    id: "1",
    date: "20 Jan",
    time: "10:00",
    service: "Consulta Médica",
    interpreter: "A confirmar",
  },
  {
    id: "2",
    date: "22 Jan",
    time: "14:00",
    service: "Reunião Empresarial",
    interpreter: "Maria Silva",
  },
];

const recentActivity = [
  {
    id: "1",
    title: "Solicitação REQ-003 concluída",
    description: "Serviço de interpretação em conferência finalizado com sucesso.",
    date: "Há 2 dias",
  },
  {
    id: "2",
    title: "Intérprete atribuído",
    description: "Maria Silva foi atribuída à solicitação REQ-002.",
    date: "Há 3 dias",
  },
  {
    id: "3",
    title: "Nova solicitação criada",
    description: "Solicitação REQ-001 submetida para análise.",
    date: "Há 5 dias",
  },
];

export default function RequesterOverview() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Bem-vindo, João!"
        description="Acompanhe as suas solicitações de serviços de interpretação."
        action={
          <Button asChild>
            <Link to="/requests/new">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Solicitações"
          value={stats.total}
          icon={FileText}
          description="Todas as solicitações"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          description="Aguardando atribuição"
        />
        <StatsCard
          title="Em Andamento"
          value={stats.inProgress}
          icon={AlertCircle}
          description="Serviços confirmados"
        />
        <StatsCard
          title="Concluídas"
          value={stats.completed}
          icon={CheckCircle2}
          description="Serviços finalizados"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Solicitações Recentes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/requests" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((request) => (
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
              title="Nenhuma solicitação"
              description="Você ainda não tem solicitações de serviços."
              action={
                <Button asChild>
                  <Link to="/requests/new">
                    <Plus className="h-4 w-4" />
                    Nova Solicitação
                  </Link>
                </Button>
              }
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximos Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs text-muted-foreground">{service.date.split(" ")[1]}</p>
                    <p className="font-bold text-lg">{service.date.split(" ")[0]}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{service.service}</p>
                    <p className="text-xs text-muted-foreground">{service.time}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {service.interpreter}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={recentActivity} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acções Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/requests/new">
                  <Plus className="h-4 w-4" />
                  Nova Solicitação
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/interpreters">
                  <User className="h-4 w-4" />
                  Ver Intérpretes
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/reviews">
                  <Star className="h-4 w-4" />
                  Minhas Avaliações
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
