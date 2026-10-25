import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, DollarSign, Download } from "lucide-react";

interface EarningsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  earning: {
    id: string;
    service: string;
    date: string;
    hours: number;
    rate: number;
    total: number;
    status: string;
  } | null;
}

export function EarningsDetailsModal({
  isOpen,
  onClose,
  earning,
}: EarningsDetailsModalProps) {
  if (!earning) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{earning.service}</h3>
              <Badge variant={earning.status === "paid" ? "default" : "secondary"}>
                {earning.status === "paid" ? "Pago" : "Pendente"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{earning.date}</span>
            </div>
          </div>

          <Separator />

          {/* Calculation */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cálculo</h4>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Horas trabalhadas</span>
                <span>{earning.hours}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa por hora</span>
                <span>{formatCurrency(earning.rate)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(earning.total)}</span>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Referência</h4>
            <p className="text-sm text-muted-foreground font-mono">#{earning.id}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Recibo
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
