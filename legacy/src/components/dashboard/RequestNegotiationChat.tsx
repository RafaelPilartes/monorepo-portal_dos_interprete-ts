import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  DollarSign, 
  Check, 
  X, 
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NegotiationStatus = "pending" | "negotiating" | "accepted" | "rejected" | "cancelled" | "completed";

interface PriceProposal {
  id: string;
  amount: number;
  proposedBy: "requester" | "interpreter";
  status: "pending" | "accepted" | "rejected" | "counter";
  message?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  type: "text" | "proposal";
  content?: string;
  proposal?: PriceProposal;
  sender: "requester" | "interpreter";
  senderName: string;
  senderPhoto?: string;
  createdAt: string;
}

interface RequestNegotiationChatProps {
  requestId: string;
  currentUserRole: "requester" | "interpreter";
  otherParty: {
    name: string;
    photo?: string;
  };
  negotiationStatus: NegotiationStatus;
  finalPrice?: number;
  onStatusChange?: (status: NegotiationStatus) => void;
  onPriceAccepted?: (amount: number) => void;
}

const statusConfig: Record<NegotiationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Aguardando", variant: "secondary" },
  negotiating: { label: "Em Negociação", variant: "outline" },
  accepted: { label: "Aceite", variant: "default" },
  rejected: { label: "Recusado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  completed: { label: "Concluído", variant: "default" },
};

const mockMessages: ChatMessage[] = [
  {
    id: "msg-1",
    type: "text",
    content: "Olá! Gostaria de solicitar os seus serviços para uma consulta médica.",
    sender: "requester",
    senderName: "João Silva",
    createdAt: "10:30"
  },
  {
    id: "msg-2",
    type: "text",
    content: "Bom dia! Fico feliz com o interesse. Posso ajudar, sim. Qual é a data e horário?",
    sender: "interpreter",
    senderName: "Maria Santos",
    senderPhoto: "/placeholder.svg",
    createdAt: "10:35"
  },
  {
    id: "msg-3",
    type: "text",
    content: "Seria no dia 25 de Janeiro, às 10h. A consulta deve durar cerca de 2 horas.",
    sender: "requester",
    senderName: "João Silva",
    createdAt: "10:38"
  },
  {
    id: "msg-4",
    type: "proposal",
    proposal: {
      id: "prop-1",
      amount: 18000,
      proposedBy: "interpreter",
      status: "pending",
      message: "Considerando a duração e especialização médica, proponho o seguinte valor:",
      createdAt: "10:45"
    },
    sender: "interpreter",
    senderName: "Maria Santos",
    senderPhoto: "/placeholder.svg",
    createdAt: "10:45"
  },
];

export function RequestNegotiationChat({
  requestId,
  currentUserRole,
  otherParty,
  negotiationStatus,
  finalPrice,
  onStatusChange,
  onPriceAccepted,
}: RequestNegotiationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposedAmount, setProposedAmount] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");

  const currentUserName = currentUserRole === "requester" ? "João Silva" : "Maria Santos";
  const statusInfo = statusConfig[negotiationStatus];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: "text",
      content: newMessage,
      sender: currentUserRole,
      senderName: currentUserName,
      createdAt: new Date().toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleSendProposal = () => {
    if (!proposedAmount) return;

    const proposal: PriceProposal = {
      id: `prop-${Date.now()}`,
      amount: parseInt(proposedAmount),
      proposedBy: currentUserRole,
      status: "pending",
      message: proposalMessage,
      createdAt: new Date().toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" }),
    };

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: "proposal",
      proposal,
      sender: currentUserRole,
      senderName: currentUserName,
      createdAt: proposal.createdAt,
    };

    setMessages([...messages, message]);
    setShowProposalModal(false);
    setProposedAmount("");
    setProposalMessage("");
    toast.success("Proposta enviada!");
  };

  const handleAcceptProposal = (proposal: PriceProposal) => {
    // Update the proposal status
    setMessages(messages.map(msg => {
      if (msg.proposal?.id === proposal.id) {
        return {
          ...msg,
          proposal: { ...msg.proposal, status: "accepted" as const }
        };
      }
      return msg;
    }));
    
    onPriceAccepted?.(proposal.amount);
    onStatusChange?.("accepted");
    toast.success("Proposta aceite!", {
      description: `Valor final: ${proposal.amount.toLocaleString()} AOA`,
    });
  };

  const handleRejectProposal = (proposal: PriceProposal) => {
    setMessages(messages.map(msg => {
      if (msg.proposal?.id === proposal.id) {
        return {
          ...msg,
          proposal: { ...msg.proposal, status: "rejected" as const }
        };
      }
      return msg;
    }));
    toast.info("Proposta recusada");
  };

  const handleCounterProposal = (proposal: PriceProposal) => {
    setMessages(messages.map(msg => {
      if (msg.proposal?.id === proposal.id) {
        return {
          ...msg,
          proposal: { ...msg.proposal, status: "counter" as const }
        };
      }
      return msg;
    }));
    setShowProposalModal(true);
  };

  const renderProposalCard = (proposal: PriceProposal, isOwnProposal: boolean) => {
    const canRespond = !isOwnProposal && proposal.status === "pending";

    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">Proposta de Preço</span>
        </div>
        
        {proposal.message && (
          <p className="text-sm text-muted-foreground">{proposal.message}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            {proposal.amount.toLocaleString()} AOA
          </span>
          
          {proposal.status === "pending" && canRespond && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleRejectProposal(proposal)}
              >
                <X className="h-4 w-4 mr-1" />
                Recusar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCounterProposal(proposal)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Contra-propor
              </Button>
              <Button 
                size="sm"
                onClick={() => handleAcceptProposal(proposal)}
              >
                <Check className="h-4 w-4 mr-1" />
                Aceitar
              </Button>
            </div>
          )}
          
          {proposal.status === "pending" && isOwnProposal && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando resposta
            </Badge>
          )}
          
          {proposal.status === "accepted" && (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aceite
            </Badge>
          )}
          
          {proposal.status === "rejected" && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Recusada
            </Badge>
          )}
          
          {proposal.status === "counter" && (
            <Badge variant="outline">
              <MessageCircle className="h-3 w-3 mr-1" />
              Contra-proposta enviada
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherParty.photo} alt={otherParty.name} />
              <AvatarFallback>{otherParty.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherParty.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ref: #{requestId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {finalPrice && (
              <Badge variant="default" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {finalPrice.toLocaleString()} AOA
              </Badge>
            )}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender === currentUserRole;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isOwnMessage && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.senderPhoto} alt={message.senderName} />
                  <AvatarFallback className="text-xs">
                    {message.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  "max-w-[80%] space-y-1",
                  isOwnMessage && "items-end"
                )}>
                  <div className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    isOwnMessage && "flex-row-reverse"
                  )}>
                    <span>{message.senderName}</span>
                    <span>•</span>
                    <span>{message.createdAt}</span>
                  </div>

                  {message.type === "text" && (
                    <div className={cn(
                      "rounded-lg px-4 py-2",
                      isOwnMessage 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}

                  {message.type === "proposal" && message.proposal && (
                    renderProposalCard(message.proposal, isOwnMessage)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      <CardFooter className="flex-shrink-0 p-4">
        {negotiationStatus === "accepted" || negotiationStatus === "completed" ? (
          <div className="w-full text-center py-2">
            <p className="text-sm text-muted-foreground">
              Negociação concluída. Valor acordado: <strong>{finalPrice?.toLocaleString()} AOA</strong>
            </p>
          </div>
        ) : (
          <div className="flex w-full gap-2">
            <Input
              placeholder="Escreva uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button size="icon" variant="outline" onClick={() => setShowProposalModal(true)}>
              <DollarSign className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>

      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propor Preço</DialogTitle>
            <DialogDescription>
              Envie uma proposta de valor. A outra parte poderá aceitar, recusar ou contra-propor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (AOA)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                  className="pl-10"
                  placeholder="Ex: 15000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="Justifique a sua proposta..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendProposal} disabled={!proposedAmount}>
              <DollarSign className="h-4 w-4 mr-2" />
              Enviar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
