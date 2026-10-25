import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  DollarSign, 
  FileText, 
  Users,
  CheckCircle,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OpenRequest {
  id: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  modality: "presencial" | "online";
  location?: string;
  estimatedBudget?: number;
  requesterName: string;
  description?: string;
  createdAt: string;
}

const openRequests: OpenRequest[] = [
  {
    id: "open-001",
    serviceType: "Consulta Médica",
    date: "25 Jan 2026",
    time: "10:00",
    duration: "2h",
    modality: "presencial",
    location: "Hospital Central de Luanda",
    estimatedBudget: 15000,
    requesterName: "João Silva",
    description: "Consulta de acompanhamento para paciente surdo. Necessário conhecimento de terminologia médica.",
    createdAt: "Há 2 horas"
  },
  {
    id: "open-002",
    serviceType: "Reunião Empresarial",
    date: "28 Jan 2026",
    time: "14:00",
    duration: "3h",
    modality: "online",
    estimatedBudget: 25000,
    requesterName: "Empresa ABC, Lda",
    description: "Reunião trimestral com apresentação de resultados. Participação de colaborador surdo.",
    createdAt: "Há 5 horas"
  },
  {
    id: "open-003",
    serviceType: "Palestra Educacional",
    date: "30 Jan 2026",
    time: "09:00",
    duration: "4h",
    modality: "presencial",
    location: "Universidade Agostinho Neto",
    requesterName: "ISCED",
    description: "Palestra sobre inclusão digital. Público estimado de 50 pessoas.",
    createdAt: "Há 1 dia"
  },
  {
    id: "open-004",
    serviceType: "Evento Religioso",
    date: "02 Fev 2026",
    time: "10:00",
    duration: "2h",
    modality: "presencial",
    location: "Igreja Nossa Senhora da Conceição",
    estimatedBudget: 8000,
    requesterName: "Paróquia Central",
    description: "Missa dominical com presença de membros surdos da comunidade.",
    createdAt: "Há 2 dias"
  },
];

const serviceTypeFilters = [
  { value: "all", label: "Todos" },
  { value: "medical", label: "Saúde" },
  { value: "corporate", label: "Empresarial" },
  { value: "education", label: "Educação" },
  { value: "religious", label: "Religioso" },
];

export default function InterpreterOpenRequests() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<OpenRequest | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");

  const filteredRequests = openRequests.filter((req) => {
    const matchesSearch = req.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleAccept = (request: OpenRequest) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  const handlePropose = (request: OpenRequest) => {
    setSelectedRequest(request);
    setProposedPrice(request.estimatedBudget?.toString() || "");
    setShowProposeModal(true);
  };

  const confirmAccept = () => {
    toast.success("Solicitação aceite com sucesso!", {
      description: "Aguarde a confirmação do solicitante.",
    });
    setShowAcceptModal(false);
    setSelectedRequest(null);
  };

  const submitProposal = () => {
    toast.success("Proposta enviada!", {
      description: `Proposta de ${proposedPrice} AOA enviada ao solicitante.`,
    });
    setShowProposeModal(false);
    setSelectedRequest(null);
    setProposedPrice("");
    setProposalMessage("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitações Abertas"
        description="Veja as solicitações disponíveis para todos os intérpretes"
        action={
          <Badge variant="secondary" className="gap-1">
            <Users className="h-4 w-4" />
            {filteredRequests.length} disponíveis
          </Badge>
        }
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar solicitações..."
        filters={[
          {
            name: "service",
            value: serviceFilter,
            onChange: setServiceFilter,
            options: serviceTypeFilters,
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setServiceFilter("all");
        }}
        hasActiveFilters={search !== "" || serviceFilter !== "all"}
      />

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sem solicitações abertas"
          description="Não há solicitações disponíveis no momento"
        />
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{request.serviceType}</h3>
                        <p className="text-sm text-muted-foreground">
                          Solicitado por: {request.requesterName} • {request.createdAt}
                        </p>
                      </div>
                      <Badge variant="outline">Aberta</Badge>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{request.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{request.time} ({request.duration})</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {request.modality === "online" ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        <span className="truncate">
                          {request.modality === "online" ? "Online" : request.location}
                        </span>
                      </div>
                      {request.estimatedBudget && (
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>{request.estimatedBudget.toLocaleString()} AOA</span>
                        </div>
                      )}
                    </div>

                    {request.description && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {request.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <Button onClick={() => handleAccept(request)} className="w-full lg:w-auto">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceitar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePropose(request)}
                      className="w-full lg:w-auto"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Propor Preço
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar Solicitação</DialogTitle>
            <DialogDescription>
              Ao aceitar esta solicitação, você se compromete a realizar o serviço nas condições indicadas.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Serviço:</strong> {selectedRequest.serviceType}</p>
                <p><strong>Data:</strong> {selectedRequest.date} às {selectedRequest.time}</p>
                <p><strong>Duração:</strong> {selectedRequest.duration}</p>
                {selectedRequest.estimatedBudget && (
                  <p><strong>Orçamento:</strong> {selectedRequest.estimatedBudget.toLocaleString()} AOA</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAccept}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Aceite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose Price Modal */}
      <Dialog open={showProposeModal} onOpenChange={setShowProposeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propor Preço</DialogTitle>
            <DialogDescription>
              Envie uma proposta de valor para o solicitante. Ele poderá aceitar, recusar ou contra-propor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Serviço:</strong> {selectedRequest.serviceType}</p>
                <p><strong>Duração:</strong> {selectedRequest.duration}</p>
                {selectedRequest.estimatedBudget && (
                  <p className="text-sm text-muted-foreground">
                    Orçamento sugerido pelo solicitante: {selectedRequest.estimatedBudget.toLocaleString()} AOA
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposed-price">Valor Proposto (AOA)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="proposed-price"
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="pl-10"
                    placeholder="Ex: 15000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-message">Mensagem (opcional)</Label>
                <Textarea
                  id="proposal-message"
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Explique a sua proposta..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposeModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitProposal} disabled={!proposedPrice}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
