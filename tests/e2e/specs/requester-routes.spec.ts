import { expect, test } from '@playwright/test'
import { type SmokeRoute, visitAndCapture } from './smoke'

const REQUESTER = process.env.REQUESTER_URL ?? 'http://localhost:5171'

// Requester routes of docs/inventory/05-route-map.md at their new paths (architecture.md §3).
const routes: SmokeRoute[] = [
  { path: '/', name: 'overview', expectText: 'Bem-vindo, João!' },
  { path: '/requests', name: 'requests', expectText: 'Minhas Solicitações' },
  { path: '/requests/new', name: 'requests-new', expectText: 'Nova Solicitação' },
  { path: '/requests/REQ-001', name: 'request-details', expectText: 'REQ-001' },
  { path: '/interpreters', name: 'interpreters', expectText: 'Intérpretes' },
  { path: '/favorites', name: 'favorites', expectText: 'Intérpretes Favoritos' },
  { path: '/history', name: 'history', expectText: 'Histórico de Solicitações' },
  { path: '/reviews', name: 'reviews', expectText: 'Minhas Avaliações' },
  { path: '/profile', name: 'profile', expectText: 'Meu Perfil' },
  { path: '/settings', name: 'settings', expectText: 'Notificações' },
  { path: '/interpreters/maria-silva', name: 'interpreter-profile', expectText: 'Sobre o Intérprete' },
  { path: '/interpreters/maria-silva/videos', name: 'interpreter-videos', expectText: 'Vídeos de Maria Silva' },
  { path: '/interpreters/maria-silva/articles', name: 'interpreter-articles', expectText: 'Artigos de Maria Silva' },
  { path: '/interpreters/maria-silva/articles/0', name: 'interpreter-article', expectText: 'Maria Silva' },
  { path: '/does-not-exist', name: 'not-found', expectText: 'Página não encontrada' },
]

for (const route of routes) {
  test(`requester ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, REQUESTER, 'D3', route)
  })
}

// The entry pages, without a session (an open session would move on to the area).
const entries: SmokeRoute[] = [
  { path: '/login', name: 'login', expectText: 'Entrar' },
  { path: '/register', name: 'register', expectText: 'Criar conta' },
  { path: '/recover-password', name: 'recover-password', expectText: 'Recuperar a palavra-passe' },
]
test.describe('entry pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  for (const route of entries) {
    test(`requester ${route.path} renders without errors`, async ({ page }) => {
      await visitAndCapture(page, REQUESTER, 'D3', route)
    })
  }
})

test('requester: a card on /interpreters opens the profile inside requester-web', async ({ page }) => {
  await page.goto(`${REQUESTER}/interpreters`)
  await page.getByRole('link', { name: /Ver Perfil/ }).first().click()
  await expect(page).toHaveURL(new RegExp(`^${REQUESTER}/interpreters/[a-z-]+$`))
  await expect(page.getByText('Sobre o Intérprete').first()).toBeVisible()
})

test('requester: /requests/new keeps the ?interpreter= pre-selection', async ({ page }) => {
  await page.goto(`${REQUESTER}/requests/new?interpreter=maria-silva`)
  await expect(page).toHaveURL(`${REQUESTER}/requests/new?interpreter=maria-silva`)
  await expect(page.getByText('Nova Solicitação').first()).toBeVisible()
})

test('requester: a path that never existed (e.g. /requests/REQ-001/edit) gets the Portuguese 404', async ({ page }) => {
  await page.goto(`${REQUESTER}/requests/REQ-001/edit`)
  await expect(page.getByText('Página não encontrada')).toBeVisible()
})
