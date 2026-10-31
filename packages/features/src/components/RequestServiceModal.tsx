import { useState } from "react";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@portal-dos-interpretes/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portal-dos-interpretes/ui/components/select";
import { CheckCircle2, Send } from "lucide-react";

interface RequestServiceModalProps {
  interpreterName: string;
  children: React.ReactNode;
}

const serviceTypes = [
  "Educação e Formação",
  "Saúde e Área Médica",
  "Jurídico e Legal",
  "Eventos e Conferências",
  "Serviços Religiosos",
  "Reuniões Online",
  "Outro",
];

export function RequestServiceModal({ interpreterName, children }: RequestServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    requesterName: "",
    email: "",
    phone: "",
    serviceType: "",
    date: "",
    location: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would send to backend
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
      setFormData({
        requesterName: "",
        email: "",
        phone: "",
        serviceType: "",
        date: "",
        location: "",
        notes: "",
      });
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {isSubmitted ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Solicitação Enviada!
            </h3>
            <p className="text-muted-foreground">
              Entraremos em contacto em breve para confirmar a sua solicitação com {interpreterName}.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Solicitar Serviços de Interpretação
              </DialogTitle>
              <DialogDescription>
                Submeta uma solicitação para <span className="font-semibold text-secondary">{interpreterName}</span>. 
                A nossa equipa irá analisar e confirmar a disponibilidade.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requesterName">O Seu Nome *</Label>
                  <Input
                    id="requesterName"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+244..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                  <Select
                    required
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Data Pretendida *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local / Link</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Endereço ou link da reunião"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Descreva o contexto, duração, requisitos especiais..."
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full" size="lg">
                <Send className="h-4 w-4" />
                Enviar Solicitação
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
