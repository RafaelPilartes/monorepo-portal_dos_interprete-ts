import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle, ExternalLink, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface InterpreterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interpreter: {
    slug: string;
    name: string;
    photo: string;
    location: string;
    specialties: string[];
    rating: number;
    totalReviews: number;
    bio: string;
    verified: boolean;
    languages: string[];
  } | null;
  onRequestService?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export function InterpreterPreviewModal({
  isOpen,
  onClose,
  interpreter,
  onRequestService,
  onToggleFavorite,
  isFavorite = false,
}: InterpreterPreviewModalProps) {
  if (!interpreter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Perfil do Intérprete</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={interpreter.photo} alt={interpreter.name} />
              <AvatarFallback>{interpreter.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{interpreter.name}</h3>
                {interpreter.verified && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{interpreter.location}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{interpreter.rating}</span>
                <span className="text-muted-foreground">({interpreter.totalReviews} avaliações)</span>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="text-sm font-medium mb-2">Idiomas</h4>
            <div className="flex flex-wrap gap-2">
              {interpreter.languages.map((lang) => (
                <Badge key={lang} variant="outline">{lang}</Badge>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-sm font-medium mb-2">Especialidades</h4>
            <div className="flex flex-wrap gap-2">
              {interpreter.specialties.map((spec) => (
                <Badge key={spec} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sobre</h4>
            <p className="text-sm text-muted-foreground line-clamp-4">{interpreter.bio}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onToggleFavorite}>
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isFavorite ? "Remover Favorito" : "Adicionar Favorito"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/interpreters/${interpreter.slug}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Perfil Completo
              </Link>
            </Button>
            <Button size="sm" onClick={onRequestService} className="flex-1">
              Solicitar Serviço
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
