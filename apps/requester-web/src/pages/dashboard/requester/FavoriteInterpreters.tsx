import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Card, CardContent } from "@portal-dos-interpretes/ui/components/card";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { PageHeader } from "@portal-dos-interpretes/ui/components/page-header";
import { EmptyState } from "@portal-dos-interpretes/ui/components/empty-state";
import {
  Heart,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import { interpreters } from "@portal-dos-interpretes/features/mocks/interpretersMocks";
import { ConfirmationModal } from "@portal-dos-interpretes/ui/components/confirmation-modal";

export default function FavoriteInterpreters() {
  const [favoritesSlugs, setFavoritesSlugs] = useState<string[]>(["maria-silva", "ana-beatriz-fernandes", "joao-pedro-antonio"]);
  const [removeSlug, setRemoveSlug] = useState<string | null>(null);

  const favoriteInterpreters = interpreters.filter((i) => favoritesSlugs.includes(i.slug));

  const handleRemove = () => {
    if (removeSlug) {
      setFavoritesSlugs(prev => prev.filter(s => s !== removeSlug));
      setRemoveSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intérpretes Favoritos"
        description="Os intérpretes que você marcou como favoritos."
        action={
          <Button variant="outline" asChild>
            <Link to="/interpreters">
              Ver Todos os Intérpretes
            </Link>
          </Button>
        }
      />

      {favoriteInterpreters.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteInterpreters.map((interpreter) => (
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
                    onClick={() => setRemoveSlug(interpreter.slug)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 fill-destructive text-destructive" />
                    {interpreter.verified && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{interpreter.name}</h3>
                  <p className="text-sm text-primary font-medium">{interpreter.specialty}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
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
                  </div>

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
          icon={Heart}
          title="Nenhum favorito"
          description="Você ainda não adicionou intérpretes aos seus favoritos."
          action={
            <Button asChild>
              <Link to="/interpreters">
                Explorar Intérpretes
              </Link>
            </Button>
          }
        />
      )}

      <ConfirmationModal
        open={!!removeSlug}
        onOpenChange={(open) => !open && setRemoveSlug(null)}
        title="Remover dos Favoritos"
        description="Tem a certeza que deseja remover este intérprete dos seus favoritos?"
        confirmLabel="Sim, remover"
        onConfirm={handleRemove}
        variant="warning"
      />
    </div>
  );
}
