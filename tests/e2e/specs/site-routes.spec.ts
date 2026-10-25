import { expect, test } from '@playwright/test'
import { type SmokeRoute, visitAndCapture } from './smoke'

const SITE = process.env.SITE_URL ?? 'http://localhost:5170'

// Site routes of docs/inventory/05-route-map.md §1 (step D1).
const routes: SmokeRoute[] = [
  { path: '/', name: 'home', expectText: 'Acesso Universal.' },
  { path: '/services', name: 'services', expectText: 'Serviços de Interpretação' },
  { path: '/how-it-works', name: 'how-it-works', expectText: 'Como Funciona' },
  { path: '/impact', name: 'impact', expectText: 'Transformando Vidas' },
  { path: '/contact', name: 'contact', expectText: 'Entre em Contacto' },
  { path: '/for-requesters', name: 'for-requesters', expectText: 'Precisa de um' },
  { path: '/for-interpreters', name: 'for-interpreters', expectText: 'Rede de Intérpretes' },
  { path: '/interpreters', name: 'interpreters', expectText: 'Todos Intérpretes' },
  { path: '/tutorials', name: 'tutorials', expectText: 'Tutorias' },
]

for (const route of routes) {
  test(`site ${route.path} renders without errors`, async ({ page }) => {
    await visitAndCapture(page, SITE, 'D1', route)
  })
}

test('site /home redirects to /', async ({ page }) => {
  await page.goto(`${SITE}/home`)
  await expect(page).toHaveURL(`${SITE}/`)
})

test('site unknown path shows the Portuguese 404', async ({ page }) => {
  await page.goto(`${SITE}/does-not-exist`)
  await expect(page.getByText('Página não encontrada')).toBeVisible()
  await page.screenshot({ path: '../../docs/plan/evidence/D1/not-found.jpg', type: 'jpeg', quality: 75 })
})

test('site interpreter card leads to the requester login with returnTo', async ({ page }) => {
  await page.goto(`${SITE}/interpreters`)
  const link = page.getByRole('link', { name: /Ver Perfil/ }).first()
  await expect(link).toHaveAttribute('href', /^http:\/\/localhost:5171\/login\?returnTo=%2Finterpreters%2F/)
})
