import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Upload, Video } from "lucide-react";

interface CreateTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { author: string; role: string; content: string; type: string }) => void;
}

export function CreateTestimonialModal({
  isOpen,
  onClose,
  onConfirm,
}: CreateTestimonialModalProps) {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");

  const handleConfirm = () => {
    onConfirm({ author, role, content, type });
    setAuthor("");
    setRole("");
    setContent("");
    setType("text");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Novo Testemunho</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Adicione um testemunho para exibir no site público.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Testemunho</Label>
            <RadioGroup value={type} onValueChange={setType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="cursor-pointer">Texto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="cursor-pointer">Vídeo</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor"
              />
            </div>
            <div className="space-y-2">
              <Label>Função/Organização</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Solicitante, Hospital Central..."
              />
            </div>
          </div>

          {type === "text" ? (
            <div className="space-y-2">
              <Label>Testemunho</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O conteúdo do testemunho..."
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Vídeo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para fazer upload ou arraste um vídeo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ou cole um link do YouTube/Vimeo
                </p>
              </div>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!author || !role}>
            Criar Testemunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
