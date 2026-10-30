import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@portal-dos-interpretes/ui/components/dialog';
import { Button } from '@portal-dos-interpretes/ui/components/button';
import { Badge } from '@portal-dos-interpretes/ui/components/badge';
import { Link } from 'react-router-dom';
import { SERVICE_DETAILS } from './serviceContent';
import { ArrowRight, CheckCircle2, MapPin, Video } from 'lucide-react';

interface ServiceDetailsModalProps {
  service: {
    /** The catalog slug (catalog.services.slug): the key of its site content (serviceContent.ts). */
    slug: string;
    image?: string | undefined;
    name: string;
    description: string;
    /** "a partir de 15 000 Kz por hora" (from the database). */
    price: string;
    examples: readonly string[];
  };
  children: React.ReactNode;
}

export function ServiceDetailsModal({ service, children }: ServiceDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const details = SERVICE_DETAILS[service.slug];

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    }
    return url;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            {service.name}
            <Badge className="bg-primary/10 text-primary">Disponível</Badge>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm font-medium text-foreground">{service.price}</p>

        {/* Service Image or Video */}
        {(details?.videoUrl || service.image) && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {details?.videoUrl ? (
            <iframe
              src={getYouTubeEmbedUrl(details.videoUrl)}
              title={`Vídeo sobre ${service.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              loading="lazy"
            />
          ) : (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        )}

        {/* Full Description */}
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {details?.fullDescription ?? service.description}
          </p>

          {details && (<>
          {/* Benefits */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Benefícios</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {details.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Modalities */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Modalidades</h4>
            <div className="flex flex-wrap gap-3">
              {details.modalities.map((modality) => (
                <div key={modality.type} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                  {modality.type === 'Presencial' ? (
                    <MapPin className="h-4 w-4 text-primary" />
                  ) : (
                    <Video className="h-4 w-4 text-secondary" />
                  )}
                  <div>
                    <span className="font-medium text-foreground text-sm">{modality.type}</span>
                    <p className="text-xs text-muted-foreground">{modality.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>)}

          {/* Examples */}
          {service.examples.length > 0 && (
          <div>
            <h4 className="font-semibold text-foreground mb-3">Exemplos de Serviços</h4>
            <div className="flex flex-wrap gap-2">
              {service.examples.map((example) => (
                <Badge key={example} variant="outline" className="py-1.5 px-3">
                  {example}
                </Badge>
              ))}
            </div>
          </div>
          )}

          {/* CTA */}
          <div className="pt-4 border-t border-border">
            <Button className="w-full" size="lg" asChild onClick={() => setOpen(false)}>
              <Link to="/contact">
                Solicitar Intérprete
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
