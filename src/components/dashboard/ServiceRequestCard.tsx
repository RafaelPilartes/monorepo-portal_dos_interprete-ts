import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type ServiceStatus = 
  | "pendente" 
  | "atribuido" 
  | "confirmado" 
  | "em_curso" 
  | "concluido" 
  | "cancelado";

interface ServiceRequestCardProps {
  id: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  modality: "presencial" | "online";
  location?: string;
  status: ServiceStatus;
  interpreterName?: string;
  requesterName?: string;
  detailsLink: string;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

const statusConfig: Record<ServiceStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  atribuido: { label: "Atribuído", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  em_curso: { label: "Em Curso", variant: "default" },
  concluido: { label: "Concluído", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function ServiceRequestCard({
  id,
  serviceType,
  date,
  time,
  duration,
  modality,
  location,
  status,
  interpreterName,
  requesterName,
  detailsLink,
  showActions = false,
  onAccept,
  onReject,
}: ServiceRequestCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{serviceType}</h3>
              <p className="text-sm text-muted-foreground">Ref: #{id.slice(0, 8)}</p>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          {/* Details */}
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{time} ({duration})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {modality === "online" ? (
                <Video className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              <span>{modality === "online" ? "Online" : location || "Presencial"}</span>
            </div>
            {(interpreterName || requesterName) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{interpreterName || requesterName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:items-end">
          {showActions && status === "pendente" && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onReject}>
                Recusar
              </Button>
              <Button size="sm" onClick={onAccept}>
                Aceitar
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link to={detailsLink}>
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
