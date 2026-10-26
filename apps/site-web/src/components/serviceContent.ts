// Site content for the services, keyed by the catalog slug: the picture and the examples on the
// card. Name, description, price and order come from the database (catalogs.md, site-web
// /services); a service the team adds without content here shows only those.
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
