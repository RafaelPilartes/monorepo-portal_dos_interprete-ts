import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  requestId: string;
  isLoading?: boolean;
}

const cancelReasons = [
  { id: "schedule", label: "Mudança de agenda" },
  { id: "no_longer_needed", label: "Já não preciso do serviço" },
  { id: "found_alternative", label: "Encontrei alternativa" },
  { id: "cost", label: "Questões de custo" },
  { id: "other", label: "Outro motivo" },
];

export function CancelRequestModal({
  isOpen,
  onClose,
  onConfirm,
  requestId,
  isLoading = false,
}: CancelRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const handleConfirm = () => {
    const reason = selectedReason === "other" ? otherReason : cancelReasons.find(r => r.id === selectedReason)?.label || "";
    onConfirm(reason);
  };

  const canSubmit = selectedReason && (selectedReason !== "other" || otherReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Cancelar Solicitação</DialogTitle>
              <DialogDescription>
                Ref: #{requestId.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. Por favor, selecione o motivo do cancelamento:
          </p>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {cancelReasons.map((reason) => (
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
            Manter Solicitação
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canSubmit || isLoading}>
            {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
