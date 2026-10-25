import { useState } from "react";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { ProfileSectionEditor } from "@/components/dashboard/profile/ProfileSectionEditor";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Switch } from "@portal-dos-interpretes/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portal-dos-interpretes/ui/components/select";
import { Save, Mail, Phone, Globe, Linkedin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const initialContact = {
  email: "maria.santos@email.com",
  phone: "+244 923 456 789",
  whatsapp: "+244 923 456 789",
  linkedin: "https://linkedin.com/in/maria-santos-lga",
  website: "",
  preferredContact: "whatsapp",
  showEmail: true,
  showPhone: true,
  showWhatsapp: true,
  showLinkedin: true,
  showWebsite: false,
  autoMessage: "Olá! Obrigada pelo seu interesse. Estou disponível para ajudá-lo com interpretação de Língua Gestual Angolana.",
};

export default function InterpreterProfileContact() {
  const [contact, setContact] = useState(initialContact);

  const handleSave = () => {
    toast.success("Informações de contacto atualizadas!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacto"
        description="Gerencie as suas informações de contacto"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        }
      />

      {/* Contact Methods */}
      <ProfileSectionEditor
        title="Formas de Contacto"
        description="Defina como os clientes podem contactá-lo"
        publicNote="Apenas os campos marcados como visíveis aparecem no perfil"
      >
        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Email Profissional</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-email" className="text-xs text-muted-foreground">
                    Visível
                  </Label>
                  <Switch
                    id="show-email"
                    checked={contact.showEmail}
                    onCheckedChange={(checked) =>
                      setContact({ ...contact, showEmail: checked })
                    }
                  />
                </div>
              </div>
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Telefone</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-phone" className="text-xs text-muted-foreground">
                    Visível
                  </Label>
                  <Switch
                    id="show-phone"
                    checked={contact.showPhone}
                    onCheckedChange={(checked) =>
                      setContact({ ...contact, showPhone: checked })
                    }
                  />
                </div>
              </div>
              <Input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label>WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-whatsapp" className="text-xs text-muted-foreground">
                    Visível
                  </Label>
                  <Switch
                    id="show-whatsapp"
                    checked={contact.showWhatsapp}
                    onCheckedChange={(checked) =>
                      setContact({ ...contact, showWhatsapp: checked })
                    }
                  />
                </div>
              </div>
              <Input
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <Linkedin className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label>LinkedIn</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-linkedin" className="text-xs text-muted-foreground">
                    Visível
                  </Label>
                  <Switch
                    id="show-linkedin"
                    checked={contact.showLinkedin}
                    onCheckedChange={(checked) =>
                      setContact({ ...contact, showLinkedin: checked })
                    }
                  />
                </div>
              </div>
              <Input
                value={contact.linkedin}
                onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          {/* Website */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Website</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-website" className="text-xs text-muted-foreground">
                    Visível
                  </Label>
                  <Switch
                    id="show-website"
                    checked={contact.showWebsite}
                    onCheckedChange={(checked) =>
                      setContact({ ...contact, showWebsite: checked })
                    }
                  />
                </div>
              </div>
              <Input
                value={contact.website}
                onChange={(e) => setContact({ ...contact, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </ProfileSectionEditor>

      {/* Preferences */}
      <ProfileSectionEditor
        title="Preferências de Contacto"
        description="Configure como prefere ser contactado"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Método de Contacto Preferido</Label>
            <Select
              value={contact.preferredContact}
              onValueChange={(v) => setContact({ ...contact, preferredContact: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="platform">Plataforma (Chat interno)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem Automática Inicial</Label>
            <Textarea
              value={contact.autoMessage}
              onChange={(e) => setContact({ ...contact, autoMessage: e.target.value })}
              rows={3}
              placeholder="Mensagem enviada automaticamente quando alguém inicia contacto..."
            />
            <p className="text-xs text-muted-foreground">
              Esta mensagem é enviada automaticamente quando um cliente inicia uma conversa
            </p>
          </div>
        </div>
      </ProfileSectionEditor>
    </div>
  );
}