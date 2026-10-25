import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline } from "@/components/dashboard/Timeline";
import { RequestNegotiationChat } from "@/components/dashboard/RequestNegotiationChat";
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  MapPin,
  Video,
  User,
  DollarSign,
  FileText,
  MessageCircle,
  CheckCircle,
  XCircle,
  Users,
  UserCheck
} from "lucide-react";
import { useState } from "react";
import { RequestStatusModal } from "@/components/dashboard/modals/RequestStatusModal";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type RequestType = "direct" | "open";
type NegotiationStatus = "pending" | "negotiating" | "accepted" | "rejected" | "cancelled" | "completed";

const requestData = {
  id: "req-101",
  type: "direct" as RequestType,
  serviceType: "Consulta Médica",
  description: "Consulta de acompanhamento para paciente surdo. Necessário conhecimento de terminologia médica.",
  date: "25 Jan 2026",
  time: "10:00",
  duration: "2h",
  modality: "presencial" as "presencial" | "online",
  location: "Hospital Central de Luanda",
  status: "confirmado" as const,
  negotiationStatus: "accepted" as NegotiationStatus,
  createdAt: "20 Jan 2026 08:30",
  requester: {
    id: "user-001",
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+244 923 456 789",
    photo: "/placeholder.svg",
  },
  interpreter: {
    id: "int-001",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "+244 912 345 678",
    photo: "/placeholder.svg",
    specialty: "Saúde e Medicina",
  },
  estimatedBudget: 15000,
  finalPrice: 18000,
  proposals: [
    { by: "requester", amount: 15000, status: "rejected" },
    { by: "interpreter", amount: 20000, status: "rejected" },
    { by: "requester", amount: 18000, status: "accepted" },
  ],
};

const timelineEvents = [
  { id: "1", title: "Solicitação criada", date: "20 Jan 2026 08:30" },
  { id: "2", title: "Intérprete notificado", date: "20 Jan 2026 08:31" },
  { id: "3", title: "Negociação iniciada", date: "20 Jan 2026 09:15" },
  { id: "4", title: "Proposta aceite (18.000 AOA)", date: "20 Jan 2026 10:45" },
  { id: "5", title: "Serviço confirmado", date: "20 Jan 2026 10:46" },
];

const statusConfig = {
  pendente: { label: "Pendente", variant: "secondary" as const },
  confirmado: { label: "Confirmado", variant: "default" as const },
  em_curso: { label: "Em Curso", variant: "default" as const },
  concluido: { label: "Concluído", variant: "outline" as const },
  cancelado: { label: "Cancelado", variant: "destructive" as const },
};

const negotiationStatusConfig = {
  pending: { label: "Aguardando", variant: "secondary" as const },
  negotiating: { label: "Em Negociação", variant: "outline" as const },
  accepted: { label: "Aceite", variant: "default" as const },
  rejected: { label: "Recusado", variant: "destructive" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
  completed: { label: "Concluído", variant: "default" as const },
};

export default function AdminRequestDetails() {
  const { id } = useParams();
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    toast.success(`Status alterado para: ${newStatus}`);
    setShowStatusModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes da Solicitação"
        description={`Ref: #${requestData.id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStatusModal(true)}>
              Alterar Status
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/admin/requests">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        }
      />

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{requestData.serviceType}</h2>
                <Badge variant={requestData.type === "direct" ? "default" : "secondary"}>
                  {requestData.type === "direct" ? (
                    <><UserCheck className="h-3 w-3 mr-1" /> Direta</>
                  ) : (
                    <><Users className="h-3 w-3 mr-1" /> Aberta</>
                  )}
                </Badge>
                <Badge variant={statusConfig[requestData.status].variant}>
                  {statusConfig[requestData.status].label}
                </Badge>
                <Badge variant={negotiationStatusConfig[requestData.negotiationStatus].variant}>
                  <DollarSign className="h-3 w-3 mr-1" />
                  {negotiationStatusConfig[requestData.negotiationStatus].label}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{requestData.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{requestData.time} ({requestData.duration})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {requestData.modality === "online" ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  <span>{requestData.modality === "online" ? "Online" : requestData.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Criada em {requestData.createdAt}</span>
                </div>
              </div>

              {requestData.description && (
                <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {requestData.description}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {requestData.estimatedBudget && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Orçamento Inicial</span>
                  <p className="font-medium">{requestData.estimatedBudget.toLocaleString()} AOA</p>
                </div>
              )}
              {requestData.finalPrice && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Valor Final</span>
                  <p className="text-2xl font-bold text-primary">{requestData.finalPrice.toLocaleString()} AOA</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={requestData.requester.photo} alt={requestData.requester.name} />
                <AvatarFallback>{requestData.requester.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{requestData.requester.name}</p>
                <p className="text-sm text-muted-foreground">{requestData.requester.email}</p>
                <p className="text-sm text-muted-foreground">{requestData.requester.phone}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/dashboard/admin/requesters/${requestData.requester.id}`}>
                  Ver Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Intérprete Atribuído
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requestData.interpreter ? (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={requestData.interpreter.photo} alt={requestData.interpreter.name} />
                  <AvatarFallback>{requestData.interpreter.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{requestData.interpreter.name}</p>
                  <p className="text-sm text-muted-foreground">{requestData.interpreter.specialty}</p>
                  <p className="text-sm text-muted-foreground">{requestData.interpreter.email}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/admin/interpreters/${requestData.interpreter.id}`}>
                    Ver Perfil
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum intérprete atribuído</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Cronologia</TabsTrigger>
          <TabsTrigger value="negotiation">Negociação</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Cronologia do Pedido</CardTitle>
              <CardDescription>Histórico de eventos e alterações</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiation">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Negociação</CardTitle>
              <CardDescription>Propostas trocadas entre as partes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestData.proposals.map((proposal, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {proposal.by === "requester" ? "S" : "I"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          Proposta do {proposal.by === "requester" ? "Solicitante" : "Intérprete"}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {proposal.amount.toLocaleString()} AOA
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        proposal.status === "accepted" ? "default" :
                        proposal.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {proposal.status === "accepted" ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Aceite</>
                      ) : proposal.status === "rejected" ? (
                        <><XCircle className="h-3 w-3 mr-1" /> Recusada</>
                      ) : (
                        "Pendente"
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <RequestNegotiationChat
            requestId={requestData.id}
            currentUserRole="requester"
            otherParty={{
              name: requestData.interpreter?.name || "Intérprete",
              photo: requestData.interpreter?.photo,
            }}
            negotiationStatus={requestData.negotiationStatus}
            finalPrice={requestData.finalPrice}
          />
        </TabsContent>
      </Tabs>

      <RequestStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        onConfirm={handleStatusChange}
        currentStatus={requestData.status}
      />
    </div>
  );
}
