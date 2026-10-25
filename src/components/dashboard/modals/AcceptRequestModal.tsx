import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User } from "lucide-react";

interface AcceptRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  request: {
    id: string;
    serviceType: string;
    date: string;
    time: string;
    requesterName?: string;
  } | null;
  isLoading?: boolean;
}

export function AcceptRequestModal({
  isOpen,
  onClose,
  onConfirm,
  request,
  isLoading = false,
}: AcceptRequestModalProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Aceitar Solicitação</DialogTitle>
              <DialogDescription>
                Confirme a aceitação deste serviço
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.serviceType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{request.date} às {request.time}</span>
            </div>
            {request.requesterName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{request.requesterName}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Ao aceitar, compromete-se a realizar este serviço na data e hora indicadas. O solicitante será notificado da sua confirmação.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? "Confirmando..." : "Confirmar Aceitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
