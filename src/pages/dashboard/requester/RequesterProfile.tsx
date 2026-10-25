import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Building, Save, Camera } from "lucide-react";

export default function RequesterProfile() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "João Silva",
    email: "joao.silva@exemplo.com",
    phone: "+244 923 456 789",
    organization: "Empresa ABC, Lda",
    address: "Rua das Flores, 123, Luanda",
    bio: "Gestor de recursos humanos com interesse em promover a inclusão de pessoas surdas na nossa organização.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Perfil actualizado",
      description: "As suas informações foram guardadas com sucesso.",
    });
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie as suas informações pessoais e preferências."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Photo */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {formData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Clique no ícone para alterar a sua foto de perfil
              </p>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organização</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Morada</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre Mim</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Conte-nos um pouco sobre si ou a sua organização..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="lg:col-span-3">
            <Button type="submit" size="lg" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
