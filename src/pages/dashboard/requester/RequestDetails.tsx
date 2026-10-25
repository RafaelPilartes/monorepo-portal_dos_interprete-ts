import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Timeline } from "@/components/dashboard/Timeline";
import { ConfirmationModal } from "@/components/dashboard/ConfirmationModal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  FileText,
  MessageSquare,
  Star,
  XCircle,
  CheckCircle2,
  Send,
  Edit,
} from "lucide-react";

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'canceled' | 'in_progress' | 'confirmed';

// Mock data
const requestData: {
  id: string;
  service: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  status: RequestStatus;
  modality: "presencial" | "online";
  location: string;
  interpreter: {
    name: string;
    photo: string;
    specialty: string;
    rating: number;
  };
  createdAt: string;
  notes: string;
} = {
  id: "REQ-001",
  service: "Interpretação em Consulta Médica",
  description: "Necessito de um intérprete para acompanhar-me numa consulta de cardiologia no Hospital Américo Boavida.",
  date: "2024-01-20",
  time: "10:00",
  duration: "2 horas",
  status: "confirmed",
  modality: "presencial",
  location: "Hospital Américo Boavida, Luanda",
  interpreter: {
    name: "Maria Silva",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    specialty: "Saúde",
    rating: 4.9,
  },
  createdAt: "2024-01-15",
  notes: "Favor chegar 15 minutos antes da consulta.",
};

const timeline = [
  {
    id: "1",
    title: "Solicitação criada",
    description: "Solicitação submetida para análise.",
    date: "15 Jan, 10:30",
    iconColor: "bg-primary",
  },
  {
    id: "2",
    title: "Solicitação aprovada",
    description: "A equipa da plataforma aprovou a solicitação.",
    date: "15 Jan, 14:00",
    iconColor: "bg-success",
  },
  {
    id: "3",
    title: "Intérprete atribuído",
    description: "Maria Silva foi atribuída ao serviço.",
    date: "16 Jan, 09:00",
    iconColor: "bg-secondary",
  },
  {
    id: "4",
    title: "Serviço confirmado",
    description: "O intérprete confirmou disponibilidade.",
    date: "16 Jan, 11:30",
    iconColor: "bg-success",
  },
];

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleCancel = () => {
    // Handle cancellation
    setShowCancelModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/requester/requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{requestData.id}</h1>
              <StatusBadge status={requestData.status} />
            </div>
            <p className="text-muted-foreground">{requestData.service}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {requestData.status === "pending" && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/dashboard/requester/requests/${id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
          {requestData.status === "completed" && (
            <Button onClick={() => setShowReviewModal(true)}>
              <Star className="h-4 w-4" />
              Avaliar Serviço
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{new Date(requestData.date).toLocaleDateString('pt-AO', { dateStyle: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{requestData.time} ({requestData.duration})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {requestData.modality === "presencial" ? (
                      <MapPin className="h-5 w-5 text-primary" />
                    ) : (
                      <Video className="h-5 w-5 text-secondary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {requestData.modality === "presencial" ? "Local" : "Modalidade"}
                    </p>
                    <p className="font-medium">{requestData.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-muted-foreground">{requestData.description}</p>
              </div>

              {requestData.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Observações
                  </h4>
                  <p className="text-sm text-muted-foreground">{requestData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Interpreter Info */}
          {requestData.interpreter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Intérprete Atribuído
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img
                    src={requestData.interpreter.photo}
                    alt={requestData.interpreter.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{requestData.interpreter.name}</h4>
                    <p className="text-sm text-muted-foreground">{requestData.interpreter.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="text-sm font-medium">{requestData.interpreter.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/interpreters/${requestData.interpreter.name.toLowerCase().replace(' ', '-')}`}>
                      Ver Perfil Completo
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado actual</span>
                <StatusBadge status={requestData.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Criada em</span>
                <span className="font-medium">{new Date(requestData.createdAt).toLocaleDateString('pt-AO')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modalidade</span>
                <Badge variant="outline" className="capitalize">
                  {requestData.modality}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Send className="h-4 w-4" />
                Contactar Suporte
              </Button>
              {requestData.status === "confirmed" && (
                <Button variant="outline" className="w-full justify-start gap-2 text-destructive" onClick={() => setShowCancelModal(true)}>
                  <XCircle className="h-4 w-4" />
                  Cancelar Solicitação
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      <ConfirmationModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title="Cancelar Solicitação"
        description="Tem a certeza que deseja cancelar esta solicitação? Esta acção não pode ser desfeita."
        confirmLabel="Sim, cancelar"
        onConfirm={handleCancel}
        variant="danger"
      />
    </div>
  );
}
