import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { ProfilePreviewCard } from "@/components/dashboard/profile/ProfilePreviewCard";
import { TagList } from "@/components/dashboard/profile/EditableList";
import { MediaUploader } from "@/components/dashboard/profile/MediaUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const initialProfile = {
  name: "Maria Santos",
  photo: "/placeholder.svg",
  coverPhoto: "",
  specialty: "Intérprete de LGA",
  bio: "Intérprete profissional de Língua Gestual Angolana com mais de 10 anos de experiência em contextos médicos, jurídicos e corporativos. Certificada pelo Instituto Nacional de Surdos.",
  languages: ["Língua Gestual Angolana", "Português", "Inglês"],
  specialties: ["Saúde", "Jurídico", "Corporativo", "Educação"],
  modality: "ambos" as const,
  minimumHourlyRate: 5000,
  openToNegotiation: true,
  verified: true,
  rating: 4.8,
  availableForOpenRequests: true,
};

export default function InterpreterProfileOverview() {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Perfil atualizado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão Geral do Perfil"
        description="Gerencie as informações principais exibidas no seu perfil público"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/interpreters/maria-santos`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Perfil Público
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePreviewCard
                name={profile.name}
                photo={profile.photo}
                specialty={profile.specialty}
                modality={profile.modality}
                rating={profile.rating}
                verified={profile.verified}
                minimumHourlyRate={profile.minimumHourlyRate}
                openToNegotiation={profile.openToNegotiation}
                languages={profile.languages}
                specialties={profile.specialties}
              />
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <ProfileSectionEditor title="Fotografias" description="Foto de perfil e imagem de capa">
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaUploader
                type="image"
                label="Foto de Perfil"
                value={profile.photo !== "/placeholder.svg" ? profile.photo : undefined}
                onChange={(url) => setProfile({ ...profile, photo: url })}
                onRemove={() => setProfile({ ...profile, photo: "/placeholder.svg" })}
              />
              <MediaUploader
                type="image"
                label="Foto de Capa"
                value={profile.coverPhoto}
                onChange={(url) => setProfile({ ...profile, coverPhoto: url })}
                onRemove={() => setProfile({ ...profile, coverPhoto: "" })}
              />
            </div>
          </ProfileSectionEditor>

          {/* Basic Info */}
          <ProfileSectionEditor title="Informações Básicas" description="Dados principais do seu perfil">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Profissional</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Título/Especialidade Principal</Label>
                  <Input
                    value={profile.specialty}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Biografia</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Descreva a sua experiência e especialidades..."
                />
                <p className="text-xs text-muted-foreground">
                  {profile.bio.length}/500 caracteres
                </p>
              </div>
            </div>
          </ProfileSectionEditor>

          {/* Modality & Pricing */}
          <ProfileSectionEditor title="Modalidade e Preços" description="Como trabalha e valores de referência">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modalidade de Trabalho</Label>
                  <Select
                    value={profile.modality}
                    onValueChange={(v) => setProfile({ ...profile, modality: v as any })}
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
                  <Label>Preço Mínimo por Hora (Kz)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={profile.minimumHourlyRate}
                    onChange={(e) =>
                      setProfile({ ...profile, minimumHourlyRate: Number(e.target.value) })
                    }
                    placeholder="Ex: 5000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor de referência. Deixe 0 para não exibir.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Aberto a Negociação</p>
                  <p className="text-sm text-muted-foreground">
                    Indicar que está disponível para negociar o valor
                  </p>
                </div>
                <Switch
                  checked={profile.openToNegotiation}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, openToNegotiation: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Aceitar Solicitações Abertas</p>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de solicitações abertas compatíveis
                  </p>
                </div>
                <Switch
                  checked={profile.availableForOpenRequests}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, availableForOpenRequests: checked })
                  }
                />
              </div>
            </div>
          </ProfileSectionEditor>

          {/* Languages */}
          <ProfileSectionEditor title="Idiomas" description="Idiomas em que trabalha">
            <TagList
              tags={profile.languages}
              onAdd={(lang) =>
                setProfile({ ...profile, languages: [...profile.languages, lang] })
              }
              onRemove={(lang) =>
                setProfile({
                  ...profile,
                  languages: profile.languages.filter((l) => l !== lang),
                })
              }
              placeholder="Adicionar idioma..."
            />
          </ProfileSectionEditor>

          {/* Specialties */}
          <ProfileSectionEditor title="Especialidades" description="Áreas de atuação">
            <TagList
              tags={profile.specialties}
              onAdd={(spec) =>
                setProfile({ ...profile, specialties: [...profile.specialties, spec] })
              }
              onRemove={(spec) =>
                setProfile({
                  ...profile,
                  specialties: profile.specialties.filter((s) => s !== spec),
                })
              }
              placeholder="Adicionar especialidade..."
            />
          </ProfileSectionEditor>
        </div>
      </div>
    </div>
  );
}