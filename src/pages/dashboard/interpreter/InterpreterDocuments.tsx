import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, CheckCircle, Clock, XCircle, Eye, Trash2, AlertTriangle } from "lucide-react";
import { UploadDocumentModal } from "@/components/dashboard/modals/UploadDocumentModal";
import { toast } from "sonner";

const documents = [
  { id: "doc-1", name: "Certificado de Formação em LGA", type: "certification", status: "approved", uploadedAt: "10 Jan 2026", expiresAt: "10 Jan 2028" },
  { id: "doc-2", name: "Diploma Universitário", type: "education", status: "approved", uploadedAt: "5 Jan 2026" },
  { id: "doc-3", name: "Comprovativo de Residência", type: "identity", status: "pending", uploadedAt: "15 Jan 2026" },
  { id: "doc-4", name: "Certificação em Saúde", type: "specialization", status: "rejected", uploadedAt: "12 Jan 2026", rejectionReason: "Documento ilegível. Por favor, envie uma cópia mais clara." },
];

const requiredDocuments = [
  { type: "identity", name: "Documento de Identidade", status: "complete" },
  { type: "certification", name: "Certificação em Língua Gestual", status: "complete" },
  { type: "education", name: "Comprovativo de Formação", status: "complete" },
  { type: "residence", name: "Comprovativo de Residência", status: "pending" },
  { type: "criminal", name: "Registo Criminal", status: "missing" },
];

const statusConfig = {
  approved: { label: "Aprovado", icon: CheckCircle, color: "text-green-600" },
  pending: { label: "Em Análise", icon: Clock, color: "text-yellow-600" },
  rejected: { label: "Rejeitado", icon: XCircle, color: "text-red-600" },
};

export default function InterpreterDocuments() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const completedDocs = requiredDocuments.filter(d => d.status === "complete").length;
  const progress = (completedDocs / requiredDocuments.length) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gerencie os seus documentos de validação"
        action={
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Enviar Documento
          </Button>
        }
      />

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Validação</CardTitle>
          <CardDescription>Complete a documentação para ativar o seu perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{completedDocs} de {requiredDocuments.length} documentos</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {requiredDocuments.map((doc) => (
              <div key={doc.type} className="flex items-center gap-2 p-2 rounded border">
                {doc.status === "complete" && <CheckCircle className="h-4 w-4 text-green-600" />}
                {doc.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                {doc.status === "missing" && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${doc.status === "missing" ? "text-muted-foreground" : ""}`}>
                  {doc.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => {
              const status = statusConfig[doc.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div key={doc.id} className="flex items-start justify-between p-4 rounded-lg border">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">Enviado em {doc.uploadedAt}</p>
                      {doc.expiresAt && (
                        <p className="text-sm text-muted-foreground">Válido até {doc.expiresAt}</p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-sm text-red-600">{doc.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm">{status.label}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {doc.status === "rejected" && (
                        <Button variant="ghost" size="icon" onClick={() => setShowUploadModal(true)}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(file, type) => {
          toast.success("Documento enviado com sucesso!");
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
