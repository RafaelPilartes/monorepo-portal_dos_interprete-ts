import { useState } from "react";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { EditableList } from "@/components/dashboard/profile/EditableList";
import { MediaUploader } from "@/components/dashboard/profile/MediaUploader";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Switch } from "@portal-dos-interpretes/ui/components/switch";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@portal-dos-interpretes/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portal-dos-interpretes/ui/components/select";
import { Save, Settings, MapPin, Video, Check } from "lucide-react";
import { toast } from "sonner";

import { Service, initialServices } from '@/core/mocks/interpreterProfileMocks';

export default function InterpreterProfileServices() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleSave = () => {
    toast.success("Serviços atualizados com sucesso!");
  };

  const saveService = () => {
    if (editingService) {
      if (services.find((s) => s.id === editingService.id)) {
        setServices(services.map((s) => (s.id === editingService.id ? editingService : s)));
      } else {
        setServices([...services, editingService]);
      }
      setShowDialog(false);
      setEditingService(null);
    }
  };

  const modalityLabel = {
    presencial: "Presencial",
    online: "Online",
    ambos: "Híbrido",
  };

  const ModalityIcon = ({ modality }: { modality: string }) => {
    if (modality === "online") return <Video className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Defina os serviços que oferece"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      <ProfileSectionEditor
        title="Os Meus Serviços"
        description="Lista de serviços que oferece aos clientes"
        publicNote="Exibido na aba 'Serviços' do seu perfil"
      >
        <EditableList
          items={services}
          onAdd={() => {
            setEditingService({
              id: Date.now().toString(),
              name: "",
              description: "",
              modality: "ambos",
              availableForOpenRequests: true,
            });
            setShowDialog(true);
          }}
          onEdit={(service) => {
            setEditingService(service);
            setShowDialog(true);
          }}
          onDelete={(id) => setServices(services.filter((s) => s.id !== id))}
          addLabel="Adicionar Serviço"
          emptyMessage="Nenhum serviço adicionado"
          draggable
          renderItem={(service) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">{service.name}</span>
                <Badge variant="outline" className="gap-1">
                  <ModalityIcon modality={service.modality} />
                  {modalityLabel[service.modality]}
                </Badge>
                {service.availableForOpenRequests && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Check className="h-3 w-3" />
                    Open Requests
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
              {service.basePrice && (
                <p className="text-sm font-medium text-primary">
                  A partir de {service.basePrice.toLocaleString("pt-AO")} Kz
                </p>
              )}
            </div>
          )}
        />
      </ProfileSectionEditor>

      {/* Service Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingService?.id && services.find((s) => s.id === editingService.id)
                ? "Editar Serviço"
                : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input
                value={editingService?.name || ""}
                onChange={(e) =>
                  setEditingService((prev) => prev && { ...prev, name: e.target.value })
                }
                placeholder="Ex: Interpretação Médica"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editingService?.description || ""}
                onChange={(e) =>
                  setEditingService((prev) => prev && { ...prev, description: e.target.value })
                }
                rows={3}
                placeholder="Descreva o serviço..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <Select
                  value={editingService?.modality || "ambos"}
                  onValueChange={(v) =>
                    setEditingService((prev) => prev && { ...prev, modality: v as typeof prev.modality })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="ambos">Híbrido (Ambos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço Base (Kz)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingService?.basePrice || ""}
                  onChange={(e) =>
                    setEditingService((prev) =>
                      prev && { ...prev, basePrice: e.target.value ? Number(e.target.value) : undefined }
                    )
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>
            <MediaUploader
              type="image"
              label="Imagem Ilustrativa (opcional)"
              value={editingService?.image}
              onChange={(url) =>
                setEditingService((prev) => prev && { ...prev, image: url })
              }
              onRemove={() =>
                setEditingService((prev) => prev && { ...prev, image: undefined })
              }
            />
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Disponível para Open Requests</p>
                <p className="text-sm text-muted-foreground">
                  Este serviço aparece em solicitações abertas
                </p>
              </div>
              <Switch
                checked={editingService?.availableForOpenRequests || false}
                onCheckedChange={(checked) =>
                  setEditingService((prev) =>
                    prev && { ...prev, availableForOpenRequests: checked }
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveService}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}