import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Card, CardContent } from "@portal-dos-interpretes/ui/components/card";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { FiltersBar } from "@portal-dos-interpretes/ui/components/filters-bar";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import {
  Users,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  Heart,
  Eye,
  Send,
  DollarSign,
  MessageCircle,
  SlidersHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portal-dos-interpretes/ui/components/select";
import { Slider } from "@portal-dos-interpretes/ui/components/slider";
import { Label } from "@portal-dos-interpretes/ui/components/label";
import { Switch } from "@portal-dos-interpretes/ui/components/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@portal-dos-interpretes/ui/components/sheet";
import { interpreters } from "@portal-dos-interpretes/features/mocks/interpretersMocks";

const specialties = [
  { value: "all", label: "Todas Especialidades" },
  { value: "Educação", label: "Educação" },
  { value: "Saúde", label: "Saúde" },
  { value: "Eventos", label: "Eventos" },
  { value: "Jurídico", label: "Jurídico" },
  { value: "Empresarial", label: "Empresarial" },
  { value: "Religioso", label: "Religioso" },
  { value: "Tecnologia", label: "Tecnologia" },
];

const modalities = [
  { value: "all", label: "Todas Modalidades" },
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "ambos", label: "Híbrido" },
];

const priceRanges = [
  { value: "all", label: "Qualquer preço" },
  { value: "0-10000", label: "Até 10.000 AOA/h" },
  { value: "10000-15000", label: "10.000 - 15.000 AOA/h" },
  { value: "15000-20000", label: "15.000 - 20.000 AOA/h" },
  { value: "20000+", label: "Acima de 20.000 AOA/h" },
];

export default function BrowseInterpreters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [onlyNegotiable, setOnlyNegotiable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [minRating, setMinRating] = useState([0]);
  const [favorites, setFavorites] = useState<string[]>(["maria-silva", "ana-beatriz-fernandes"]);

  const filteredInterpreters = interpreters.filter((interpreter) => {
    const matchesSearch = interpreter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interpreter.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || 
      interpreter.areas?.includes(specialtyFilter) ||
      interpreter.specialty.includes(specialtyFilter);
    const matchesModality = modalityFilter === "all" || interpreter.modality === modalityFilter || interpreter.modality === "ambos";
    
    // Price range filter
    let matchesPrice = true;
    if (priceRangeFilter !== "all" && interpreter.minimumHourlyRate) {
      const rate = interpreter.minimumHourlyRate;
      switch (priceRangeFilter) {
        case "0-10000":
          matchesPrice = rate <= 10000;
          break;
        case "10000-15000":
          matchesPrice = rate > 10000 && rate <= 15000;
          break;
        case "15000-20000":
          matchesPrice = rate > 15000 && rate <= 20000;
          break;
        case "20000+":
          matchesPrice = rate > 20000;
          break;
      }
    } else if (priceRangeFilter !== "all" && !interpreter.minimumHourlyRate) {
      matchesPrice = true; // Include interpreters without fixed rate
    }

    const matchesNegotiable = !onlyNegotiable || interpreter.openToNegotiation;
    const matchesVerified = !onlyVerified || interpreter.verified;
    const matchesRating = !interpreter.rating || interpreter.rating >= (minRating[0] ?? 0);
    
    return matchesSearch && matchesSpecialty && matchesModality && matchesPrice && matchesNegotiable && matchesVerified && matchesRating;
  });

  const toggleFavorite = (slug: string) => {
    setFavorites(prev => 
      prev.includes(slug) ? prev.filter(f => f !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSpecialtyFilter("all");
    setModalityFilter("all");
    setPriceRangeFilter("all");
    setOnlyNegotiable(false);
    setOnlyVerified(false);
    setMinRating([0]);
  };

  const hasActiveFilters = searchQuery !== "" || 
    specialtyFilter !== "all" || 
    modalityFilter !== "all" || 
    priceRangeFilter !== "all" || 
    onlyNegotiable || 
    onlyVerified ||
    (minRating[0] ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intérpretes"
        description="Explore os intérpretes verificados pela plataforma."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <FiltersBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Pesquisar intérpretes..."
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((spec) => (
                <SelectItem key={spec.value} value={spec.value}>
                  {spec.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              {modalities.map((mod) => (
                <SelectItem key={mod.value} value={mod.value}>
                  {mod.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Faixa de preço" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros Avançados</SheetTitle>
                <SheetDescription>
                  Refine a sua pesquisa com filtros adicionais
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Apenas Verificados</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar apenas intérpretes verificados
                    </p>
                  </div>
                  <Switch
                    checked={onlyVerified}
                    onCheckedChange={setOnlyVerified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Abertos a Negociação</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar apenas quem aceita negociar preço
                    </p>
                  </div>
                  <Switch
                    checked={onlyNegotiable}
                    onCheckedChange={setOnlyNegotiable}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Avaliação Mínima</Label>
                    <span className="text-sm font-medium">{(minRating[0] ?? 0).toFixed(1)}+</span>
                  </div>
                  <Slider
                    value={minRating}
                    onValueChange={setMinRating}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Qualquer</span>
                    <span>5.0</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Limpar Todos os Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {specialtyFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {specialties.find(s => s.value === specialtyFilter)?.label}
              <button onClick={() => setSpecialtyFilter("all")} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {modalityFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {modalities.find(m => m.value === modalityFilter)?.label}
              <button onClick={() => setModalityFilter("all")} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {priceRangeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {priceRanges.find(p => p.value === priceRangeFilter)?.label}
              <button onClick={() => setPriceRangeFilter("all")} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {onlyNegotiable && (
            <Badge variant="secondary" className="gap-1">
              Aberto a negociação
              <button onClick={() => setOnlyNegotiable(false)} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {onlyVerified && (
            <Badge variant="secondary" className="gap-1">
              Verificados
              <button onClick={() => setOnlyVerified(false)} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {(minRating[0] ?? 0) > 0 && (
            <Badge variant="secondary" className="gap-1">
              ≥ {(minRating[0] ?? 0).toFixed(1)} estrelas
              <button onClick={() => setMinRating([0])} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredInterpreters.length} intérprete{filteredInterpreters.length !== 1 ? "s" : ""} encontrado{filteredInterpreters.length !== 1 ? "s" : ""}
      </p>

      {filteredInterpreters.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInterpreters.map((interpreter) => (
            <Card key={interpreter.slug} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={interpreter.photo}
                    alt={interpreter.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(interpreter.slug)}
                  >
                    <Heart 
                      className={`h-5 w-5 ${favorites.includes(interpreter.slug) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                  {interpreter.verified && (
                    <Badge className="absolute top-2 left-2 bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  {interpreter.openToNegotiation && (
                    <Badge variant="outline" className="absolute bottom-2 left-2 bg-background/80">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Negociável
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{interpreter.name}</h3>
                  <p className="text-sm text-primary font-medium">{interpreter.specialty}</p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {interpreter.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="text-sm font-medium">{interpreter.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {interpreter.modality === "presencial" && <MapPin className="h-3 w-3 mr-1" />}
                      {interpreter.modality === "online" && <Video className="h-3 w-3 mr-1" />}
                      {interpreter.modality === "ambos" ? "Híbrido" : interpreter.modality === "presencial" ? "Presencial" : "Online"}
                    </Badge>
                    {interpreter.minimumHourlyRate && (
                      <Badge variant="secondary" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        {(interpreter.minimumHourlyRate / 1000).toFixed(0)}k AOA/h
                      </Badge>
                    )}
                  </div>

                  {interpreter.areas && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {interpreter.areas.slice(0, 3).map((area) => (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/interpreters/${interpreter.slug}`}>
                        <Eye className="h-4 w-4" />
                        Ver Perfil
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to={`/requests/new?interpreter=${interpreter.slug}`}>
                        <Send className="h-4 w-4" />
                        Solicitar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum intérprete encontrado"
          description="Tente ajustar os filtros de pesquisa."
        />
      )}
    </div>
  );
}
