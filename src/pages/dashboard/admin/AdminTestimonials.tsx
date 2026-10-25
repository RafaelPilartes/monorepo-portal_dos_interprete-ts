import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Edit, Trash2, Eye, Video, Image } from "lucide-react";
import { CreateTestimonialModal } from "@/components/dashboard/modals/CreateTestimonialModal";
import { ConfirmationModal } from "@/components/dashboard/ConfirmationModal";
import { VideoModal } from "@/components/dashboard/VideoModal";
import { toast } from "sonner";

const testimonials = [
  { id: "1", author: "João Silva", role: "Solicitante", content: "O serviço foi excelente! A intérprete Maria Santos foi muito profissional e atenciosa.", type: "text", status: "published", date: "15 Jan 2026" },
  { id: "2", author: "Hospital Central", role: "Instituição", content: "", type: "video", videoUrl: "https://example.com/video.mp4", status: "published", date: "14 Jan 2026" },
  { id: "3", author: "Ana Costa", role: "Solicitante", content: "Graças ao Portal, consegui comunicar com os médicos durante todo o tratamento.", type: "text", status: "draft", date: "13 Jan 2026" },
  { id: "4", author: "Universidade ISPL", role: "Instituição", content: "", type: "video", videoUrl: "https://example.com/video2.mp4", status: "published", date: "12 Jan 2026" },
];

const typeFilters = [
  { value: "all", label: "Todos" },
  { value: "text", label: "Texto" },
  { value: "video", label: "Vídeo" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

export default function AdminTestimonials() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<typeof testimonials[0] | null>(null);

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const matchesSearch = testimonial.author.toLowerCase().includes(search.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || testimonial.type === typeFilter;
    const matchesStatus = statusFilter === "all" || testimonial.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = (testimonial: typeof testimonials[0]) => {
    setSelectedTestimonial(testimonial);
    setShowDeleteModal(true);
  };

  const handleViewVideo = (testimonial: typeof testimonials[0]) => {
    setSelectedTestimonial(testimonial);
    setShowVideoModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Testemunhos"
        description="Crie e gerencie testemunhos para o site público"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Testemunho
          </Button>
        }
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar testemunhos..."
        filters={[
          {
            name: "type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: typeFilters,
          },
          {
            name: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusFilters,
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setTypeFilter("all");
          setStatusFilter("all");
        }}
        hasActiveFilters={search !== "" || typeFilter !== "all" || statusFilter !== "all"}
      />

      {filteredTestimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhum testemunho encontrado"
          description="Crie o primeiro testemunho para exibir no site"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Testemunho
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {testimonial.type === "video" ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-semibold">{testimonial.author}</span>
                      <Badge variant="secondary">{testimonial.role}</Badge>
                      <Badge variant={testimonial.status === "published" ? "default" : "outline"}>
                        {testimonial.status === "published" ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    
                    {testimonial.type === "text" ? (
                      <p className="text-muted-foreground line-clamp-3">{testimonial.content}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span>Testemunho em vídeo</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">{testimonial.date}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {testimonial.type === "video" && (
                      <Button variant="ghost" size="icon" onClick={() => handleViewVideo(testimonial)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTestimonialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={(data) => {
          toast.success("Testemunho criado com sucesso!");
          setShowCreateModal(false);
        }}
      />

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={() => {
          toast.success("Testemunho eliminado");
          setShowDeleteModal(false);
        }}
        title="Eliminar Testemunho"
        description={`Tem certeza que deseja eliminar o testemunho de "${selectedTestimonial?.author}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <VideoModal
        open={showVideoModal}
        onOpenChange={setShowVideoModal}
        title={`Testemunho de ${selectedTestimonial?.author}`}
        videoUrl={selectedTestimonial?.videoUrl || ""}
      />
    </div>
  );
}
