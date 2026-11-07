// All the site content for the services lives here: the picture by icon key, and the examples
// and the modal details by the catalog slug, which is fixed once the service exists (AD-032).
// Name, description, price and order come from the database (catalogs.md, site-web /services);
// a service the team adds without content here shows only those.
import educationImg from '@portal-dos-interpretes/ui/assets/services/education.jpg'
import eventsImg from '@portal-dos-interpretes/ui/assets/services/events.jpg'
import healthImg from '@portal-dos-interpretes/ui/assets/services/health.jpg'
import legalImg from '@portal-dos-interpretes/ui/assets/services/legal.jpg'
import onlineImg from '@portal-dos-interpretes/ui/assets/services/online.jpg'
import presencialImg from '@portal-dos-interpretes/ui/assets/services/presencial.jpg'
import religiousImg from '@portal-dos-interpretes/ui/assets/services/religious.jpg'

/** The picture of a service by its icon key (catalog.services.icon). */
export const SERVICE_IMAGES: Readonly<Record<string, string>> = {
  education: educationImg,
  health: healthImg,
  legal: legalImg,
  events: eventsImg,
  religious: religiousImg,
  online: onlineImg,
  business: presencialImg,
}

/** Examples shown on the card, by the service's slug. */
export const SERVICE_EXAMPLES: Readonly<Record<string, readonly string[]>> = {
  educacao: ['Aulas e palestras', 'Defesas de tese', 'Reuniões de pais', 'Formação profissional'],
  saude: ['Consultas médicas', 'Internamentos', 'Urgências', 'Apoio psicológico'],
  juridico: ['Audiências em tribunal', 'Depoimentos', 'Consultas legais', 'Assinatura de documentos'],
  eventos: ['Conferências', 'Espectáculos culturais', 'Eventos corporativos', 'Cerimónias'],
  religioso: ['Cultos e missas', 'Casamentos', 'Funerais', 'Retiros espirituais'],
  online: ['Videoconferências', 'Aulas online', 'Webinars', 'Entrevistas remotas'],
}

/** The extended details in the modal, by the service's slug; without them the modal shows the
 * description from the database. The way it is charged comes from pricing_mode, never from here. */
export const SERVICE_DETAILS: Readonly<Record<string, {
  fullDescription: string;
  benefits: string[];
  modalities: { type: string; description: string }[];
  videoUrl?: string;
}>> = {
  educacao: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  saude: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  juridico: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  eventos: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  religioso: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  online: {
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
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  }
};
