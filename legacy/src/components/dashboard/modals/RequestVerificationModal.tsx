import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  X, 
  Shield, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface RequestVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRenewal?: boolean;
}

const planDetails = {
  name: "Verificação Profissional",
  price: 15000,
  currency: "Kz",
  period: "mês",
  benefits: [
    "Badge de verificado no perfil público",
    "Maior destaque na listagem",
    "Prioridade em solicitações abertas",
    "Mais confiança para solicitantes",
  ],
};

export function RequestVerificationModal({
  open,
  onOpenChange,
  isRenewal = false,
}: RequestVerificationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      toast.error("Apenas ficheiros PDF são aceites");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("O ficheiro deve ter no máximo 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Por favor, anexe o comprovativo de pagamento");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(
      isRenewal
        ? "Pedido de renovação enviado com sucesso!"
        : "Pedido de verificação enviado com sucesso!",
      {
        description: "Iremos analisar e responder em até 48 horas.",
      }
    );

    setIsSubmitting(false);
    setFile(null);
    setNotes("");
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFile(null);
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isRenewal ? "Renovar Verificação" : "Solicitar Verificação"}
          </DialogTitle>
          <DialogDescription>
            {isRenewal
              ? "Renove a sua verificação para manter os benefícios premium"
              : "Obtenha o badge de verificado e aumente a sua visibilidade"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{planDetails.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Validade: 30 dias
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {planDetails.price.toLocaleString("pt-AO")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {planDetails.currency}/{planDetails.period}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {planDetails.benefits.map((benefit, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {benefit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Info */}
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Método de Pagamento
            </h4>
            <p className="text-sm text-muted-foreground">
              Transferência Bancária ou Multicaixa Express para:
            </p>
            <div className="mt-2 text-sm font-mono bg-background rounded p-2">
              <p>IBAN: AO06.0006.0000.1234.5678.9012.3</p>
              <p>Nome: Grace Mind Services</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="payment-proof">
              Comprovativo de Pagamento{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-success bg-success/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="payment-proof"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    Arraste o ficheiro ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas PDF (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione alguma observação relevante..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submeter Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
