import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Timeline } from "@/components/dashboard/Timeline";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText,
  Star,
  Ban,
  CheckCircle,
  Clock,
  Building2,
  User
} from "lucide-react";
import { useState } from "react";
import { UserSuspensionModal } from "@/components/dashboard/modals/UserSuspensionModal";
import { toast } from "sonner";

const requesterData = {
  id: "req-001",
  name: "João Silva",
  email: "joao.silva@email.com",
  phone: "+244 923 456 789",
  type: "individual" as const,
  organization: null,
  location: "Luanda, Angola",
  status: "active" as const,
  createdAt: "15 Jan 2024",
  totalRequests: 12,
  completedRequests: 10,
  pendingRequests: 2,
  averageRating: 4.8,
  totalSpent: 180000,
};

const requestHistory = [
  { id: "1", serviceType: "Consulta Médica", date: "20 Jan 2026", status: "pendente", interpreter: "Maria Santos", value: 15000 },
  { id: "2", serviceType: "Reunião Empresarial", date: "15 Jan 2026", status: "concluido", interpreter: "Ana Fernandes", value: 25000 },
  { id: "3", serviceType: "Palestra Educacional", date: "10 Jan 2026", status: "concluido", interpreter: "Carlos Teixeira", value: 20000 },
  { id: "4", serviceType: "Audiência Jurídica", date: "05 Jan 2026", status: "concluido", interpreter: "Maria Santos", value: 30000 },
];

const activityEvents = [
  { id: "1", title: "Nova solicitação criada", date: "20 Jan 2026 10:30" },
  { id: "2", title: "Serviço concluído com sucesso", date: "15 Jan 2026 18:00" },
  { id: "3", title: "Avaliação enviada (5 estrelas)", date: "15 Jan 2026 18:30" },
  { id: "4", title: "Conta criada", date: "15 Jan 2024 09:00" },
];

export default function AdminRequesterDetails() {
  const { id } = useParams();
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const handleSuspend = (reason: string) => {
    toast.success("Utilizador suspenso");
    setShowSuspendModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes do Solicitante"
        description="Informações completas do solicitante"
        action={
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin/requesters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        }
      />

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg" alt={requesterData.name} />
                <AvatarFallback className="text-2xl">{requesterData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{requesterData.name}</h2>
                  <Badge variant={requesterData.status === "active" ? "default" : "destructive"}>
                    {requesterData.status === "active" ? "Ativo" : "Suspenso"}
                  </Badge>
                  <Badge variant="outline">
                    {requesterData.type === "individual" ? (
                      <><User className="h-3 w-3 mr-1" /> Individual</>
                    ) : (
                      <><Building2 className="h-3 w-3 mr-1" /> Empresa</>
                    )}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {requesterData.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {requesterData.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {requesterData.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Membro desde {requesterData.createdAt}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {requesterData.status === "active" ? (
                <Button variant="destructive" onClick={() => setShowSuspendModal(true)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspender
                </Button>
              ) : (
                <Button variant="default" onClick={() => toast.success("Conta reativada")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reativar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Solicitações"
          value={requesterData.totalRequests}
          icon={FileText}
        />
        <StatsCard
          title="Serviços Concluídos"
          value={requesterData.completedRequests}
          icon={CheckCircle}
        />
        <StatsCard
          title="Pendentes"
          value={requesterData.pendingRequests}
          icon={Clock}
        />
        <StatsCard
          title="Avaliação Média"
          value={requesterData.averageRating.toFixed(1)}
          icon={Star}
          description="Dada aos intérpretes"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Solicitações</CardTitle>
              <CardDescription>Todas as solicitações realizadas por este utilizador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestHistory.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{request.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.date} • {request.interpreter}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          request.status === "concluido" ? "default" :
                          request.status === "pendente" ? "secondary" : "outline"
                        }
                      >
                        {request.status === "concluido" ? "Concluído" :
                         request.status === "pendente" ? "Pendente" : request.status}
                      </Badge>
                      <p className="text-sm font-medium">{request.value.toLocaleString()} AOA</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Histórico de ações do utilizador</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline events={activityEvents} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserSuspensionModal
        open={showSuspendModal}
        onOpenChange={setShowSuspendModal}
        onConfirm={handleSuspend}
        userName={requesterData.name}
      />
    </div>
  );
}
