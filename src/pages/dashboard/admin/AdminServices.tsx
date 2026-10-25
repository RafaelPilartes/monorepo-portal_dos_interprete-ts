import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Briefcase, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { ServiceEditorModal } from "@/components/dashboard/modals/ServiceEditorModal";
import { ConfirmationModal } from "@/components/dashboard/ConfirmationModal";
import { toast } from "sonner";

const services = [
  { id: "1", name: "Saúde", description: "Consultas médicas, exames e procedimentos hospitalares", icon: "🏥", active: true, requests: 412 },
  { id: "2", name: "Educação", description: "Aulas, palestras e eventos acadêmicos", icon: "🎓", active: true, requests: 324 },
  { id: "3", name: "Jurídico", description: "Audiências, consultas jurídicas e processos legais", icon: "⚖️", active: true, requests: 198 },
  { id: "4", name: "Eventos", description: "Conferências, seminários e eventos corporativos", icon: "🎪", active: true, requests: 156 },
  { id: "5", name: "Religioso", description: "Cultos, missas e cerimônias religiosas", icon: "⛪", active: true, requests: 89 },
  { id: "6", name: "Empresarial", description: "Reuniões de negócios e comunicação corporativa", icon: "💼", active: false, requests: 45 },
];

export default function AdminServices() {
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (service: typeof services[0]) => {
    setSelectedService(service);
    setIsEditing(true);
    setShowEditorModal(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setIsEditing(false);
    setShowEditorModal(true);
  };

  const handleDelete = (service: typeof services[0]) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleToggleActive = (service: typeof services[0]) => {
    toast.success(`Serviço ${service.active ? "desativado" : "ativado"}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Serviço"
        description="Configure os tipos de serviço disponíveis na plataforma"
        action={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
          </Button>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum serviço configurado"
          description="Crie o primeiro tipo de serviço para a plataforma"
          action={
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Criar Serviço
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.active ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="cursor-grab">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {service.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      {!service.active && <Badge variant="secondary">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  
                  <div className="text-right mr-4">
                    <p className="font-semibold">{service.requests}</p>
                    <p className="text-xs text-muted-foreground">solicitações</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={service.active}
                      onCheckedChange={() => handleToggleActive(service)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        onConfirm={(data) => {
          toast.success(isEditing ? "Serviço atualizado!" : "Serviço criado!");
          setShowEditorModal(false);
        }}
        service={selectedService}
        isEditing={isEditing}
      />

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={() => {
          toast.success("Serviço eliminado");
          setShowDeleteModal(false);
        }}
        title="Eliminar Serviço"
        description={`Tem certeza que deseja eliminar "${selectedService?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
