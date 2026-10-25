import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";

interface RejectInterpreterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  interpreter: {
    name: string;
    email?: string;
  } | null;
}

export function RejectInterpreterModal({
  isOpen,
  onClose,
  onConfirm,
  interpreter,
}: RejectInterpreterModalProps) {
  const [reason, setReason] = useState("");

  if (!interpreter) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Recusar Intérprete</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Está prestes a recusar a candidatura de <strong>{interpreter.name}</strong>. 
            Por favor, forneça um motivo para a recusa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo da Recusa</Label>
            <Textarea
              placeholder="Explique o motivo da recusa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Recusar Candidatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
