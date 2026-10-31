import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { StatusBadge } from "@portal-dos-interpretes/ui/components/status-badge";
import { Timeline } from "@portal-dos-interpretes/ui/components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@portal-dos-interpretes/ui/components/card";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@portal-dos-interpretes/ui/components/avatar";
import { ArrowLeft, Calendar, Clock, MapPin, Video, Phone, Mail, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { AcceptRequestModal } from "@/components/dashboard/modals/AcceptRequestModal";
import { RejectRequestModal } from "@/components/dashboard/modals/RejectRequestModal";
import { toast } from "sonner";

type RequestStatus = "pending" | "confirmed" | "in_progress" | "completed" | "canceled";

const requestData = {
  id: "req-101",
  serviceType: "Consulta Médica",
  status: "pending" as RequestStatus,
  date: "20 Jan 2026",
  time: "10:00",
  duration: "2h",
  modality: "presencial" as "presencial" | "online",
  location: "Hospital Central de Luanda, Rua Principal 123",
  observations: "Paciente surdo necessita de intérprete para consulta com cardiologista. Favor chegar 15 minutos antes.",
  requester: {
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+244 923 456 789",
    photo: "/placeholder.svg",
  },
  createdAt: "10 Jan 2026, 14:30",
  timeline: [
    { id: "1", date: "10 Jan 2026, 14:30", title: "Solicitação criada", description: "Nova solicitação recebida" },
  ],
};

export default function InterpreterRequestDetails() {
  const { id } = useParams();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleAccept = () => {
    toast.success("Solicitação aceite com sucesso!");
    setShowAcceptModal(false);
  };

  const handleReject = (_reason: string) => {
    toast.success("Solicitação recusada");
    setShowRejectModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Solicitação #${id?.slice(0, 8)}`}
        description={requestData.serviceType}
        action={<Button variant="outline" asChild><Link to="/requests"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes do Serviço</CardTitle>
              <StatusBadge status={requestData.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{requestData.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{requestData.time} ({requestData.duration})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {requestData.modality === "online" ? (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {requestData.modality === "online" ? "Modalidade" : "Local"}
                    </p>
                    <p className="font-medium">
                      {requestData.modality === "online" ? "Online" : requestData.location}
                    </p>
                  </div>
                </div>
              </div>

              {requestData.observations && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="text-sm">{requestData.observations}</p>
                    </div>
                  </div>
                </div>
              )}

              {requestData.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(true)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Recusar
                  </Button>
                  <Button className="flex-1" onClick={() => setShowAcceptModal(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={requestData.timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Requester Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={requestData.requester.photo} alt={requestData.requester.name} />
                  <AvatarFallback>{requestData.requester.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{requestData.requester.name}</p>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{requestData.requester.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{requestData.requester.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referência</span>
                <span className="font-medium">#{id?.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{requestData.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>{requestData.serviceType}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AcceptRequestModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleAccept}
        request={{
          id: requestData.id,
          serviceType: requestData.serviceType,
          date: requestData.date,
          time: requestData.time,
          requesterName: requestData.requester.name,
        }}
      />

      <RejectRequestModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        request={{
          id: requestData.id,
          serviceType: requestData.serviceType,
          date: requestData.date,
          time: requestData.time,
          requesterName: requestData.requester.name,
        }}
      />
    </div>
  );
}
