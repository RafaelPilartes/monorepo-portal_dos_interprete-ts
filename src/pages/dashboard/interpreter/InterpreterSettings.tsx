import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Bell, Lock, Globe, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function InterpreterSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newRequestAlert: true,
    reminderAlert: true,
    reviewAlert: true,
    language: "pt",
    timezone: "Africa/Luanda",
  });

  const handleSave = () => {
    toast.success("Configurações atualizadas!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Personalize a sua experiência na plataforma"
        action={
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Canais de Notificação</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push (Navegador)</Label>
                    <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS</Label>
                    <p className="text-sm text-muted-foreground">Receber SMS para alertas urgentes</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Tipos de Alertas</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Novas solicitações</Label>
                  <Switch
                    checked={settings.newRequestAlert}
                    onCheckedChange={(checked) => setSettings({ ...settings, newRequestAlert: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Lembretes de serviço</Label>
                  <Switch
                    checked={settings.reminderAlert}
                    onCheckedChange={(checked) => setSettings({ ...settings, reminderAlert: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Novas avaliações</Label>
                  <Switch
                    checked={settings.reviewAlert}
                    onCheckedChange={(checked) => setSettings({ ...settings, reviewAlert: checked })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie a segurança da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Palavra-passe Atual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Palavra-passe</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button variant="outline">Alterar Palavra-passe</Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Preferências
            </CardTitle>
            <CardDescription>Personalize a interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Luanda">África/Luanda (GMT+1)</SelectItem>
                    <SelectItem value="Europe/Lisbon">Europa/Lisboa (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
