import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { VideoModal } from "@/components/dashboard/VideoModal";
import { interpreters } from "@/core/mocks/interpretersMocks";
import {
  ArrowLeft,
  Play,
  Filter,
  Grid,
  List,
  Star,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 8;

const videoTypes = [
  { value: "all", label: "Todos os Tipos" },
  { value: "apresentacao", label: "Apresentação" },
  { value: "palestra", label: "Palestra" },
  { value: "trabalho", label: "Trabalho" },
  { value: "tutorial", label: "Tutorial" },
  { value: "testemunho", label: "Testemunho" },
];

function getEmbedUrl(url: string): string {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
  }
  return url;
}

function getThumbnailUrl(url: string): string {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
  }
  return "";
}

export default function InterpreterVideos() {
  const { slug } = useParams<{ slug: string }>();
  const interpreter = interpreters.find((i) => i.slug === slug);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string } | null>(null);

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

  const allVideos = interpreter.videos || [];
  
  const filteredVideos = allVideos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || video.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container-wide">
          <Link
            to={`/interpreters/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao perfil
          </Link>
          
          <div className="flex items-center gap-4">
            <img
              src={interpreter.photo}
              alt={interpreter.name}
              className="h-16 w-16 rounded-full border-2 border-primary-foreground/20 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">Vídeos de {interpreter.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {interpreter.verified && (
                  <Badge className="bg-success/20 text-success-foreground border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                <span className="text-sm opacity-80">{allVideos.length} vídeos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container-wide py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FiltersBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Pesquisar vídeos..."
          />
          
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {videoTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
      </div>

      {/* Videos */}
      <div className="container-wide pb-12">
        {paginatedVideos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum vídeo encontrado</h2>
            <p className="text-muted-foreground">Tente ajustar os filtros de pesquisa.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedVideos.map((video, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
                <div
                  className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedVideo({ title: video.title, url: video.url })}
                >
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={getThumbnailUrl(video.url)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-7 w-7 text-primary ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2">{video.title}</h3>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {video.type}
                    </Badge>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedVideos.map((video, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 50}>
                <div
                  className="flex gap-4 rounded-xl bg-card border border-border/50 p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedVideo({ title: video.title, url: video.url })}
                >
                  <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={getThumbnailUrl(video.url)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{video.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {video.type}
                    </Badge>
                  </div>
                </div>
              </AnimatedSection>
            ))}
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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          open={!!selectedVideo}
          onOpenChange={(open) => !open && setSelectedVideo(null)}
          title={selectedVideo.title}
          videoUrl={selectedVideo.url}
        />
      )}
    </div>
  );
}
