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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

interface RequestStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: string, interpreterId?: string) => void;
  currentStatus?: string;
  request?: {
    id: string;
    serviceType: string;
    requesterName: string;
  } | null;
}

const interpreters = [
  { id: "1", name: "Maria Santos" },
  { id: "2", name: "João Oliveira" },
  { id: "3", name: "Ana Costa" },
  { id: "4", name: "Carlos Mendes" },
];

export function RequestStatusModal({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  request,
}: RequestStatusModalProps) {
  const [interpreterId, setInterpreterId] = useState("");
  const [newStatus, setNewStatus] = useState(currentStatus || "confirmado");

  const handleConfirm = () => {
    onConfirm(newStatus, interpreterId);
    setInterpreterId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Alterar Status / Atribuir Intérprete</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {request 
              ? `Atribua um intérprete à solicitação de ${request.requesterName} para o serviço de ${request.serviceType}.`
              : "Altere o status da solicitação ou atribua um intérprete."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="em_curso">Em Curso</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Selecionar Intérprete (opcional)</Label>
            <Select value={interpreterId} onValueChange={setInterpreterId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um intérprete..." />
              </SelectTrigger>
              <SelectContent>
                {interpreters.map((interpreter) => (
                  <SelectItem key={interpreter.id} value={interpreter.id}>
                    {interpreter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
