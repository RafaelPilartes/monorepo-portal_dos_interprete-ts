import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { XCircle, Calendar, Clock, User } from "lucide-react";

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  request: {
    id: string;
    serviceType: string;
    date: string;
    time: string;
    requesterName?: string;
  } | null;
  isLoading?: boolean;
}

const rejectReasons = [
  { id: "unavailable", label: "Não estou disponível nesta data/hora" },
  { id: "location", label: "Localização incompatível" },
  { id: "specialty", label: "Fora da minha área de especialidade" },
  { id: "other", label: "Outro motivo" },
];

export function RejectRequestModal({
  isOpen,
  onClose,
  onConfirm,
  request,
  isLoading = false,
}: RejectRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  if (!request) return null;

  const handleConfirm = () => {
    const reason = selectedReason === "other" 
      ? otherReason 
      : rejectReasons.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason);
    setSelectedReason("");
    setOtherReason("");
  };

  const canSubmit = selectedReason && (selectedReason !== "other" || otherReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Recusar Solicitação</DialogTitle>
              <DialogDescription>
                Indique o motivo da recusa
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

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {rejectReasons.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="cursor-pointer">{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "other" && (
            <Textarea
              placeholder="Descreva o motivo..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              rows={3}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canSubmit || isLoading}>
            {isLoading ? "Recusando..." : "Confirmar Recusa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
