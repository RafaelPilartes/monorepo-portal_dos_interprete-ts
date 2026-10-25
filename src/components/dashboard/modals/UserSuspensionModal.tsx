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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban } from "lucide-react";

interface UserSuspensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, duration?: string) => void;
  userName: string;
}

const durations = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "permanent", label: "Permanente" },
];

export function UserSuspensionModal({
  open,
  onOpenChange,
  onConfirm,
  userName,
}: UserSuspensionModalProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("30");

  const handleConfirm = () => {
    onConfirm(reason, duration);
    setReason("");
    setDuration("30");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Suspender Utilizador</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Está prestes a suspender <strong>{userName}</strong>. 
            Esta ação impedirá o utilizador de aceder à plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Duração da Suspensão</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo da Suspensão</Label>
            <Textarea
              placeholder="Descreva o motivo da suspensão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Suspender Utilizador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
