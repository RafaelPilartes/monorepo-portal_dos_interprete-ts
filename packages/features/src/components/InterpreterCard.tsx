import { Link } from "react-router-dom";
import { Button } from "@portal-dos-interpretes/ui/components/button";
import { Badge } from "@portal-dos-interpretes/ui/components/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@portal-dos-interpretes/ui/components/tooltip";
import { MapPin, Video, Star, ArrowRight, ShieldCheck } from "lucide-react";

export interface InterpreterEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface InterpreterCertification {
  name: string;
  issuer: string;
  year: string;
}

export interface InterpreterVideo {
  title: string;
  url: string;
  type: "apresentacao" | "trabalho" | "palestra" | "aula";
}

export interface InterpreterPublication {
  title: string;
  date: string;
  excerpt: string;
}

export interface InterpreterReview {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface InterpreterAvailability {
  weekdays: string[];
  hours: string;
  notice: string;
}

export interface InterpreterData {
  slug: string;
  name: string;
  photo: string;
  specialty: string;
  specialties?: string[];
  modality: "presencial" | "online" | "ambos";
  rating?: number;
  verified?: boolean;
  bio?: string;
  experience?: string;
  languages?: string[];
  areas?: string[];
  education?: InterpreterEducation[];
  certifications?: InterpreterCertification[];
  videos?: InterpreterVideo[];
  publications?: InterpreterPublication[];
  reviews?: InterpreterReview[];
  availability?: InterpreterAvailability;
  minimumHourlyRate?: number;
  openToNegotiation?: boolean;
}

interface InterpreterCardProps {
  interpreter: InterpreterData;
  compact?: boolean;
  /**
   * Where "see profile" leads. Defaults to the in-app profile route; the public
   * site points it at the requester login (D-05, architecture.md §3).
   */
  profileHref?: (slug: string) => string
}

export function InterpreterCard({ interpreter, compact = false, profileHref }: InterpreterCardProps) {
  const href = profileHref ? profileHref(interpreter.slug) : null
  const modalityLabel = {
    presencial: "Presencial",
    online: "Online",
    ambos: "Híbrido"
  };

  const ModalityIcon = interpreter.modality === "online" ? Video : MapPin;

  if (compact) {
    return (
      <div className="group relative rounded-2xl overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 h-full">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={interpreter.photo} alt={interpreter.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {interpreter.verified && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 right-3 rounded-full bg-success px-2.5 py-1 flex items-center gap-1 shadow-lg cursor-help">
                  <ShieldCheck className="h-3 w-3 text-success-foreground" />
                  <span className="text-xs font-medium text-success-foreground">Verificado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-sm">Intérprete com credenciais validadas na Plataforma</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-white text-lg mb-1">{interpreter.name}</h3>
            <p className="text-white/80 text-sm mb-2">{interpreter.specialty}</p>
            {interpreter.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="text-white text-sm font-medium">{interpreter.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <ModalityIcon className="h-4 w-4" />
            <span>{modalityLabel[interpreter.modality]}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground hover:bg-primary" asChild>
            {href ? (
            <a href={href}>Ver Perfil<ArrowRight className="h-3 w-3" /></a>
          ) : (
            <Link to={`/interpreters/${interpreter.slug}`}>Ver Perfil<ArrowRight className="h-3 w-3" /></Link>
          )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={interpreter.photo} alt={interpreter.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <div className={`rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-medium ${interpreter.modality === "online" ? "bg-secondary/90 text-secondary-foreground" : "bg-primary/90 text-primary-foreground"}`}>
            <ModalityIcon className="h-3 w-3" />
            {modalityLabel[interpreter.modality]}
          </div>
          {interpreter.verified && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full bg-success px-2.5 py-1 flex items-center gap-1 shadow-lg cursor-help">
                  <ShieldCheck className="h-3 w-3 text-success-foreground" />
                  <span className="text-xs font-medium text-success-foreground">Verificado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-sm">Intérprete com credenciais validadas na Plataforma</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {interpreter.rating && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 flex items-center gap-1">
            <Star className="h-4 w-4 text-warning fill-warning" />
            <span className="text-white text-sm font-semibold">{interpreter.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-lg mb-1">{interpreter.name}</h3>
        <p className="text-gradient text-sm font-medium mb-2">{interpreter.specialty}</p>
        
        {/* Minimum Hourly Rate */}
        {interpreter.minimumHourlyRate && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {interpreter.minimumHourlyRate.toLocaleString('pt-AO')} Kz/h
            </span>
            {interpreter.openToNegotiation && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                Negociável
              </Badge>
            )}
          </div>
        )}
        
        {interpreter.specialties && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {interpreter.specialties.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs py-0.5">{spec}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {interpreter.experience && <span>{interpreter.experience}</span>}
          {interpreter.languages && <span>{interpreter.languages.slice(0, 2).join(", ")}</span>}
        </div>
        <Button className="w-full" asChild>
          {href ? (
            <a href={href}>Ver Perfil Completo<ArrowRight className="h-4 w-4" /></a>
          ) : (
            <Link to={`/interpreters/${interpreter.slug}`}>Ver Perfil Completo<ArrowRight className="h-4 w-4" /></Link>
          )}
        </Button>
      </div>
    </div>
  );
}
