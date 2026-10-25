import { test } from '@playwright/test'
import { type SmokeRoute, visitAndCapture } from './smoke'

const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:5173'

// Admin routes of docs/inventory/05-route-map.md at their new paths (architecture.md §3; AD-005 for verifications).
const routes: SmokeRoute[] = [
  { path: '/', name: 'overview', expectText: 'Dashboard Administrativo' },
  { path: '/interpreters', name: 'interpreters', expectText: 'Gestão de Intérpretes' },
  { path: '/interpreters/1', name: 'interpreter-details', expectText: 'Detalhes do Intérprete' },
  { path: '/verifications', name: 'verifications', expectText: 'Gestão de Verificações' },
  { path: '/verifications/requests', name: 'verification-requests', expectText: 'Pedidos de Verificação' },
  { path: '/verifications/history', name: 'verification-history', expectText: 'Histórico de Verificações' },
  { path: '/requesters', name: 'requesters', expectText: 'Gestão de Solicitantes' },
  { path: '/requesters/1', name: 'requester-details', expectText: 'Detalhes do Solicitante' },
  { path: '/requests', name: 'requests', expectText: 'Gestão de Solicitações' },
  { path: '/requests/1', name: 'request-details', expectText: 'Detalhes da Solicitação' },
  { path: '/payments', name: 'payments', expectText: 'Gestão de Pagamentos' },
  { path: '/catalog/services', name: 'catalog-services', expectText: 'Tipos de Serviço' },
  { path: '/content/testimonials', name: 'content-testimonials', expectText: 'Gestão de Testemunhos' },
  { path: '/content/success-cases', name: 'content-success-cases', expectText: 'Casos de Sucesso' },
  { path: '/reports', name: 'reports', expectText: 'Relatórios de Impacto' },
  { path: '/settings/config', name: 'settings-config', expectText: 'Configurações Gerais' },
  { path: '/team', name: 'team', expectText: 'Gestão de Equipa' },
  { path: '/audit', name: 'audit', expectText: 'Auditoria Avançada' },
  { path: '/community/opportunities', name: 'community-opportunities', expectText: 'Gestão de Oportunidades' },
  { path: '/community/library', name: 'community-library', expectText: 'Gestão da Biblioteca' },
  { path: '/community/feed', name: 'community-feed', expectText: 'Moderação da área comunitária' },
  { path: '/community/events', name: 'community-events', expectText: 'Gestão de Eventos' },
  { path: '/community/training', name: 'community-training', expectText: 'Gestão de Formação' },
  { path: '/community/mentorship', name: 'community-mentorship', expectText: 'Gestão de Mentorias' },
  { path: '/community/forum', name: 'community-forum', expectText: 'Gestão do Fórum' },
  { path: '/community/library/legal', name: 'community-library-legal', expectText: 'Gestão Jurídica/Ética' },
  { path: '/community/partners', name: 'community-partners', expectText: 'Gestão de Parcerias' },
  { path: '/support/tickets', name: 'support-tickets', expectText: 'Suporte e Ouvidoria' },
  { path: '/login', name: 'login', expectText: 'Bem-vindo de volta' },
  { path: '/recover-password', name: 'recover-password', expectText: 'Recuperar' },
  { path: '/does-not-exist', name: 'not-found', expectText: 'Página não encontrada' },
]

for (const route of routes) {
  test(`admin ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, ADMIN, 'D2', route)
  })
}
