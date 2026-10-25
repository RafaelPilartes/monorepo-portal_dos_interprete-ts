import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, Video, Clock } from 'lucide-react';

interface ServiceDetailsModalProps {
  service: {
    image: string;
    name: string;
    description: string;
    examples: string[];
  };
  children: React.ReactNode;
}

// Extended service details
const serviceDetails: Record<string, {
  fullDescription: string;
  benefits: string[];
  modalities: { type: string; description: string }[];
  duration: string;
  videoUrl?: string;
}> = {
  'Educação': {
    fullDescription: 'Oferecemos serviços de interpretação especializados para o sector educacional, desde o ensino primário até ao ensino superior. Os nossos intérpretes são formados especificamente para contextos académicos, garantindo que alunos surdos tenham acesso pleno à educação.',
    benefits: [
      'Intérpretes com formação pedagógica',
      'Conhecimento de terminologia académica',
      'Experiência em todas as faixas etárias',
      'Apoio em exames e avaliações'
    ],
    modalities: [
      { type: 'Presencial', description: 'Acompanhamento em sala de aula' },
      { type: 'Online', description: 'Interpretação para aulas virtuais' }
    ],
    duration: 'Por hora, dia ou semestre',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  'Saúde': {
    fullDescription: 'Garantimos que pacientes surdos tenham acesso completo aos serviços de saúde. Os nossos intérpretes especializados em saúde conhecem a terminologia médica e são treinados para situações sensíveis e de emergência.',
    benefits: [
      'Intérpretes com formação em terminologia médica',
      'Disponibilidade para urgências',
      'Confidencialidade garantida',
      'Experiência em hospitais e clínicas'
    ],
    modalities: [
      { type: 'Presencial', description: 'Acompanhamento em consultas e internamentos' },
      { type: 'Online', description: 'Teleconsultas e acompanhamento remoto' }
    ],
    duration: 'Por consulta ou hora',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  'Jurídico': {
    fullDescription: 'Asseguramos o acesso à justiça para pessoas surdas através de interpretação profissional em todos os contextos legais. Os nossos intérpretes jurídicos são certificados e conhecem os procedimentos legais angolanos.',
    benefits: [
      'Certificação em interpretação jurídica',
      'Conhecimento de procedimentos legais',
      'Imparcialidade e ética profissional',
      'Experiência em tribunais e esquadras'
    ],
    modalities: [
      { type: 'Presencial', description: 'Audiências, depoimentos e consultas' },
      { type: 'Online', description: 'Videochamadas com advogados' }
    ],
    duration: 'Por hora ou sessão',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  'Eventos': {
    fullDescription: 'Tornamos eventos acessíveis a todos os participantes através de interpretação profissional. Cobrimos desde pequenas reuniões até grandes conferências internacionais, garantindo qualidade e profissionalismo.',
    benefits: [
      'Experiência em grandes eventos',
      'Equipamento técnico disponível',
      'Equipas de intérpretes coordenadas',
      'Preparação prévia do conteúdo'
    ],
    modalities: [
      { type: 'Presencial', description: 'Interpretação no palco ou zona designada' },
      { type: 'Online', description: 'Streaming com interpretação integrada' }
    ],
    duration: 'Por evento',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  'Religioso': {
    fullDescription: 'Facilitamos a participação plena de pessoas surdas em serviços religiosos e cerimónias. Os nossos intérpretes compreendem a importância espiritual destes momentos e interpretam com sensibilidade e respeito.',
    benefits: [
      'Interpretação respeitosa e sensível',
      'Conhecimento de vocabulário religioso',
      'Flexibilidade de horários',
      'Experiência em diferentes denominações'
    ],
    modalities: [
      { type: 'Presencial', description: 'Cultos, missas e cerimónias' }
    ],
    duration: 'Por serviço ou cerimónia',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  'Online': {
    fullDescription: 'Oferecemos serviços de interpretação remota de alta qualidade para videoconferências, webinars e aulas online. Utilizamos as melhores plataformas e tecnologias para garantir uma comunicação fluida.',
    benefits: [
      'Sem necessidade de deslocação',
      'Flexibilidade de horários',
      'Gravação disponível',
      'Múltiplas plataformas suportadas'
    ],
    modalities: [
      { type: 'Online', description: 'Zoom, Teams, Google Meet e outras' }
    ],
    duration: 'Por hora ou sessão',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  }
};

export function ServiceDetailsModal({ service, children }: ServiceDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const details = serviceDetails[service.name] || serviceDetails['Educação'];

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

        {/* Service Image or Video */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {details.videoUrl ? (
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

        {/* Full Description */}
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {details.fullDescription}
          </p>

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

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duração: {details.duration}</span>
          </div>

          {/* Examples */}
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
