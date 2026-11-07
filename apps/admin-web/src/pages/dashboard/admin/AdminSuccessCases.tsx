import { useState } from "react";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { FiltersBar } from "@portal-dos-interpretes/ui/components/filters-bar";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import { Card, CardContent } from "@portal-dos-interpretes/ui/components/card";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { Award, Plus, Edit, Trash2, Eye } from "lucide-react";
import { CreateSuccessCaseModal } from "@/components/dashboard/modals/CreateSuccessCaseModal";
import { ConfirmationModal } from "@portal-dos-interpretes/ui/components/confirmation-modal";
import { toast } from "sonner";

const successCases = [
  { 
    id: "1", 
    title: "Acesso à Educação Superior", 
    summary: "Como a interpretação possibilitou a formação universitária de um estudante surdo.", 
    category: "Educação",
    image: "/placeholder.svg",
    status: "published", 
    date: "15 Jan 2026" 
  },
  { 
    id: "2", 
    title: "Comunicação Hospitalar Eficaz", 
    summary: "Paciente surdo conseguiu acompanhamento médico completo durante tratamento oncológico.", 
    category: "Saúde",
    image: "/placeholder.svg",
    status: "published", 
    date: "14 Jan 2026" 
  },
  { 
    id: "3", 
    title: "Justiça Acessível", 
    summary: "Intérprete garantiu a defesa adequada de réu surdo em processo judicial.", 
    category: "Jurídico",
    image: "/placeholder.svg",
    status: "draft", 
    date: "13 Jan 2026" 
  },
  { 
    id: "4", 
    title: "Celebração Inclusiva", 
    summary: "Casamento com interpretação em tempo real para convidados surdos.", 
    category: "Eventos",
    image: "/placeholder.svg",
    status: "published", 
    date: "12 Jan 2026" 
  },
];

const categoryFilters = [
  { value: "all", label: "Todas" },
  { value: "Educação", label: "Educação" },
  { value: "Saúde", label: "Saúde" },
  { value: "Jurídico", label: "Jurídico" },
  { value: "Eventos", label: "Eventos" },
];

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

export default function AdminSuccessCases() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<typeof successCases[0] | null>(null);

  const filteredCases = successCases.filter((sc) => {
    const matchesSearch = sc.title.toLowerCase().includes(search.toLowerCase()) ||
      sc.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || sc.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || sc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (successCase: typeof successCases[0]) => {
    setSelectedCase(successCase);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Casos de Sucesso"
        description="Histórias de impacto da plataforma"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Caso
          </Button>
        }
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar casos..."
        filters={[
          {
            name: "category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: categoryFilters,
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
          setCategoryFilter("all");
          setStatusFilter("all");
        }}
        hasActiveFilters={search !== "" || categoryFilter !== "all" || statusFilter !== "all"}
      />

      {filteredCases.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Nenhum caso encontrado"
          description="Crie o primeiro caso de sucesso para exibir no site"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Caso
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCases.map((successCase) => (
            <Card key={successCase.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <img 
                  src={successCase.image} 
                  alt={successCase.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={successCase.status === "published" ? "default" : "secondary"}>
                    {successCase.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{successCase.category}</Badge>
                    </div>
                    <h3 className="font-semibold line-clamp-1">{successCase.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{successCase.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">{successCase.date}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(successCase)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSuccessCaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={(_data) => {
          toast.success("Caso de sucesso criado!");
          setShowCreateModal(false);
        }}
      />

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={() => {
          toast.success("Caso eliminado");
          setShowDeleteModal(false);
        }}
        title="Eliminar Caso"
        description={`Tem certeza que deseja eliminar "${selectedCase?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
