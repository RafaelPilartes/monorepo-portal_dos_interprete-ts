import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@portal-dos-interpretes/ui/components/dialog";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Input } from "@portal-dos-interpretes/ui/components/input";
import { Textarea } from "@portal-dos-interpretes/ui/components/textarea";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@portal-dos-interpretes/ui/components/select";
import { Award, Upload } from "lucide-react";

interface CreateSuccessCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { title: string; summary: string; content: string; category: string }) => void;
}

const categories = [
  { value: "Educação", label: "Educação" },
  { value: "Saúde", label: "Saúde" },
  { value: "Jurídico", label: "Jurídico" },
  { value: "Eventos", label: "Eventos" },
  { value: "Religioso", label: "Religioso" },
  { value: "Empresarial", label: "Empresarial" },
];

export function CreateSuccessCaseModal({
  isOpen,
  onClose,
  onConfirm,
}: CreateSuccessCaseModalProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const handleConfirm = () => {
    onConfirm({ title, summary, content, category });
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Novo Caso de Sucesso</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Partilhe uma história de impacto da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Acesso à Educação Superior"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resumo</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Um breve resumo da história..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>História Completa</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conte a história de impacto em detalhe..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique para fazer upload ou arraste uma imagem
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!title || !summary || !category}>
            Criar Caso de Sucesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
