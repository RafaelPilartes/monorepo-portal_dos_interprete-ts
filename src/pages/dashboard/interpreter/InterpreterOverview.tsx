import { StatsCard } from "@/components/dashboard/StatsCard";
import { ServiceRequestCard } from "@/components/dashboard/ServiceRequestCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, Star, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const pendingRequests = [
  {
    id: "req-101",
    serviceType: "Consulta Médica",
    date: "20 Jan 2026",
    time: "10:00",
    duration: "2h",
    modality: "presencial" as const,
    location: "Hospital Central",
    status: "pendente" as const,
    requesterName: "João Silva",
  },
  {
    id: "req-102",
    serviceType: "Reunião Empresarial",
    date: "22 Jan 2026",
    time: "14:00",
    duration: "3h",
    modality: "online" as const,
    status: "pendente" as const,
    requesterName: "Empresa ABC",
  },
];

const upcomingServices = [
  { id: "srv-1", service: "Audiência Jurídica", date: "18 Jan 2026", time: "09:00", location: "Tribunal de Luanda" },
  { id: "srv-2", service: "Conferência Médica", date: "19 Jan 2026", time: "14:00", location: "Online - Zoom" },
];

export default function InterpreterOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Olá, Maria!"
        description="Gerencie as suas solicitações e acompanhe os seus ganhos"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Novas Solicitações" value={2} icon={FileText} trend={{ value: 10, isPositive: true }} />
        <StatsCard title="Serviços Confirmados" value={5} icon={Clock} />
        <StatsCard title="Concluídos (Mês)" value={12} icon={CheckCircle} trend={{ value: 20, isPositive: true }} />
        <StatsCard title="Avaliação Média" value="4.9" icon={Star} />
      </div>

      {/* Earnings Summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ganhos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">150.000 Kz</span>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15% vs mês anterior
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Serviços realizados</span>
                  <p className="font-medium">12</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Horas trabalhadas</span>
                  <p className="font-medium">32h</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/interpreter/earnings">Ver Detalhes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{service.service}</p>
                    <p className="text-sm text-muted-foreground">{service.date}, {service.time}</p>
                    <p className="text-sm text-muted-foreground">{service.location}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/interpreter/schedule">Ver Agenda Completa</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Solicitações Pendentes</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/interpreter/requests">Ver todas</Link>
          </Button>
        </div>
        {pendingRequests.map((request) => (
          <ServiceRequestCard
            key={request.id}
            {...request}
            detailsLink={`/dashboard/interpreter/requests/${request.id}`}
            showActions
            onAccept={() => console.log("Accept", request.id)}
            onReject={() => console.log("Reject", request.id)}
          />
        ))}
      </div>
    </div>
  );
}
