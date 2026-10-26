import { test } from '@playwright/test'
import { ADMIN_URL as ADMIN } from '../local'
import { type SmokeRoute, visitAndCapture } from './smoke'

// Admin routes of docs/inventory/05-route-map.md at their new paths (architecture.md §3; AD-005 for
// verifications), signed in as the super_admin (admin.setup.ts). Since H1 the team, configuration,
// legal, document type and audit screens read the local database.
const routes: SmokeRoute[] = [
  { path: '/', name: 'overview', expectText: 'Dashboard Administrativo' },
  { path: '/interpreters', name: 'interpreters', expectText: 'Intérpretes' },
  { path: '/verifications', name: 'verifications', expectText: 'Gestão de Verificações' },
  { path: '/verifications/requests', name: 'verification-requests', expectText: 'Pedidos de Verificação' },
  { path: '/verifications/history', name: 'verification-history', expectText: 'Histórico de Verificações' },
  { path: '/requesters', name: 'requesters', expectText: 'Solicitantes' },
  { path: '/organizations', name: 'organizations', expectText: 'Organizações' },
  { path: '/requests', name: 'requests', expectText: 'Gestão de Solicitações' },
  { path: '/requests/1', name: 'request-details', expectText: 'Detalhes da Solicitação' },
  { path: '/payments', name: 'payments', expectText: 'Gestão de Pagamentos' },
  { path: '/catalog/services', name: 'catalog-services', expectText: 'Serviços' },
  { path: '/catalog/languages', name: 'catalog-languages', expectText: 'Línguas' },
  { path: '/catalog/specialties', name: 'catalog-specialties', expectText: 'Especialidades' },
  { path: '/content/testimonials', name: 'content-testimonials', expectText: 'Gestão de Testemunhos' },
  { path: '/content/success-cases', name: 'content-success-cases', expectText: 'Casos de Sucesso' },
  { path: '/reports', name: 'reports', expectText: 'Relatórios de Impacto' },
  { path: '/settings/config', name: 'settings-config', expectText: 'Configuração da plataforma' },
  { path: '/settings/legal', name: 'settings-legal', expectText: 'Documentos legais' },
  { path: '/settings/document-types', name: 'settings-document-types', expectText: 'Tipos de documento da verificação' },
  { path: '/team', name: 'team', expectText: 'Equipa' },
  { path: '/audit', name: 'audit', expectText: 'Auditoria' },
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
  { path: '/recover-password', name: 'recover-password', expectText: 'Recuperar' },
  { path: '/does-not-exist', name: 'not-found', expectText: 'Página não encontrada' },
]

for (const route of routes) {
  test(`admin ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, ADMIN, 'H1/admin-routes', route)
  })
}
