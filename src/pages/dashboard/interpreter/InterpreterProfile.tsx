import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Camera, Save, Plus, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const initialProfile = {
  name: "Maria Santos",
  email: "maria.santos@email.com",
  phone: "+244 923 456 789",
  location: "Luanda, Angola",
  bio: "Intérprete profissional de Língua Gestual Angolana com mais de 10 anos de experiência em contextos médicos, jurídicos e corporativos. Certificada pelo Instituto Nacional de Surdos.",
  languages: ["Língua Gestual Angolana", "Português", "Inglês"],
  specialties: ["Saúde", "Jurídico", "Corporativo", "Educação"],
  photo: "/placeholder.svg",
  verified: true,
  publicProfile: true,
};

export default function InterpreterProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [newLanguage, setNewLanguage] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const handleSave = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profile.languages.includes(newLanguage.trim())) {
      setProfile({ ...profile, languages: [...profile.languages, newLanguage.trim()] });
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setProfile({ ...profile, languages: profile.languages.filter((l) => l !== lang) });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !profile.specialties.includes(newSpecialty.trim())) {
      setProfile({ ...profile, specialties: [...profile.specialties, newSpecialty.trim()] });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (spec: string) => {
    setProfile({ ...profile, specialties: profile.specialties.filter((s) => s !== spec) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie as suas informações profissionais"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo and Status */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.photo} alt={profile.name} />
                <AvatarFallback className="text-4xl">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            {profile.verified && (
              <Badge className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verificado
              </Badge>
            )}
            <div className="flex items-center gap-2 w-full">
              <Switch
                checked={profile.publicProfile}
                onCheckedChange={(checked) => setProfile({ ...profile, publicProfile: checked })}
              />
              <Label>Perfil público</Label>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Os seus dados de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Idiomas</CardTitle>
            <CardDescription>Idiomas em que trabalha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="gap-1">
                  {lang}
                  <button onClick={() => removeLanguage(lang)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Novo idioma..."
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLanguage()}
              />
              <Button size="icon" onClick={addLanguage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
            <CardDescription>Áreas de atuação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((spec) => (
                <Badge key={spec} variant="outline" className="gap-1">
                  {spec}
                  <button onClick={() => removeSpecialty(spec)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova especialidade..."
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSpecialty()}
              />
              <Button size="icon" onClick={addSpecialty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
