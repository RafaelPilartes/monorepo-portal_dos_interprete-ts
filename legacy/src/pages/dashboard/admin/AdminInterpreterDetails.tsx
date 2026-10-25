import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Timeline } from "@/components/dashboard/Timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { useState } from "react";
import { ApproveInterpreterModal } from "@/components/dashboard/modals/ApproveInterpreterModal";
import { RejectInterpreterModal } from "@/components/dashboard/modals/RejectInterpreterModal";
import { toast } from "sonner";

const interpreterData = {
  id: "1",
  name: "Maria Santos",
  email: "maria.santos@email.com",
  phone: "+244 923 456 789",
  avatar: "",
  location: "Luanda, Angola",
  bio: "Intérprete profissional de Língua Gestual Angolana com mais de 5 anos de experiência em contextos médicos, jurídicos e educacionais.",
  specialties: ["Saúde", "Jurídico", "Educação"],
  languages: ["Língua Gestual Angolana", "Português"],
  status: "pending" as const,
  rating: 4.8,
  totalServices: 127,
  registeredDate: "15 Jan 2026",
  documents: [
    { id: "1", name: "Certificado de Formação", type: "PDF", date: "15 Jan 2026" },
    { id: "2", name: "Documento de Identidade", type: "PDF", date: "15 Jan 2026" },
    { id: "3", name: "Comprovativo de Residência", type: "PDF", date: "15 Jan 2026" },
  ],
  timeline: [
    { id: "1", title: "Registo na plataforma", date: "15 Jan 2026", status: "completed" as const },
    { id: "2", title: "Documentos submetidos", date: "15 Jan 2026", status: "completed" as const },
    { id: "3", title: "Análise pendente", date: "16 Jan 2026", status: "current" as const },
  ],
};

export default function AdminInterpreterDetails() {
  const { id } = useParams();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes do Intérprete"
        description="Analise o perfil e documentos do intérprete"
        action={
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin/interpreters">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={interpreterData.avatar} />
                <AvatarFallback className="text-2xl">
                  {interpreterData.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{interpreterData.name}</h2>
              <div className="mt-2">
                <StatusBadge status={interpreterData.status} />
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> {interpreterData.email}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> {interpreterData.phone}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" /> {interpreterData.location}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {interpreterData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">{specialty}</Badge>
                ))}
              </div>

              {interpreterData.status === "pending" && (
                <div className="mt-6 flex gap-2 w-full">
                  <Button className="flex-1" onClick={() => setShowApproveModal(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setShowRejectModal(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> Recusar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="info" className="space-y-4 mt-0">
                <div>
                  <h4 className="font-medium mb-2">Biografia</h4>
                  <p className="text-muted-foreground">{interpreterData.bio}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Línguas</h4>
                  <div className="flex flex-wrap gap-2">
                    {interpreterData.languages.map((lang) => (
                      <Badge key={lang} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Star className="h-4 w-4" /> Avaliação
                    </div>
                    <p className="text-2xl font-bold">{interpreterData.rating || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" /> Serviços
                    </div>
                    <p className="text-2xl font-bold">{interpreterData.totalServices}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-0">
                {interpreterData.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.type} • {doc.date}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <Timeline events={interpreterData.timeline.map(item => ({
                  id: item.id,
                  title: item.title,
                  date: item.date,
                }))} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <ApproveInterpreterModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => {
          toast.success("Intérprete aprovado com sucesso!");
          setShowApproveModal(false);
        }}
        interpreter={interpreterData}
      />

      <RejectInterpreterModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={(reason) => {
          toast.success("Intérprete recusado");
          setShowRejectModal(false);
        }}
        interpreter={interpreterData}
      />
    </div>
  );
}
