import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { interpreters } from "@/core/mocks/interpretersMocks";
import {
  ArrowLeft,
  FileText,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Grid,
  List,
  Filter,
  Tag,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 9;

// Article categories
const categories = [
  { value: "all", label: "Todas as categorias" },
  { value: "educacao", label: "Educação" },
  { value: "saude", label: "Saúde" },
  { value: "juridico", label: "Jurídico" },
  { value: "eventos", label: "Eventos" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "inclusao", label: "Inclusão" },
];

// Sample article images
const articleImages = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop",
];

export default function InterpreterArticles() {
  const { slug } = useParams<{ slug: string }>();
  const interpreter = interpreters.find((i) => i.slug === slug);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  if (!interpreter) {
    return (
      <div className="container-wide py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Intérprete não encontrado</h1>
        <Button asChild>
          <Link to="/interpreters">Voltar aos intérpretes</Link>
        </Button>
      </div>
    );
  }

  const allArticles = interpreter.publications || [];
  
  // Apply filters
  let filteredArticles = allArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort articles
  if (sortBy === "recent") {
    filteredArticles = [...filteredArticles].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } else if (sortBy === "oldest") {
    filteredArticles = [...filteredArticles].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getArticleImage = (index: number) => {
    return articleImages[index % articleImages.length];
  };

  const hasActiveFilters = searchQuery !== "" || categoryFilter !== "all" || sortBy !== "recent";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortBy("recent");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-8">
        <div className="container-wide">
          <Link
            to={`/interpreters/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao perfil
          </Link>
          
          <div className="flex items-center gap-4">
            <img
              src={interpreter.photo}
              alt={interpreter.name}
              className="h-16 w-16 rounded-full border-2 border-secondary-foreground/20 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">Artigos de {interpreter.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {interpreter.verified && (
                  <Badge className="bg-success/20 text-success-foreground border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                <span className="text-sm opacity-80">{allArticles.length} publicações</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container-wide py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <FiltersBar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              searchPlaceholder="Pesquisar artigos..."
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
            
            <div className="flex items-center gap-2">
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px] h-9">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="popular">Mais populares</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="container-wide pb-12">
        {paginatedArticles.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h2>
            <p className="text-muted-foreground mb-4">Tente ajustar os filtros de pesquisa.</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedArticles.map((article, index) => {
              const originalIndex = allArticles.findIndex(a => a.title === article.title);
              return (
                <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
                  <Link 
                    to={`/interpreters/${slug}/articles/${originalIndex}`}
                    className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:shadow-lg transition-all h-full flex flex-col"
                  >
                    {/* Article Image */}
                    <div className="aspect-video overflow-hidden bg-muted relative">
                      <img
                        src={getArticleImage(originalIndex)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(article.date)}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                        Ler artigo completo
                        <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedArticles.map((article, index) => {
              const originalIndex = allArticles.findIndex(a => a.title === article.title);
              return (
                <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
                  <Link 
                    to={`/interpreters/${slug}/articles/${originalIndex}`}
                    className="rounded-xl bg-card border border-border/50 p-4 hover:shadow-lg transition-all flex gap-4 group"
                  >
                    {/* Article Image */}
                    <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={getArticleImage(originalIndex)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(article.date)}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                        Ler mais
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}