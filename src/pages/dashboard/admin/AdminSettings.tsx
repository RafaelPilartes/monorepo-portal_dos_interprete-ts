import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Bell, Shield, Globe, Mail, Database } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const handleSave = () => {
    toast.success("Configurações guardadas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configurações gerais da plataforma"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Plataforma</Label>
                  <Input defaultValue="Portal dos Intérpretes" />
                </div>
                <div className="space-y-2">
                  <Label>Email de Contacto</Label>
                  <Input type="email" defaultValue="contato@gracemind.ao" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  defaultValue="Plataforma de intermediação entre pessoas surdas e intérpretes de Língua Gestual Angolana."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Idioma Padrão</Label>
                  <Select defaultValue="pt">
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
                  <Select defaultValue="africa-luanda">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa-luanda">África/Luanda (WAT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Modo de Manutenção</p>
                  <p className="text-sm text-muted-foreground">Desativar acesso público temporariamente</p>
                </div>
                <Switch />
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Novos intérpretes</p>
                    <p className="text-sm text-muted-foreground">Notificar quando novos intérpretes se registarem</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Novas solicitações</p>
                    <p className="text-sm text-muted-foreground">Notificar sobre novas solicitações de serviço</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Avaliações baixas</p>
                    <p className="text-sm text-muted-foreground">Alertar sobre avaliações abaixo de 3 estrelas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Relatórios semanais</p>
                    <p className="text-sm text-muted-foreground">Receber resumo semanal por email</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Autenticação de dois fatores</p>
                    <p className="text-sm text-muted-foreground">Exigir 2FA para administradores</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Verificação de email</p>
                    <p className="text-sm text-muted-foreground">Exigir verificação de email no registo</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Aprovação manual de intérpretes</p>
                    <p className="text-sm text-muted-foreground">Exigir aprovação antes de ativar perfis</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tempo de sessão (minutos)</Label>
                  <Input type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label>Tentativas de login máximas</Label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
              <CardDescription>
                Configure o servidor de email para notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Servidor SMTP</Label>
                  <Input defaultValue="smtp.gracemind.ao" />
                </div>
                <div className="space-y-2">
                  <Label>Porta</Label>
                  <Input defaultValue="587" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Utilizador</Label>
                  <Input defaultValue="noreply@gracemind.ao" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" defaultValue="••••••••" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email do Remetente</Label>
                <Input type="email" defaultValue="noreply@gracemind.ao" />
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline">Testar Conexão</Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Guardar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Informações e manutenção do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Versão</p>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">16 Jan 2026</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Base de dados</p>
                  <p className="font-medium">PostgreSQL 15</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Ambiente</p>
                  <p className="font-medium">Produção</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Manutenção</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline">Limpar Cache</Button>
                  <Button variant="outline">Reindexar Base de Dados</Button>
                  <Button variant="outline">Fazer Backup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
