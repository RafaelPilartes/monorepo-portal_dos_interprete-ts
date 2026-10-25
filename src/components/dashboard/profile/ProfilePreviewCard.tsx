import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MapPin, Star, Video } from "lucide-react";

interface ProfilePreviewCardProps {
  name: string;
  photo?: string;
  specialty?: string;
  modality: "presencial" | "online" | "ambos";
  rating?: number;
  verified?: boolean;
  minimumHourlyRate?: number;
  openToNegotiation?: boolean;
  languages?: string[];
  specialties?: string[];
}

export function ProfilePreviewCard({
  name,
  photo,
  specialty,
  modality,
  rating,
  verified,
  minimumHourlyRate,
  openToNegotiation,
  languages,
  specialties,
}: ProfilePreviewCardProps) {
  const modalityLabel = {
    presencial: "Presencial",
    online: "Online",
    ambos: "Híbrido",
  };
  const ModalityIcon = modality === "online" ? Video : MapPin;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={photo} alt={name} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Badge className="gap-1.5">
            <ModalityIcon className="h-3 w-3" />
            {modalityLabel[modality]}
          </Badge>
          {verified && (
            <Badge className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verificado
            </Badge>
          )}
        </div>
        {rating && (
          <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 flex items-center gap-1">
            <Star className="h-4 w-4 text-warning fill-warning" />
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        {specialty && <p className="text-sm text-primary font-medium mb-2">{specialty}</p>}
        
        {minimumHourlyRate && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {minimumHourlyRate.toLocaleString("pt-AO")} Kz/h
            </span>
            {openToNegotiation && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                Negociável
              </Badge>
            )}
          </div>
        )}

        {specialties && specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specialties.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        )}

        {languages && languages.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {languages.slice(0, 2).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}