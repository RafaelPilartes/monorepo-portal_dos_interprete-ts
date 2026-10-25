import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import { RequestStatus, VerificationRequest } from '@/core/mocks/verificationMocks';

interface VerificationRequestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: VerificationRequest | null;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/30",
  },
  approved: {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/30",
  },
  rejected: {
    label: "Rejeitado",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  expired: {
    label: "Expirado",
    icon: AlertTriangle,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function VerificationRequestDetailsModal({
  open,
  onOpenChange,
  request,
}: VerificationRequestDetailsModalProps) {
  if (!request) return null;

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const timelineEvents = [
    {
      date: request.request_date,
      title: "Pedido Submetido",
      description: "Comprovativo de pagamento enviado para análise",
      icon: CreditCard,
      completed: true,
    },
    {
      date: request.approved_at || request.rejected_at,
      title:
        request.status === "approved"
          ? "Verificação Aprovada"
          : request.status === "rejected"
          ? "Verificação Rejeitada"
          : "Em Análise",
      description:
        request.status === "approved"
          ? "O seu pedido foi aprovado pela equipa"
          : request.status === "rejected"
          ? "O seu pedido foi rejeitado"
          : "A equipa está a analisar o seu pedido",
      icon:
        request.status === "approved"
          ? CheckCircle2
          : request.status === "rejected"
          ? XCircle
          : Clock,
      completed: request.status !== "pending",
    },
  ];

  if (request.status === "approved" && request.expires_at) {
    timelineEvents.push({
      date: request.expires_at,
      title: "Expiração",
      description: "Data prevista para expiração da verificação",
      icon: Calendar,
      completed: false,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
          <DialogDescription>
            Pedido #{request.id} • {request.plan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge variant="outline" className={`${status.className} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Request Info */}
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Data do Pedido</span>
              <span className="text-sm font-medium">
                {format(new Date(request.request_date), "dd 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-sm font-semibold">
                {request.amount.toLocaleString("pt-AO")} Kz
              </span>
            </div>
            {request.expires_at && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Validade</span>
                <span className="text-sm">
                  {format(new Date(request.expires_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: pt,
                  })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Proof */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Comprovativo</span>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{request.payment_proof}</p>
                  <p className="text-xs text-muted-foreground">Documento PDF</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Admin Message */}
          {request.admin_message && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagem do Administrador
                </span>
                <div
                  className={`p-3 rounded-lg ${
                    request.status === "rejected"
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-muted/50"
                  }`}
                >
                  <p className="text-sm">{request.admin_message}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Histórico</span>
            <div className="space-y-4">
              {timelineEvents.map((event, index) => {
                const EventIcon = event.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        event.completed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <EventIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 pb-4 border-l-2 border-border pl-4 -ml-[1.25rem]">
                      <p
                        className={`text-sm font-medium ${
                          !event.completed ? "text-muted-foreground" : ""
                        }`}
                      >
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      {event.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.date), "dd MMM yyyy, HH:mm", {
                            locale: pt,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
