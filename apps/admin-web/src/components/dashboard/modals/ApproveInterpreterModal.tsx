import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@portal-dos-interpretes/ui/components/dialog";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { CheckCircle } from "lucide-react";

interface ApproveInterpreterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  interpreter: {
    name: string;
    email?: string;
  } | null;
}

export function ApproveInterpreterModal({
  isOpen,
  onClose,
  onConfirm,
  interpreter,
}: ApproveInterpreterModalProps) {
  if (!interpreter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle>Aprovar Intérprete</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Tem certeza que deseja aprovar <strong>{interpreter.name}</strong>? 
            O intérprete será notificado e poderá começar a receber solicitações.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            Aprovar Intérprete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
