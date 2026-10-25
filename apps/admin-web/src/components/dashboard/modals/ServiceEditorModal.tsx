import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@portal-dos-interpretes/ui/components/dialog";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Briefcase } from "lucide-react";

interface ServiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; description: string; icon: string }) => void;
  service?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  } | null;
  isEditing?: boolean;
}

export function ServiceEditorModal({
  isOpen,
  onClose,
  onConfirm,
  service,
  isEditing = false,
}: ServiceEditorModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📋");

  useEffect(() => {
    if (service && isEditing) {
      setName(service.name);
      setDescription(service.description);
      setIcon(service.icon);
    } else {
      setName("");
      setDescription("");
      setIcon("📋");
    }
  }, [service, isEditing, isOpen]);

  const handleConfirm = () => {
    onConfirm({ name, description, icon });
    setName("");
    setDescription("");
    setIcon("📋");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>
              {isEditing ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {isEditing 
              ? "Atualize as informações do tipo de serviço."
              : "Configure um novo tipo de serviço para a plataforma."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ícone (emoji)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🏥"
              className="w-20 text-center text-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Nome do Serviço</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Saúde, Educação, Jurídico..."
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o tipo de serviço..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!name || !description}>
            {isEditing ? "Guardar Alterações" : "Criar Serviço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
