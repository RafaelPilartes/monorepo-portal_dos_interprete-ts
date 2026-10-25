import { test } from '@playwright/test'
import { type SmokeRoute, visitAndCapture } from './smoke'

const INTERPRETER = process.env.INTERPRETER_URL ?? 'http://localhost:5172'

// Interpreter routes of docs/inventory/05-route-map.md at their new paths (architecture.md §3; AD-005, AD-017).
const routes: SmokeRoute[] = [
  { path: '/', name: 'overview', expectText: 'Olá, Maria!' },
  { path: '/requests', name: 'requests', expectText: 'Solicitações' },
  { path: '/open-requests', name: 'open-requests', expectText: 'Solicitações Abertas' },
  { path: '/requests/req-101', name: 'request-details', expectText: 'req-101' },
  { path: '/schedule', name: 'schedule', expectText: 'Minha Agenda' },
  { path: '/availability', name: 'availability', expectText: 'Disponibilidade' },
  { path: '/earnings', name: 'earnings', expectText: 'Ganhos' },
  { path: '/reviews', name: 'reviews', expectText: 'Avaliações' },
  { path: '/profile', name: 'profile', expectText: 'Meu Perfil' },
  { path: '/profile/overview', name: 'profile-overview', expectText: 'Visão Geral do Perfil' },
  { path: '/profile/experience', name: 'profile-experience', expectText: 'Experiência Profissional' },
  { path: '/profile/services', name: 'profile-services', expectText: 'Serviços' },
  { path: '/profile/content', name: 'profile-content', expectText: 'Conteúdos' },
  { path: '/profile/reviews', name: 'profile-reviews', expectText: 'Avaliações' },
  { path: '/profile/contact', name: 'profile-contact', expectText: 'Contacto' },
  { path: '/verification', name: 'verification', expectText: 'Verificação' },
  { path: '/verification/documents', name: 'verification-documents', expectText: 'Documentos' },
  { path: '/settings', name: 'settings', expectText: 'Configurações' },
  { path: '/opportunities', name: 'opportunities', expectText: 'Bolsa de Oportunidades' },
  { path: '/events', name: 'events', expectText: 'Eventos e Masterclasses' },
  { path: '/library', name: 'library', expectText: 'Biblioteca de Recursos' },
  { path: '/library/legal', name: 'library-legal', expectText: 'Apoio Jurídico e Ético' },
  { path: '/community/feed', name: 'community-feed', expectText: 'Comunidade' },
  { path: '/community/forum', name: 'community-forum', expectText: 'Fórum' },
  { path: '/training', name: 'training', expectText: 'Formação Contínua' },
  { path: '/mentorship', name: 'mentorship', expectText: 'Mentorias' },
  { path: '/benefits', name: 'benefits', expectText: 'Benefícios e Parcerias' },
  { path: '/support', name: 'support', expectText: 'Suporte e Ouvidoria' },
  { path: '/interpreters/maria-silva', name: 'colleague-profile', expectText: 'Sobre o Intérprete' },
  { path: '/login', name: 'login', expectText: 'Bem-vindo de volta' },
  { path: '/register', name: 'register', expectText: 'Criar Conta' },
  { path: '/does-not-exist', name: 'not-found', expectText: 'Página não encontrada' },
]

for (const route of routes) {
  test(`interpreter ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, INTERPRETER, 'D4', route)
  })
}

