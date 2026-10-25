import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X } from "lucide-react";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: string) => void;
}

const documentTypes = [
  { value: "identity", label: "Documento de Identidade" },
  { value: "certification", label: "Certificação em Língua Gestual" },
  { value: "education", label: "Diploma/Certificado Académico" },
  { value: "specialization", label: "Certificação de Especialidade" },
  { value: "residence", label: "Comprovativo de Residência" },
  { value: "criminal", label: "Registo Criminal" },
  { value: "other", label: "Outro" },
];

export function UploadDocumentModal({
  isOpen,
  onClose,
  onUpload,
}: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file && documentType) {
      onUpload(file, documentType);
      setFile(null);
      setDocumentType("");
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento e faça o upload do ficheiro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ficheiro</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste o ficheiro aqui ou
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Ficheiro
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG ou PNG (máx. 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || !documentType}>
            <Upload className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
