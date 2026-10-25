import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { EditableList } from "@/components/dashboard/profile/EditableList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Plus, Briefcase, GraduationCap, Award } from "lucide-react";
import { toast } from "sonner";

import { Experience, Education, Certification, initialExperiences, initialEducation, initialCertifications } from '@/core/mocks/interpreterProfileMocks';

export default function InterpreterProfileExperience() {
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [education, setEducation] = useState<Education[]>(initialEducation);
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
  
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  
  const [showExpDialog, setShowExpDialog] = useState(false);
  const [showEduDialog, setShowEduDialog] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);

  const handleSave = () => {
    toast.success("Experiência atualizada com sucesso!");
  };

  const saveExperience = () => {
    if (editingExperience) {
      if (experiences.find((e) => e.id === editingExperience.id)) {
        setExperiences(experiences.map((e) => (e.id === editingExperience.id ? editingExperience : e)));
      } else {
        setExperiences([...experiences, editingExperience]);
      }
      setShowExpDialog(false);
      setEditingExperience(null);
    }
  };

  const saveEducation = () => {
    if (editingEducation) {
      if (education.find((e) => e.id === editingEducation.id)) {
        setEducation(education.map((e) => (e.id === editingEducation.id ? editingEducation : e)));
      } else {
        setEducation([...education, editingEducation]);
      }
      setShowEduDialog(false);
      setEditingEducation(null);
    }
  };

  const saveCertification = () => {
    if (editingCertification) {
      if (certifications.find((c) => c.id === editingCertification.id)) {
        setCertifications(certifications.map((c) => (c.id === editingCertification.id ? editingCertification : c)));
      } else {
        setCertifications([...certifications, editingCertification]);
      }
      setShowCertDialog(false);
      setEditingCertification(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiência Profissional"
        description="Gerencie a sua experiência, formação e certificações"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      {/* Work Experience */}
      <ProfileSectionEditor
        title="Experiência de Trabalho"
        description="Histórico profissional"
        publicNote="Exibido na aba 'Experiência' do seu perfil"
      >
        <EditableList
          items={experiences}
          onAdd={() => {
            setEditingExperience({
              id: Date.now().toString(),
              title: "",
              institution: "",
              period: "",
              description: "",
              featured: false,
            });
            setShowExpDialog(true);
          }}
          onEdit={(exp) => {
            setEditingExperience(exp);
            setShowExpDialog(true);
          }}
          onDelete={(id) => setExperiences(experiences.filter((e) => e.id !== id))}
          addLabel="Adicionar Experiência"
          emptyMessage="Nenhuma experiência adicionada"
          draggable
          renderItem={(exp) => (
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="font-medium">{exp.title}</span>
                {exp.featured && (
                  <Badge variant="secondary" className="text-xs">
                    Destaque
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {exp.institution} • {exp.period}
              </p>
              <p className="text-sm mt-1 line-clamp-2">{exp.description}</p>
            </div>
          )}
        />
      </ProfileSectionEditor>

      {/* Education */}
      <ProfileSectionEditor
        title="Formação Académica"
        description="Graus e formações"
      >
        <EditableList
          items={education}
          onAdd={() => {
            setEditingEducation({
              id: Date.now().toString(),
              degree: "",
              institution: "",
              year: "",
            });
            setShowEduDialog(true);
          }}
          onEdit={(edu) => {
            setEditingEducation(edu);
            setShowEduDialog(true);
          }}
          onDelete={(id) => setEducation(education.filter((e) => e.id !== id))}
          addLabel="Adicionar Formação"
          emptyMessage="Nenhuma formação adicionada"
          renderItem={(edu) => (
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-medium">{edu.degree}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {edu.institution} • {edu.year}
              </p>
            </div>
          )}
        />
      </ProfileSectionEditor>

      {/* Certifications */}
      <ProfileSectionEditor
        title="Certificações"
        description="Certificados e credenciais"
      >
        <EditableList
          items={certifications}
          onAdd={() => {
            setEditingCertification({
              id: Date.now().toString(),
              name: "",
              issuer: "",
              year: "",
            });
            setShowCertDialog(true);
          }}
          onEdit={(cert) => {
            setEditingCertification(cert);
            setShowCertDialog(true);
          }}
          onDelete={(id) => setCertifications(certifications.filter((c) => c.id !== id))}
          addLabel="Adicionar Certificação"
          emptyMessage="Nenhuma certificação adicionada"
          renderItem={(cert) => (
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="font-medium">{cert.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {cert.issuer} • {cert.year}
              </p>
            </div>
          )}
        />
      </ProfileSectionEditor>

      {/* Experience Dialog */}
      <Dialog open={showExpDialog} onOpenChange={setShowExpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExperience?.id && experiences.find((e) => e.id === editingExperience.id)
                ? "Editar Experiência"
                : "Nova Experiência"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cargo/Função</Label>
              <Input
                value={editingExperience?.title || ""}
                onChange={(e) =>
                  setEditingExperience((prev) => prev && { ...prev, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Instituição/Empresa</Label>
              <Input
                value={editingExperience?.institution || ""}
                onChange={(e) =>
                  setEditingExperience((prev) => prev && { ...prev, institution: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Período</Label>
              <Input
                placeholder="Ex: 2020 - Presente"
                value={editingExperience?.period || ""}
                onChange={(e) =>
                  setEditingExperience((prev) => prev && { ...prev, period: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editingExperience?.description || ""}
                onChange={(e) =>
                  setEditingExperience((prev) => prev && { ...prev, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingExperience?.featured || false}
                onCheckedChange={(checked) =>
                  setEditingExperience((prev) => prev && { ...prev, featured: checked })
                }
              />
              <Label>Marcar como destaque</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveExperience}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={showEduDialog} onOpenChange={setShowEduDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEducation?.id && education.find((e) => e.id === editingEducation.id)
                ? "Editar Formação"
                : "Nova Formação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Grau/Curso</Label>
              <Input
                value={editingEducation?.degree || ""}
                onChange={(e) =>
                  setEditingEducation((prev) => prev && { ...prev, degree: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input
                value={editingEducation?.institution || ""}
                onChange={(e) =>
                  setEditingEducation((prev) => prev && { ...prev, institution: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ano de Conclusão</Label>
              <Input
                value={editingEducation?.year || ""}
                onChange={(e) =>
                  setEditingEducation((prev) => prev && { ...prev, year: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEduDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEducation}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCertification?.id && certifications.find((c) => c.id === editingCertification.id)
                ? "Editar Certificação"
                : "Nova Certificação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Certificação</Label>
              <Input
                value={editingCertification?.name || ""}
                onChange={(e) =>
                  setEditingCertification((prev) => prev && { ...prev, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Entidade Emissora</Label>
              <Input
                value={editingCertification?.issuer || ""}
                onChange={(e) =>
                  setEditingCertification((prev) => prev && { ...prev, issuer: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                value={editingCertification?.year || ""}
                onChange={(e) =>
                  setEditingCertification((prev) => prev && { ...prev, year: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCertification}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}